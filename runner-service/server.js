import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /run
 * Execute code in a temporary directory
 * 
 * Body: {
 *   language: "python" | "javascript",
 *   files: [{ path: "main.py", content: "..." }]
 * }
 */
app.post("/run", async (req, res) => {
  const { language, files } = req.body;

  // Validation
  if (!language || typeof language !== "string") {
    return res.status(400).json({
      success: false,
      output: "",
      error: "Language is required",
      exitCode: 1,
    });
  }

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      success: false,
      output: "",
      error: "Files array is required and cannot be empty",
      exitCode: 1,
    });
  }

  // Validate files structure
  for (const file of files) {
    if (!file.path || typeof file.path !== "string") {
      return res.status(400).json({
        success: false,
        output: "",
        error: "Each file must have a 'path' property",
        exitCode: 1,
      });
    }
    if (file.content === undefined || typeof file.content !== "string") {
      return res.status(400).json({
        success: false,
        output: "",
        error: "Each file must have a 'content' property",
        exitCode: 1,
      });
    }
  }

  // Create temporary directory
  const tempDir = path.join(
    os.tmpdir(),
    `code-runner-${Date.now()}-${Math.random().toString(36).substring(7)}`
  );

  try {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });

    // Write all files to temp directory
    for (const file of files) {
      const filePath = path.join(tempDir, file.path);
      const dirPath = path.dirname(filePath);

      // Create directory structure if needed
      await fs.mkdir(dirPath, { recursive: true });

      // Write file content
      await fs.writeFile(filePath, file.content, "utf-8");
    }

    // Determine entry file and command based on language
    let command, args, entryFile;

    switch (language.toLowerCase()) {
      case "python":
      case "py":
        // Find Python entry file (main.py, app.py, or first .py file)
        entryFile =
          files.find((f) => f.path.endsWith("main.py"))?.path ||
          files.find((f) => f.path.endsWith("app.py"))?.path ||
          files.find((f) => f.path.endsWith(".py"))?.path;

        if (!entryFile) {
          throw new Error("No Python file found");
        }

        command = "python";
        args = [path.join(tempDir, entryFile)];
        break;

      case "javascript":
      case "js":
      case "node":
        // Find JavaScript entry file (main.js, app.js, index.js, or first .js file)
        entryFile =
          files.find((f) => f.path.endsWith("main.js"))?.path ||
          files.find((f) => f.path.endsWith("app.js"))?.path ||
          files.find((f) => f.path.endsWith("index.js"))?.path ||
          files.find((f) => f.path.endsWith(".js"))?.path;

        if (!entryFile) {
          throw new Error("No JavaScript file found");
        }

        command = "node";
        args = [path.join(tempDir, entryFile)];
        break;

      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Execute command with timeout
    const timeout = 5000; // 5 seconds
    let stdout = "";
    let stderr = "";
    let exitCode = 1;

    const childProcess = spawn(command, args, {
      cwd: tempDir,
      stdio: ["ignore", "pipe", "pipe"],
    });

    // Capture stdout
    childProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Capture stderr
    childProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Set timeout
    const timeoutId = setTimeout(() => {
      childProcess.kill();
      stderr += "\nExecution timed out after 5 seconds";
    }, timeout);

    // Wait for process to exit
    await new Promise((resolve) => {
      childProcess.on("exit", (code) => {
        exitCode = code ?? 1;
        clearTimeout(timeoutId);
        resolve();
      });
    });

    // Determine success
    const success = exitCode === 0 && stderr.trim().length === 0;

    // Return result
    res.json({
      success,
      output: stdout.trim(),
      error: stderr.trim() || null,
      exitCode,
    });
  } catch (error) {
    console.error("Execution error:", error);
    res.status(500).json({
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      exitCode: 1,
    });
  } finally {
    // Cleanup: Delete temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error("Failed to cleanup temp directory:", cleanupError);
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "runner-service" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Runner service listening on http://localhost:${PORT}`);
  console.log(`📝 POST /run - Execute code`);
  console.log(`❤️  GET /health - Health check`);
});

