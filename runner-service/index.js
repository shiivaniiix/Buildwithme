/**
 * Secure Code Runner Service
 * 
 * Executes user code in isolated Docker containers with strict security limits.
 * Supports: Python, JavaScript, C, C++, Java
 */

import express from "express";
import cors from "cors";
import Docker from "dockerode";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { mkdtemp, writeFile, rm, mkdir } from "fs/promises";

const app = express();
const PORT = process.env.RUNNER_PORT || 3001;

// Docker client
const docker = new Docker();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

/**
 * Execute code in Docker container
 */
async function executeCode(language, files, timeout = 5000) {
  const tempDir = await mkdtemp(join(tmpdir(), "code-runner-"));
  
  try {
    // Create folder structure and write files
    for (const file of files) {
      // Normalize path separators (handle both / and \)
      const normalizedPath = file.path.replace(/\\/g, "/");
      const filePath = join(tempDir, normalizedPath);
      const dirPath = dirname(filePath);
      
      // Create directory if needed (recursive)
      try {
        await mkdir(dirPath, { recursive: true });
      } catch (err) {
        // Directory might already exist, ignore error
        if (err.code !== "EEXIST") {
          throw err;
        }
      }
      
      // Write file
      await writeFile(filePath, file.content, "utf-8");
    }

    // Determine entry point and command based on language
    let imageName;
    let command;
    let entryPoint;

    switch (language.toLowerCase()) {
      case "python":
        imageName = "runner-python";
        entryPoint = files.find(f => f.path.endsWith(".py") && (f.path === "main.py" || f.path.endsWith("/main.py")))?.path || files.find(f => f.path.endsWith(".py"))?.path;
        if (!entryPoint) {
          throw new Error("No Python file found");
        }
        command = `python ${entryPoint}`;
        break;

      case "javascript":
      case "js":
      case "node":
        imageName = "runner-node";
        entryPoint = files.find(f => f.path.endsWith(".js") && (f.path === "main.js" || f.path.endsWith("/main.js")))?.path || files.find(f => f.path.endsWith(".js"))?.path;
        if (!entryPoint) {
          throw new Error("No JavaScript file found");
        }
        command = `node ${entryPoint}`;
        break;

      case "c":
        imageName = "runner-c";
        entryPoint = files.find(f => f.path.endsWith(".c") && (f.path === "main.c" || f.path.endsWith("/main.c")))?.path || files.find(f => f.path.endsWith(".c"))?.path;
        if (!entryPoint) {
          throw new Error("No C file found");
        }
        const cBaseName = entryPoint.replace(/\.c$/, "");
        command = `gcc ${entryPoint} -o ${cBaseName} && ./${cBaseName}`;
        break;

      case "cpp":
      case "c++":
        imageName = "runner-cpp";
        entryPoint = files.find(f => (f.path.endsWith(".cpp") || f.path.endsWith(".cxx")) && (f.path.includes("main.") || f.path.endsWith("/main.cpp")))?.path || files.find(f => f.path.endsWith(".cpp") || f.path.endsWith(".cxx"))?.path;
        if (!entryPoint) {
          throw new Error("No C++ file found");
        }
        const cppBaseName = entryPoint.replace(/\.(cpp|cxx)$/, "");
        command = `g++ ${entryPoint} -o ${cppBaseName} && ./${cppBaseName}`;
        break;

      case "java":
        imageName = "runner-java";
        entryPoint = files.find(f => f.path.endsWith(".java") && (f.path.includes("Main.java") || f.path.endsWith("/Main.java")))?.path || files.find(f => f.path.endsWith(".java"))?.path;
        if (!entryPoint) {
          throw new Error("No Java file found");
        }
        // Normalize path for cross-platform
        const normalizedEntry = entryPoint.replace(/\\/g, "/");
        const javaDir = normalizedEntry.substring(0, normalizedEntry.lastIndexOf("/"));
        const javaFileName = normalizedEntry.substring(normalizedEntry.lastIndexOf("/") + 1);
        const javaClass = javaFileName.replace(/\.java$/, "");
        command = `cd ${javaDir || "."} && javac ${javaFileName} && java ${javaClass}`;
        break;

      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Copy files to container and execute
    const container = await docker.createContainer({
      Image: imageName,
      Cmd: ["sh", "-c", command],
      HostConfig: {
        Memory: 256 * 1024 * 1024, // 256MB
        CpuQuota: 50000, // 0.5 CPU
        CpuPeriod: 100000,
        NetworkMode: "none", // No network access
        Binds: [`${tempDir}:/workspace:ro`], // Read-only mount
        AutoRemove: true, // Remove container after execution
      },
      WorkingDir: "/workspace",
      AttachStdout: true,
      AttachStderr: true,
    });

    // Start container with timeout
    await container.start();

    // Set up timeout
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        container.kill().catch(() => {});
        reject(new Error("Execution timeout (5 seconds)"));
      }, timeout);
    });

    // Capture output
    let output = "";
    let error = "";

    // Get logs stream
    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: false,
    });

    // Collect output
    stream.on("data", (chunk) => {
      // Docker logs format: [8 bytes header][payload]
      // Header byte 0: stream type (0=stdin, 1=stdout, 2=stderr)
      if (chunk.length > 8) {
        const streamType = chunk[0];
        const payload = chunk.slice(8).toString();
        
        if (streamType === 2) {
          // stderr
          error += payload;
        } else {
          // stdout
          output += payload;
        }
      } else {
        // Fallback: treat as stdout
        output += chunk.toString();
      }
    });

    stream.on("end", () => {
      // Stream ended
    });

    // Wait for container to finish or timeout
    try {
      await Promise.race([container.wait(), timeoutPromise]);
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.message && err.message.includes("timeout")) {
        error = "Execution timeout (5 seconds)";
      } else {
        error = err.message || "Execution failed";
      }
    }

    // Wait a bit for logs to finish
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get exit code
    const inspect = await container.inspect();
    const exitCode = inspect.State.ExitCode ?? (inspect.State.Status === "exited" ? inspect.State.ExitCode : -1);

    return {
      success: exitCode === 0 && !error,
      output: output.trim(),
      error: error.trim() || (exitCode !== 0 ? `Process exited with code ${exitCode}` : null),
      exitCode,
    };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error.message || "Execution failed",
      exitCode: -1,
    };
  } finally {
    // Cleanup temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (err) {
      console.error("Failed to cleanup temp directory:", err);
    }
  }
}

/**
 * POST /run
 * Execute code
 */
app.post("/run", async (req, res) => {
  try {
    const { language, files } = req.body;

    if (!language) {
      return res.status(400).json({ error: "Language is required" });
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "Files array is required" });
    }

    // Validate files structure
    for (const file of files) {
      if (!file.path || file.content === undefined) {
        return res.status(400).json({ error: "Each file must have 'path' and 'content'" });
      }
    }

    const result = await executeCode(language, files);

    res.json(result);
  } catch (error) {
    console.error("Error executing code:", error);
    res.status(500).json({
      success: false,
      output: "",
      error: error.message || "Internal server error",
    });
  }
});

/**
 * Health check
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Code Runner Service listening on port ${PORT}`);
});

