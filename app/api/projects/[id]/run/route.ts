import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createSession } from "@/lib/executionSessions";
import { ensurePythonEnvironment } from "@/lib/pythonEnvironment";
import { detectBrowserApis, generateBrowserApiExplanation, type BrowserApiDetection } from "@/lib/browserApiDetection";

const EXECUTION_TIMEOUT = 5000; // 5 seconds
const C_EXECUTION_TIMEOUT = 2000; // 2 seconds for C (stricter)
const MAX_OUTPUT_LENGTH = 10000; // Limit output to prevent memory issues
const MAX_OUTPUT_LENGTH_C = 100000; // 100KB for C

type ExecutionState = 
  | "idle"
  | "running"
  | "waiting_for_input"
  | "completed"
  | "failed";

interface ExecutionResponse {
  state: ExecutionState;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executedAt: string;
  executionTime?: number;
  sessionId?: string;
  error?: string;
  // Legacy support
  success?: boolean;
  waitingForInput?: boolean;
  // Browser API detection (safety layer)
  browserApiDetection?: BrowserApiDetection;
  browserApiExplanation?: string;
  // Java Phase 1: Compile error flag
  compileError?: boolean;
}

interface RunRequest {
  code: string;
  language: string;
  entryFileName?: string; // Detected entry file name from frontend
  files?: Array<{ name: string; content: string }>; // Java Phase 2: All Java files
}

/**
 * POST /api/projects/[id]/run
 * 
 * Executes code for a project (Python, JavaScript, Java, or C).
 * Security: Uses child_process.spawn with timeout and output limits.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  
  
  try {
    // Parse request body
    const body: RunRequest = await request.json();
    const { code, language, entryFileName, files } = body;

    if (!code || !code.trim()) {
      return NextResponse.json(
        { 
          state: "failed" as ExecutionState,
          stdout: "", 
          stderr: "No code provided", 
          exitCode: 1, 
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        },
        { status: 400 }
      );
    }

    // Support Python, JavaScript, Java (Phase 1), and C (Phase 1)
    if (language !== "python" && language !== "javascript" && language !== "java" && language !== "c") {
      return NextResponse.json(
        { 
          state: "failed" as ExecutionState,
          stdout: "", 
          stderr: `Execution not supported for language: ${language}`, 
          exitCode: 1, 
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        },
        { status: 400 }
      );
    }

    // SAFETY LAYER: Detect browser APIs in JavaScript code (non-destructive analysis)
    let browserApiDetection: BrowserApiDetection | undefined;
    let browserApiExplanation: string | undefined;
    if (language === "javascript") {
      browserApiDetection = detectBrowserApis(code);
      if (browserApiDetection.detected) {
        browserApiExplanation = generateBrowserApiExplanation(browserApiDetection);
      }
    }

    // Create temporary file for execution
    const tempDir = os.tmpdir();
    const fileExtension = language === "python" ? ".py" : language === "java" ? ".java" : language === "c" ? ".c" : ".js";
    const tempFileName = language === "java" ? "Main.java" : language === "c" ? "main.c" : `buildwithme_${params.id}_${Date.now()}${fileExtension}`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      // Write code to temporary file
      fs.writeFileSync(tempFilePath, code, "utf-8");

      // Ensure Python environment is set up (only runs once, cached)
      if (language === "python") {
        await ensurePythonEnvironment();
      }

      // Execute code based on language (interactive mode - no pre-injected input)
      let result;
      if (language === "python") {
        result = await executePythonFile(tempFilePath, entryFileName, language);
      } else if (language === "java") {
        // Java execution routing: Detect phase based on files
        if (files && Array.isArray(files) && files.length > 0) {
          // Check if any file has packages or folder structure (Phase 3)
          const hasPackages = files.some(f => {
            if (!f.name.endsWith(".java")) return false;
            // Check for package declaration
            const hasPackageDecl = f.content.match(/^\s*package\s+\S+\s*;/m);
            // Check for folder structure (path with /)
            const hasFolderPath = f.name.includes("/");
            return hasPackageDecl || hasFolderPath;
          });
          
          if (hasPackages) {
            // Phase 3: Package and folder support
            result = await executeJavaProjectPhase3(files, tempDir, entryFileName, language);
          } else {
            // Phase 2: Multi-file, no packages
            result = await executeJavaProject(files, tempDir, entryFileName, language);
          }
        } else {
          // Phase 1: Single-file execution (backward compatibility)
          result = await executeJavaFile(tempFilePath, entryFileName, language);
        }
      } else if (language === "c") {
        // C execution routing: Detect phase based on files
        if (files && Array.isArray(files) && files.length > 0) {
          // Check if project has multiple .c files or any .h files
          const cFiles = files.filter(f => f.name.endsWith(".c"));
          const hFiles = files.filter(f => f.name.endsWith(".h"));
          const hasMultipleFiles = cFiles.length > 1 || hFiles.length > 0;
          
          if (hasMultipleFiles) {
            // Phase 3.5: Build graph with compile-then-link
            result = await executeCProjectPhase3_5(files, tempDir, entryFileName, language);
          } else {
            // Phase 1: Single-file execution (backward compatibility)
            result = await executeCFile(tempFilePath, entryFileName, language);
          }
        } else {
          // Phase 1: Single-file execution (backward compatibility)
          result = await executeCFile(tempFilePath, entryFileName, language);
        }
      } else {
        result = await executeJavaScriptFile(tempFilePath, entryFileName, language);
      }

      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      // Return execution result
      const response: ExecutionResponse = {
        state: result.state || (result.exitCode === 0 ? "completed" : "failed"),
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? null,
        executedAt: new Date().toISOString(),
        sessionId: result.sessionId,
        success: result.exitCode === 0,
        waitingForInput: result.waitingForInput || false,
        browserApiDetection,
        browserApiExplanation,
        compileError: result.compileError || false,
      };

      return NextResponse.json(response);
    } catch (executionError) {
      // Clean up temporary file on error
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }

      return NextResponse.json(
        { 
          state: "failed" as ExecutionState,
          stdout: "", 
          stderr: executionError instanceof Error ? executionError.message : "Execution failed", 
          exitCode: 1, 
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { 
        state: "failed" as ExecutionState,
        stdout: "", 
        stderr: error instanceof Error ? error.message : "Invalid request", 
        exitCode: 1, 
        executedAt: new Date().toISOString(),
        success: false,
        waitingForInput: false,
      },
      { status: 400 }
    );
  }
}

/**
 * Execute Python file using child_process.spawn
 * Security: Timeout, output limits, no shell injection
 * Detects when input() is called and pauses execution
 */
function executePythonFile(filePath: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState }> {
  return new Promise(async (resolve) => {
    // Sanitize file path to prevent directory traversal
    const sanitizedPath = path.resolve(filePath);
    if (!sanitizedPath.startsWith(os.tmpdir())) {
      resolve({
        stdout: "",
        stderr: "Invalid file path",
        exitCode: 1,
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    let hasTimedOut = false;
    let stdinCheckTimeout: NodeJS.Timeout | null = null;

    // Try python3 first, then python (for cross-platform compatibility)
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    
    // Get Python user site-packages to ensure installed packages are accessible
    const getPythonPath = async (): Promise<string> => {
      return new Promise((resolve) => {
        const siteProcess = spawn(pythonCommand, ["-c", "import site; import os; print(os.pathsep.join([site.getusersitepackages()] + site.getsitepackages()))"], {
          stdio: "pipe",
          env: {
            PATH: process.env.PATH || "",
            PYTHONUNBUFFERED: "1",
          },
        });

        let stdout = "";
        siteProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        siteProcess.on("close", () => {
          resolve(stdout.trim() || "");
        });

        siteProcess.on("error", () => {
          resolve("");
        });

        setTimeout(() => {
          siteProcess.kill();
          resolve("");
        }, 2000);
      });
    };

    const pythonPath = await getPythonPath();
    
    // Spawn Python process with stdin pipe (for interactive input)
    const pythonProcess = spawn(pythonCommand, [sanitizedPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
        PYTHONUNBUFFERED: "1",
        PYTHONPATH: pythonPath || undefined,
      },
    });

    // Set timeout for execution
    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      pythonProcess.kill("SIGKILL");
      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH) || "") + "\n[Execution timeout after 5 seconds]",
        exitCode: 124,
        state: "failed",
      });
    }, EXECUTION_TIMEOUT);

    pythonProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_LENGTH) {
        stdout += chunk.substring(0, MAX_OUTPUT_LENGTH - stdout.length);
        stdout += "\n[Output truncated due to length limit]";
      }
    });

    pythonProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_LENGTH) {
        stderr += chunk.substring(0, MAX_OUTPUT_LENGTH - stderr.length);
        stderr += "\n[Error output truncated due to length limit]";
      }
    });

    // Check for input() calls by monitoring stderr for input prompts
    // This is a heuristic approach - Python's input() doesn't always produce stderr
    // but we can detect when the process is waiting by checking if it's still running
    // and no output is being produced
    let lastOutputTime = Date.now();
    const checkForInput = () => {
      if (hasTimedOut || pythonProcess.killed) {
        return;
      }

      const timeSinceLastOutput = Date.now() - lastOutputTime;
      // If no output for 500ms and process is still running, likely waiting for input
      if (timeSinceLastOutput > 500 && pythonProcess.exitCode === null) {
        // Create a session for interactive input
        const sessionId = createSession({
          process: pythonProcess,
          language: "python",
          filePath: sanitizedPath,
        });

        clearTimeout(timeoutId);
        if (stdinCheckTimeout) {
          clearTimeout(stdinCheckTimeout);
        }

        resolve({
          stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: stderr.substring(0, MAX_OUTPUT_LENGTH),
          exitCode: null,
          waitingForInput: true,
          sessionId,
          state: "waiting_for_input",
        });
        return;
      }

      // Continue checking
      stdinCheckTimeout = setTimeout(checkForInput, 100);
    };

    // Start checking for input after initial output
    pythonProcess.stdout?.on("data", () => {
      lastOutputTime = Date.now();
    });

    pythonProcess.stderr?.on("data", () => {
      lastOutputTime = Date.now();
    });

    // Start input detection after a short delay
    setTimeout(() => {
      if (!hasTimedOut && !pythonProcess.killed) {
        checkForInput();
      }
    }, 1000);

    pythonProcess.on("close", (code) => {
      clearTimeout(timeoutId);
      if (stdinCheckTimeout) {
        clearTimeout(stdinCheckTimeout);
      }

      if (hasTimedOut) {
        return; // Already resolved in timeout handler
      }

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: stderr.substring(0, MAX_OUTPUT_LENGTH),
        exitCode: code,
        state: code === 0 ? "completed" : "failed",
      });
    });

    pythonProcess.on("error", (error) => {
      clearTimeout(timeoutId);
      if (stdinCheckTimeout) {
        clearTimeout(stdinCheckTimeout);
      }

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH) || "") + `\n[Execution error: ${error.message}]`,
        exitCode: 1,
        state: "failed",
      });
    });
  });
}

/**
 * Execute JavaScript file using Node.js
 * Security: Timeout, output limits, no shell injection
 */
function executeJavaScriptFile(filePath: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState }> {
  return new Promise((resolve) => {
    // Sanitize file path to prevent directory traversal
    const sanitizedPath = path.resolve(filePath);
    if (!sanitizedPath.startsWith(os.tmpdir())) {
      resolve({
        stdout: "",
        stderr: "Invalid file path",
        exitCode: 1,
      });
      return;
    }

    let stdout = "";
    let stderr = "";
    let hasTimedOut = false;

    const nodeCommand = "node";
    const nodeProcess = spawn(nodeCommand, [sanitizedPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
        NODE_ENV: "production",
      },
    });

    // Set timeout for execution
    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      nodeProcess.kill("SIGKILL");
      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH) || "") + "\n[Execution timeout after 5 seconds]",
        exitCode: 124,
        state: "failed",
      });
    }, EXECUTION_TIMEOUT);

    nodeProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_LENGTH) {
        stdout += chunk.substring(0, MAX_OUTPUT_LENGTH - stdout.length);
        stdout += "\n[Output truncated due to length limit]";
      }
    });

    nodeProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_LENGTH) {
        stderr += chunk.substring(0, MAX_OUTPUT_LENGTH - stderr.length);
        stderr += "\n[Error output truncated due to length limit]";
      }
    });

    nodeProcess.on("close", (code) => {
      clearTimeout(timeoutId);

      if (hasTimedOut) {
        return; // Already resolved in timeout handler
      }

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: stderr.substring(0, MAX_OUTPUT_LENGTH),
        exitCode: code,
        state: code === 0 ? "completed" : "failed",
      });
    });

    nodeProcess.on("error", (error) => {
      clearTimeout(timeoutId);

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH) || "") + `\n[Execution error: ${error.message}]`,
        exitCode: 1,
        state: "failed",
      });
    });
  });
}

/**
 * Execute Java project with multiple files (Phase 2: Multi-file, no packages)
 * Security: Timeout, output limits, no shell injection
 */
function executeJavaProject(files: Array<{ name: string; content: string }>, tempDir: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise((resolve) => {
    // Phase 2: Multi-file execution, no packages
    const javaFiles = files.filter(f => f.name.endsWith(".java"));
    
    if (javaFiles.length === 0) {
      resolve({
        stdout: "",
        stderr: "No Java files found in project",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Write all Java files to temp directory
    const javaFilePaths: string[] = [];
    javaFiles.forEach(file => {
      const filePath = path.join(tempDir, file.name);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, file.content, "utf-8");
      javaFilePaths.push(filePath);
    });

    // Find Main.java or first file with main method
    let mainClass = "Main";
    const mainFile = javaFiles.find(f => {
      const name = f.name.split("/").pop() || f.name;
      return name === "Main.java" || name === "main.java";
    });

    if (mainFile) {
      const classNameMatch = mainFile.content.match(/public\s+class\s+(\w+)/);
      if (classNameMatch) {
        mainClass = classNameMatch[1];
      }
    } else {
      // Try to find any class with main method
      for (const file of javaFiles) {
        const hasMain = file.content.match(/public\s+static\s+void\s+main\s*\(/);
        if (hasMain) {
          const classNameMatch = file.content.match(/public\s+class\s+(\w+)/);
          if (classNameMatch) {
            mainClass = classNameMatch[1];
            break;
          }
        }
      }
    }

    // Compile all Java files
    const javacCommand = "javac";
    const compileProcess = spawn(javacCommand, javaFilePaths, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: tempDir,
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let compileStdout = "";
    let compileStderr = "";

    compileProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStdout += chunk;
      }
    });

    compileProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStderr += chunk;
      }
    });

    compileProcess.on("close", (compileCode) => {
      if (compileCode !== 0) {
        // Cleanup Java files
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        // Cleanup .class files
        try {
          const classFiles = fs.readdirSync(tempDir).filter(f => f.endsWith(".class"));
          classFiles.forEach(f => {
            try {
              fs.unlinkSync(path.join(tempDir, f));
            } catch (e) {
              // Ignore
            }
          });
        } catch (e) {
          // Ignore
        }

        resolve({
          stdout: "",
          stderr: compileStderr || compileStdout || "Compilation failed",
          exitCode: compileCode,
          state: "failed",
          compileError: true,
        });
        return;
      }

      // Run the main class
      const javaCommand = "java";
      const runProcess = spawn(javaCommand, [mainClass], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: tempDir,
        env: {
          PATH: process.env.PATH || "",
        },
      });

      let runStdout = "";
      let runStderr = "";
      let hasTimedOut = false;

      const timeoutId = setTimeout(() => {
        hasTimedOut = true;
        runProcess.kill("SIGKILL");
        // Cleanup
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        try {
          const classFiles = fs.readdirSync(tempDir).filter(f => f.endsWith(".class"));
          classFiles.forEach(f => {
            try {
              fs.unlinkSync(path.join(tempDir, f));
            } catch (e) {
              // Ignore
            }
          });
        } catch (e) {
          // Ignore
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + "\n[Execution timeout after 5 seconds]",
          exitCode: 124,
          state: "failed",
          compileError: false,
        });
      }, EXECUTION_TIMEOUT);

      runProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStdout += chunk;
        } else if (runStdout.length < MAX_OUTPUT_LENGTH) {
          runStdout += chunk.substring(0, MAX_OUTPUT_LENGTH - runStdout.length);
          runStdout += "\n[Output truncated due to length limit]";
        }
      });

      runProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStderr += chunk;
        } else if (runStderr.length < MAX_OUTPUT_LENGTH) {
          runStderr += chunk.substring(0, MAX_OUTPUT_LENGTH - runStderr.length);
          runStderr += "\n[Error output truncated due to length limit]";
        }
      });

      runProcess.on("close", (runCode) => {
        clearTimeout(timeoutId);

        // Cleanup
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        try {
          const classFiles = fs.readdirSync(tempDir).filter(f => f.endsWith(".class"));
          classFiles.forEach(f => {
            try {
              fs.unlinkSync(path.join(tempDir, f));
            } catch (e) {
              // Ignore
            }
          });
        } catch (e) {
          // Ignore
        }

        if (hasTimedOut) {
          return;
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: runStderr.substring(0, MAX_OUTPUT_LENGTH),
          exitCode: runCode,
          state: runCode === 0 ? "completed" : "failed",
          compileError: false,
        });
      });

      runProcess.on("error", (error) => {
        clearTimeout(timeoutId);
        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + `\n[Execution error: ${error.message}]`,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      });
    });

    compileProcess.on("error", (error) => {
      resolve({
        stdout: "",
        stderr: `Failed to compile Java: ${error.message}. Make sure Java JDK is installed and javac is available in PATH.`,
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
    });
  });
}

/**
 * Execute Java project with packages and folders (Phase 3)
 * Security: Timeout, output limits, no shell injection
 */
function executeJavaProjectPhase3(files: Array<{ name: string; content: string }>, tempDir: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise((resolve) => {
    // Filter to only .java files
    const javaFiles = files.filter(f => !f.name.endsWith(".java") === false && f.name.endsWith(".java"));
    
    if (javaFiles.length === 0) {
      resolve({
        stdout: "",
        stderr: "No Java files found in project",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Create directory structure and write files
    const outDir = path.join(tempDir, "out");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const javaFilePaths: string[] = [];
    const fileInfos: Array<{ name: string; fullPath: string; packageName: string | null; className: string; hasMain: boolean }> = [];

    javaFiles.forEach(file => {
      // Extract package name
      const packageMatch = file.content.match(/^\s*package\s+(\S+)\s*;/m);
      const packageName = packageMatch ? packageMatch[1] : null;

      // Extract class name
      const classMatch = file.content.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : path.basename(file.name, ".java");

      // Check for main method
      const hasMain = /public\s+static\s+void\s+main\s*\(/.test(file.content);

      // Determine file path
      let filePath: string;
      if (packageName) {
        const packagePath = packageName.replace(/\./g, path.sep);
        filePath = path.join(tempDir, packagePath, path.basename(file.name));
      } else {
        filePath = path.join(tempDir, path.basename(file.name));
      }

      // Create directory if needed
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fileInfos.push({
        name: file.name,
        fullPath: filePath,
        packageName,
        className,
        hasMain,
      });

      fs.writeFileSync(filePath, file.content, "utf-8");
      javaFilePaths.push(filePath);
    });

    // Validate package matches folder structure
    for (const fileInfo of fileInfos) {
      if (fileInfo.packageName) {
        const expectedPath = fileInfo.packageName.replace(/\./g, path.sep);
        const actualDir = path.dirname(fileInfo.fullPath);
        const relativeDir = path.relative(tempDir, actualDir);
        
        if (relativeDir !== expectedPath && relativeDir !== ".") {
          // Cleanup
          javaFilePaths.forEach(filePath => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
            } catch (e) {
              // Ignore
            }
          });

          resolve({
            stdout: "",
            stderr: `Package name does not match directory structure.\n\nFile: ${fileInfo.name}\nPackage: ${fileInfo.packageName}\nExpected path: ${expectedPath}\nActual path: ${relativeDir}\n\nPlease move the file to match the package structure.`,
            exitCode: 1,
            state: "failed",
            compileError: true,
          });
          return;
        }
      }
    }

    // Find entry point (class with main method)
    const mainClasses = fileInfos.filter(f => f.hasMain);
    if (mainClasses.length === 0) {
      // Cleanup
      javaFilePaths.forEach(filePath => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          // Ignore
        }
      });

      resolve({
        stdout: "",
        stderr: "No main method found in any Java file. Please add a public static void main(String[] args) method.",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Prefer Main.java, otherwise use first main class
    let mainClassInfo = mainClasses.find(f => f.name.endsWith("Main.java")) || mainClasses[0];
    const fullyQualifiedMainClass = mainClassInfo.packageName 
      ? `${mainClassInfo.packageName}.${mainClassInfo.className}`
      : mainClassInfo.className;

    // Compile all Java files
    const javacCommand = "javac";
    const compileProcess = spawn(javacCommand, ["-d", "out", ...javaFilePaths], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: tempDir,
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let compileStdout = "";
    let compileStderr = "";

    compileProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStdout += chunk;
      }
    });

    compileProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStderr += chunk;
      }
    });

    compileProcess.on("close", (compileCode) => {
      if (compileCode !== 0) {
        // Cleanup
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        try {
          if (fs.existsSync(outDir)) {
            fs.rmSync(outDir, { recursive: true, force: true });
          }
        } catch (e) {
          // Ignore
        }

        resolve({
          stdout: "",
          stderr: compileStderr || compileStdout || "Compilation failed",
          exitCode: compileCode,
          state: "failed",
          compileError: true,
        });
        return;
      }

      // Run the main class
      const javaCommand = "java";
      const runProcess = spawn(javaCommand, ["-cp", "out", fullyQualifiedMainClass], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: tempDir,
        env: {
          PATH: process.env.PATH || "",
        },
      });

      let runStdout = "";
      let runStderr = "";
      let hasTimedOut = false;

      const timeoutId = setTimeout(() => {
        hasTimedOut = true;
        runProcess.kill("SIGKILL");
        // Cleanup
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        try {
          if (fs.existsSync(outDir)) {
            fs.rmSync(outDir, { recursive: true, force: true });
          }
        } catch (e) {
          // Ignore
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + "\n[Execution timeout after 5 seconds]",
          exitCode: 124,
          state: "failed",
          compileError: false,
        });
      }, EXECUTION_TIMEOUT);

      runProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStdout += chunk;
        } else if (runStdout.length < MAX_OUTPUT_LENGTH) {
          runStdout += chunk.substring(0, MAX_OUTPUT_LENGTH - runStdout.length);
          runStdout += "\n[Output truncated due to length limit]";
        }
      });

      runProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStderr += chunk;
        } else if (runStderr.length < MAX_OUTPUT_LENGTH) {
          runStderr += chunk.substring(0, MAX_OUTPUT_LENGTH - runStderr.length);
          runStderr += "\n[Error output truncated due to length limit]";
        }
      });

      runProcess.on("close", (runCode) => {
        clearTimeout(timeoutId);

        // Cleanup
        javaFilePaths.forEach(filePath => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            // Ignore
          }
        });
        try {
          if (fs.existsSync(outDir)) {
            fs.rmSync(outDir, { recursive: true, force: true });
          }
        } catch (e) {
          // Ignore
        }

        if (hasTimedOut) {
          return;
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: runStderr.substring(0, MAX_OUTPUT_LENGTH),
          exitCode: runCode,
          state: runCode === 0 ? "completed" : "failed",
          compileError: false,
        });
      });

      runProcess.on("error", (error) => {
        clearTimeout(timeoutId);
        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + `\n[Execution error: ${error.message}]`,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      });
    });

    compileProcess.on("error", (error) => {
      resolve({
        stdout: "",
        stderr: `Failed to compile Java: ${error.message}. Make sure Java JDK is installed and javac is available in PATH.`,
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
    });
  });
}

/**
 * Execute Java file using compile → run pipeline (Phase 1)
 * Security: Timeout, output limits, no shell injection
 * Phase 1: Single-file execution only (Main.java)
 */
function executeJavaFile(filePath: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise((resolve) => {
    // Sanitize file path to prevent directory traversal
    const sanitizedPath = path.resolve(filePath);
    if (!sanitizedPath.startsWith(os.tmpdir())) {
      resolve({
        stdout: "",
        stderr: "Invalid file path",
        exitCode: 1,
        state: "failed",
        compileError: false,
      });
      return;
    }

    const tempDir = path.dirname(sanitizedPath);
    const className = "Main";
    const classFilePath = path.join(tempDir, `${className}.class`);

    // Step 1: Compile Java file
    const javacCommand = "javac";
    const compileProcess = spawn(javacCommand, [sanitizedPath], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: tempDir,
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let compileStdout = "";
    let compileStderr = "";

    compileProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStdout += chunk;
      }
    });

    compileProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (compileStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
        compileStderr += chunk;
      }
    });

    compileProcess.on("close", (compileCode) => {
      if (compileCode !== 0) {
        // Compilation failed - return compile error
        resolve({
          stdout: "",
          stderr: compileStderr || compileStdout || "Compilation failed",
          exitCode: compileCode,
          state: "failed",
          compileError: true,
        });
        return;
      }

      // Step 2: Compilation succeeded - run the program
      const javaCommand = "java";
      const runProcess = spawn(javaCommand, [className], {
        stdio: ["pipe", "pipe", "pipe"],
        cwd: tempDir,
        env: {
          PATH: process.env.PATH || "",
        },
      });

      let runStdout = "";
      let runStderr = "";
      let hasTimedOut = false;

      // Set timeout for execution
      const timeoutId = setTimeout(() => {
        hasTimedOut = true;
        runProcess.kill("SIGKILL");
        // Cleanup .class file
        try {
          if (fs.existsSync(classFilePath)) {
            fs.unlinkSync(classFilePath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + "\n[Execution timeout after 5 seconds]",
          exitCode: 124,
          state: "failed",
          compileError: false,
        });
      }, EXECUTION_TIMEOUT);

      runProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStdout += chunk;
        } else if (runStdout.length < MAX_OUTPUT_LENGTH) {
          runStdout += chunk.substring(0, MAX_OUTPUT_LENGTH - runStdout.length);
          runStdout += "\n[Output truncated due to length limit]";
        }
      });

      runProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          runStderr += chunk;
        } else if (runStderr.length < MAX_OUTPUT_LENGTH) {
          runStderr += chunk.substring(0, MAX_OUTPUT_LENGTH - runStderr.length);
          runStderr += "\n[Error output truncated due to length limit]";
        }
      });

      runProcess.on("close", (runCode) => {
        clearTimeout(timeoutId);
        
        // Cleanup .class file
        try {
          if (fs.existsSync(classFilePath)) {
            fs.unlinkSync(classFilePath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        if (hasTimedOut) {
          return; // Already resolved in timeout handler
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: runStderr.substring(0, MAX_OUTPUT_LENGTH),
          exitCode: runCode,
          state: runCode === 0 ? "completed" : "failed",
          compileError: false,
        });
      });

      runProcess.on("error", (error) => {
        clearTimeout(timeoutId);
        
        // Cleanup .class file
        try {
          if (fs.existsSync(classFilePath)) {
            fs.unlinkSync(classFilePath);
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }

        resolve({
          stdout: runStdout.substring(0, MAX_OUTPUT_LENGTH),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH) || "") + `\n[Execution error: ${error.message}]`,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      });
    });

    compileProcess.on("error", (error) => {
      resolve({
        stdout: "",
        stderr: `Failed to compile Java: ${error.message}. Make sure Java JDK is installed and javac is available in PATH.`,
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
    });
  });
}

/**
 * Check if Docker is available and running
 */
function checkDockerAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    const dockerCommand = "docker";
    const checkProcess = spawn(dockerCommand, ["ps"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let hasOutput = false;
    checkProcess.stdout?.on("data", () => {
      hasOutput = true;
    });

    checkProcess.stderr?.on("data", (data) => {
      // Docker daemon not running or permission errors
      const error = data.toString();
      if (error.includes("Cannot connect") || error.includes("permission denied")) {
        hasOutput = false;
        // Developer-only logging
        if (process.env.NODE_ENV !== "production") {
          console.error(`[C Execution] Docker daemon issue: ${error.trim()}`);
        }
      }
    });

    checkProcess.on("close", (code) => {
      resolve(hasOutput || code === 0);
    });

    checkProcess.on("error", (error) => {
      // Developer-only logging
      if (process.env.NODE_ENV !== "production") {
        console.error(`[C Execution] Docker check failed: ${error.message}`);
      }
      resolve(false);
    });

    // Timeout after 3 seconds
    setTimeout(() => {
      checkProcess.kill();
      resolve(false);
    }, 3000);
  });
}

/**
 * Execute C project with build graph (Phase 3.5)
 * Security: Docker container with resource limits, timeout, output limits
 * Phase 3.5: Compile-then-link build system
 */
function executeCProjectPhase3_5(files: Array<{ name: string; content: string }>, tempDir: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise(async (resolve) => {
    // Filter to only .c files (headers are included via include paths)
    const cFiles = files.filter(f => f.name.endsWith(".c"));
    
    if (cFiles.length === 0) {
      resolve({
        stdout: "",
        stderr: "No C source files (.c) found in project",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Check for main() function in all .c files
    const mainFunctions: Array<{ file: string; line: number }> = [];
    cFiles.forEach(file => {
      const mainMatch = file.content.match(/^\s*(?:int|void)\s+main\s*\(/m);
      if (mainMatch) {
        const lines = file.content.substring(0, mainMatch.index).split('\n');
        mainFunctions.push({ file: file.name, line: lines.length });
      }
    });

    // Validate entry point
    if (mainFunctions.length === 0) {
      resolve({
        stdout: "",
        stderr: "❌ No main() function found in any .c file.\n\nPlease add a main() function to your project.",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    if (mainFunctions.length > 1) {
      const filesList = mainFunctions.map(m => `  - ${m.file}:${m.line}`).join('\n');
      resolve({
        stdout: "",
        stderr: `❌ Multiple main() functions found:\n\n${filesList}\n\nOnly one main() function is allowed.`,
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Check Docker availability
    const dockerAvailable = await checkDockerAvailability();
    if (!dockerAvailable) {
      const isDevelopment = process.env.NODE_ENV !== "production";
      
      if (isDevelopment) {
        console.error("[C Execution] Docker is not available. Check if Docker daemon is running.");
      }
      
      let errorMessage: string;
      if (isDevelopment) {
        errorMessage = "❌ Docker is required for local execution.\n\n" +
                       "C programs run inside a sandboxed container for security and platform independence.\n" +
                       "Please install and start Docker, then try again.\n\n" +
                       "Install Docker: https://docs.docker.com/get-docker/";
      } else {
        errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                       "Please try again later. If the problem persists, contact support.";
      }
      
      resolve({
        stdout: "",
        stderr: errorMessage,
        exitCode: 1,
        state: "failed",
        compileError: false,
      });
      return;
    }

    // Create directory structure and write all files
    const filePaths: string[] = [];
    const includeDirs = new Set<string>(); // Track unique include directories
    
    cFiles.forEach(file => {
      const filePath = path.join(tempDir, file.name);
      const dir = path.dirname(filePath);
      
      // Create directory structure
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, file.content, "utf-8");
      filePaths.push(file.name); // Store relative path for Docker
      
      // Add directory to include paths if not root
      if (dir !== tempDir) {
        includeDirs.add(path.relative(tempDir, dir));
      }
    });

    // Write header files
    const hFiles = files.filter(f => f.name.endsWith(".h"));
    hFiles.forEach(file => {
      const filePath = path.join(tempDir, file.name);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content, "utf-8");
      
      // Add directory to include paths if not root
      if (dir !== tempDir) {
        includeDirs.add(path.relative(tempDir, dir));
      }
    });

    // Normalize path for Docker
    const normalizedDir = path.resolve(tempDir);
    const dockerImage = "gcc:latest";
    
    // Build compile commands: gcc -c file.c -o file.o for each .c file
    const escapedFilePaths = filePaths.map(f => f.replace(/[^a-zA-Z0-9./_-]/g, "")).sort(); // Sort alphabetically
    const includeArgs = Array.from(includeDirs).map(dir => `-I/workspace/${dir.replace(/\\/g, "/")}`).join(" ");
    
    // Build compile commands for each .c file
    const compileCommands = escapedFilePaths.map(filePath => {
      const normalizedPath = `/workspace/${filePath.replace(/\\/g, "/")}`;
      const objPath = normalizedPath.replace(/\.c$/, ".o");
      const includePart = includeArgs ? `${includeArgs} ` : "";
      return `gcc -c ${includePart}${normalizedPath} -o ${objPath}`;
    });
    
    // Build link command: gcc file1.o file2.o ... -o /tmp/main
    const objFiles = escapedFilePaths.map(f => `/workspace/${f.replace(/\\/g, "/").replace(/\.c$/, ".o")}`);
    const linkCommand = `gcc ${objFiles.join(" ")} -o /tmp/main`;
    
    // Combine all build steps
    const buildCommand = compileCommands.join(" && ") + " && " + linkCommand;
    
    const dockerArgs = [
      "run",
      "--rm",
      "--memory=128m",
      "--cpus=1.0",
      "--network=none",
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=50m",
      "-v", `${normalizedDir}:/workspace:ro`,
      "-w", "/workspace",
      dockerImage,
      "sh", "-c", buildCommand
    ];

    // Execute build in Docker container
    const dockerCommand = "docker";
    const dockerProcess = spawn(dockerCommand, dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let stdout = "";
    let stderr = "";
    let hasTimedOut = false;

    // Set timeout for build (5 seconds for compilation)
    const BUILD_TIMEOUT = 5000;
    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      dockerProcess.kill("SIGKILL");
      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + "\n[Build timeout after 5 seconds]",
        exitCode: 124,
        state: "failed",
        compileError: true,
      });
    }, BUILD_TIMEOUT);

    dockerProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stdout.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_LENGTH_C) {
        stdout += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stdout.length);
        stdout += "\n[Output truncated due to length limit]";
      }
    });

    dockerProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stderr.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_LENGTH_C) {
        stderr += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stderr.length);
        stderr += "\n[Error output truncated due to length limit]";
      }
    });

    dockerProcess.on("close", (code) => {
      clearTimeout(timeoutId);

      if (hasTimedOut) {
        return;
      }

      // Check if it's a compilation error
      const isCompileError = code !== 0 && (
        stderr.includes("error:") ||
        stderr.includes("undefined reference") ||
        stderr.includes("cannot find") ||
        stderr.includes("No such file") ||
        stderr.includes("fatal error") ||
        (stderr.length > 0 && stdout.length === 0)
      );

      // If build failed, return error
      if (code !== 0) {
        // Add build step context to stderr
        const buildSteps = `[Build Steps]\n${compileCommands.map((cmd, i) => `  ${i + 1}. ${cmd}`).join('\n')}\n  ${compileCommands.length + 1}. ${linkCommand}\n\n`;
        resolve({
          stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: buildSteps + stderr.substring(0, MAX_OUTPUT_LENGTH_C - buildSteps.length),
          exitCode: code,
          state: "failed",
          compileError: isCompileError,
        });
        return;
      }

      // Build succeeded - now run the executable
      const runArgs = [
        "run",
        "--rm",
        "--memory=128m",
        "--cpus=1.0",
        "--network=none",
        "--read-only",
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=50m",
        "-v", `${normalizedDir}:/workspace:ro`,
        "-w", "/workspace",
        dockerImage,
        "/tmp/main"
      ];

      const runProcess = spawn(dockerCommand, runArgs, {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          PATH: process.env.PATH || "",
        },
      });

      let runStdout = "";
      let runStderr = "";
      let runHasTimedOut = false;

      const runTimeoutId = setTimeout(() => {
        runHasTimedOut = true;
        runProcess.kill("SIGKILL");
        const buildSteps = `[Build Steps]\n${compileCommands.map((cmd, i) => `  ${i + 1}. ${cmd}`).join('\n')}\n  ${compileCommands.length + 1}. ${linkCommand}\n\n[Build successful]\n\n`;
        resolve({
          stdout: (buildSteps + runStdout).substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: (runStderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + "\n[Execution timeout after 2 seconds]",
          exitCode: 124,
          state: "failed",
          compileError: false,
        });
      }, C_EXECUTION_TIMEOUT);

      runProcess.stdout?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStdout.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
          runStdout += chunk;
        } else if (runStdout.length < MAX_OUTPUT_LENGTH_C) {
          runStdout += chunk.substring(0, MAX_OUTPUT_LENGTH_C - runStdout.length);
          runStdout += "\n[Output truncated due to length limit]";
        }
      });

      runProcess.stderr?.on("data", (data: Buffer) => {
        const chunk = data.toString("utf-8");
        if (runStderr.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
          runStderr += chunk;
        } else if (runStderr.length < MAX_OUTPUT_LENGTH_C) {
          runStderr += chunk.substring(0, MAX_OUTPUT_LENGTH_C - runStderr.length);
          runStderr += "\n[Error output truncated due to length limit]";
        }
      });

      runProcess.on("close", (runCode) => {
        clearTimeout(runTimeoutId);

        if (runHasTimedOut) {
          return;
        }

        // Add build steps to output
        const buildSteps = `[Build Steps]\n${compileCommands.map((cmd, i) => `  ${i + 1}. ${cmd}`).join('\n')}\n  ${compileCommands.length + 1}. ${linkCommand}\n\n[Build successful]\n\n`;
        const fullStdout = buildSteps + runStdout;

        resolve({
          stdout: fullStdout.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: runStderr.substring(0, MAX_OUTPUT_LENGTH_C),
          exitCode: runCode,
          state: runCode === 0 ? "completed" : "failed",
          compileError: false,
        });
      });

      runProcess.on("error", (error) => {
        clearTimeout(runTimeoutId);

        const isDevelopment = process.env.NODE_ENV !== "production";
        
        if (isDevelopment) {
          console.error(`[C Execution] Docker run error: ${error.message}`);
        }
        
        const buildSteps = `[Build Steps]\n${compileCommands.map((cmd, i) => `  ${i + 1}. ${cmd}`).join('\n')}\n  ${compileCommands.length + 1}. ${linkCommand}\n\n[Build successful]\n\n`;
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = (runStderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + `\n[Docker run error: ${error.message}]`;
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: buildSteps.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      });
    });

    dockerProcess.on("error", (error) => {
      clearTimeout(timeoutId);

      const isDevelopment = process.env.NODE_ENV !== "production";
      
      if (error.message.includes("ENOENT") || (error as any).code === "ENOENT") {
        if (isDevelopment) {
          console.error("[C Execution] Docker command not found. Ensure Docker is installed and in PATH.");
        }
        
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = "❌ Docker is required for local execution.\n\n" +
                         "C programs run inside a sandboxed container for security and platform independence.\n" +
                         "Please install and start Docker, then try again.\n\n" +
                         "Install Docker: https://docs.docker.com/get-docker/";
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: "",
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      } else {
        if (isDevelopment) {
          console.error(`[C Execution] Docker error: ${error.message}`);
        }
        
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + `\n[Docker error: ${error.message}]`;
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      }
    });
  });
}

/**
 * Execute C project with multiple files and headers (Phase 2)
 * Security: Docker container with resource limits, timeout, output limits
 * Phase 2: Multi-file and header support
 * @deprecated Use executeCProjectPhase3_5 for new projects
 */
function executeCProject(files: Array<{ name: string; content: string }>, tempDir: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise(async (resolve) => {
    // Filter to only .c files (headers are included via include paths)
    const cFiles = files.filter(f => f.name.endsWith(".c"));
    
    if (cFiles.length === 0) {
      resolve({
        stdout: "",
        stderr: "No C source files (.c) found in project",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Check for main.c entry file
    const mainFile = cFiles.find(f => {
      const name = f.name.split("/").pop() || f.name;
      return name === "main.c";
    });

    if (!mainFile) {
      resolve({
        stdout: "",
        stderr: "Entry file 'main.c' is required. Please create main.c with a main() function.",
        exitCode: 1,
        state: "failed",
        compileError: true,
      });
      return;
    }

    // Check Docker availability
    const dockerAvailable = await checkDockerAvailability();
    if (!dockerAvailable) {
      const isDevelopment = process.env.NODE_ENV !== "production";
      
      if (isDevelopment) {
        console.error("[C Execution] Docker is not available. Check if Docker daemon is running.");
      }
      
      let errorMessage: string;
      if (isDevelopment) {
        errorMessage = "❌ Docker is required for local execution.\n\n" +
                       "C programs run inside a sandboxed container for security and platform independence.\n" +
                       "Please install and start Docker, then try again.\n\n" +
                       "Install Docker: https://docs.docker.com/get-docker/";
      } else {
        errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                       "Please try again later. If the problem persists, contact support.";
      }
      
      resolve({
        stdout: "",
        stderr: errorMessage,
        exitCode: 1,
        state: "failed",
        compileError: false,
      });
      return;
    }

    // Create directory structure and write all files
    const filePaths: string[] = [];
    const includeDirs = new Set<string>(); // Track unique include directories
    
    cFiles.forEach(file => {
      const filePath = path.join(tempDir, file.name);
      const dir = path.dirname(filePath);
      
      // Create directory structure
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, file.content, "utf-8");
      filePaths.push(file.name); // Store relative path for Docker
      
      // Add directory to include paths if not root
      if (dir !== tempDir) {
        includeDirs.add(path.relative(tempDir, dir));
      }
    });

    // Write header files
    const hFiles = files.filter(f => f.name.endsWith(".h"));
    hFiles.forEach(file => {
      const filePath = path.join(tempDir, file.name);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, file.content, "utf-8");
      
      // Add directory to include paths if not root
      if (dir !== tempDir) {
        includeDirs.add(path.relative(tempDir, dir));
      }
    });

    // Normalize path for Docker
    const normalizedDir = path.resolve(tempDir);
    const dockerImage = "gcc:latest";
    
    // Build GCC command with all .c files and include paths
    // Escape file paths to prevent command injection
    const escapedFilePaths = filePaths.map(f => f.replace(/[^a-zA-Z0-9./_-]/g, ""));
    const includeArgs = Array.from(includeDirs).map(dir => `-I/workspace/${dir.replace(/\\/g, "/")}`).join(" ");
    const sourceFiles = escapedFilePaths.map(f => `/workspace/${f.replace(/\\/g, "/")}`).join(" ");
    
    // Compile all .c files together and run
    const compileCommand = includeArgs 
      ? `gcc ${includeArgs} ${sourceFiles} -o /tmp/main && /tmp/main`
      : `gcc ${sourceFiles} -o /tmp/main && /tmp/main`;
    
    const dockerArgs = [
      "run",
      "--rm",
      "--memory=128m",
      "--cpus=1.0",
      "--network=none",
      "--read-only",
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=50m",
      "-v", `${normalizedDir}:/workspace:ro`,
      "-w", "/workspace",
      dockerImage,
      "sh", "-c", compileCommand
    ];

    // Execute C program in Docker container
    const dockerCommand = "docker";
    const dockerProcess = spawn(dockerCommand, dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let stdout = "";
    let stderr = "";
    let hasTimedOut = false;

    // Set timeout for execution (2 seconds for C)
    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      dockerProcess.kill("SIGKILL");
      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + "\n[Execution timeout after 2 seconds]",
        exitCode: 124,
        state: "failed",
        compileError: false,
      });
    }, C_EXECUTION_TIMEOUT);

    dockerProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stdout.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_LENGTH_C) {
        stdout += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stdout.length);
        stdout += "\n[Output truncated due to length limit]";
      }
    });

    dockerProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stderr.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_LENGTH_C) {
        stderr += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stderr.length);
        stderr += "\n[Error output truncated due to length limit]";
      }
    });

    dockerProcess.on("close", (code) => {
      clearTimeout(timeoutId);

      if (hasTimedOut) {
        return;
      }

      // Check if it's a compilation error
      const isCompileError = code !== 0 && (
        stderr.includes("error:") ||
        stderr.includes("undefined reference") ||
        stderr.includes("cannot find") ||
        stderr.includes("No such file") ||
        stderr.includes("fatal error") ||
        (stderr.length > 0 && stdout.length === 0)
      );

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
        stderr: stderr.substring(0, MAX_OUTPUT_LENGTH_C),
        exitCode: code,
        state: code === 0 ? "completed" : "failed",
        compileError: isCompileError,
      });
    });

    dockerProcess.on("error", (error) => {
      clearTimeout(timeoutId);

      const isDevelopment = process.env.NODE_ENV !== "production";
      
      if (error.message.includes("ENOENT") || (error as any).code === "ENOENT") {
        if (isDevelopment) {
          console.error("[C Execution] Docker command not found. Ensure Docker is installed and in PATH.");
        }
        
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = "❌ Docker is required for local execution.\n\n" +
                         "C programs run inside a sandboxed container for security and platform independence.\n" +
                         "Please install and start Docker, then try again.\n\n" +
                         "Install Docker: https://docs.docker.com/get-docker/";
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: "",
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      } else {
        if (isDevelopment) {
          console.error(`[C Execution] Docker error: ${error.message}`);
        }
        
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + `\n[Docker error: ${error.message}]`;
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      }
    });
  });
}

/**
 * Execute C file using Docker-based sandboxed execution (Phase 1)
 * Security: Docker container with resource limits, timeout, output limits
 * Phase 1: Single-file execution only (main.c)
 */
function executeCFile(filePath: string, entryFileName?: string, language?: string): Promise<{ stdout: string; stderr: string; exitCode: number | null; waitingForInput?: boolean; sessionId?: string; state?: ExecutionState; compileError?: boolean }> {
  return new Promise(async (resolve) => {
    // Sanitize file path to prevent directory traversal
    const sanitizedPath = path.resolve(filePath);
    if (!sanitizedPath.startsWith(os.tmpdir())) {
      resolve({
        stdout: "",
        stderr: "Invalid file path",
        exitCode: 1,
        state: "failed",
        compileError: false,
      });
      return;
    }

    // Check Docker availability before attempting execution
    const dockerAvailable = await checkDockerAvailability();
    if (!dockerAvailable) {
      const isDevelopment = process.env.NODE_ENV !== "production";
      
      // Developer-only logging
      if (isDevelopment) {
        console.error("[C Execution] Docker is not available. Check if Docker daemon is running.");
      }
      
      // User-facing error message (environment-aware)
      let errorMessage: string;
      if (isDevelopment) {
        errorMessage = "❌ Docker is required for local execution.\n\n" +
                       "C programs run inside a sandboxed container for security and platform independence.\n" +
                       "Please install and start Docker, then try again.\n\n" +
                       "Install Docker: https://docs.docker.com/get-docker/";
      } else {
        errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                       "Please try again later. If the problem persists, contact support.";
      }
      
      resolve({
        stdout: "",
        stderr: errorMessage,
        exitCode: 1,
        state: "failed",
        compileError: false,
      });
      return;
    }

    const tempDir = path.dirname(sanitizedPath);
    const fileName = path.basename(sanitizedPath);
    
    // Normalize path for Docker
    // Docker Desktop on Windows can handle Windows paths directly (C:\Users\...)
    // For Linux/Mac, use absolute paths as-is
    const normalizedDir = path.resolve(tempDir);
    
    // Docker image with GCC preinstalled
    const dockerImage = "gcc:latest";
    
    // Docker command: compile and run in one go
    // Using sh -c to chain commands: gcc main.c -o /tmp/main && /tmp/main
    // Write executable to /tmp since workspace is read-only
    // Escape filename to prevent command injection
    const escapedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "");
    const dockerArgs = [
      "run",
      "--rm", // Remove container after execution
      "--memory=128m", // Memory limit: 128MB
      "--cpus=1.0", // CPU limit: 1 core
      "--network=none", // No network access for security
      "--read-only", // Read-only root filesystem
      "--tmpfs", "/tmp:rw,noexec,nosuid,size=50m", // Temporary writable space for executable
      "-v", `${normalizedDir}:/workspace:ro`, // Mount source directory as read-only
      "-w", "/workspace", // Working directory inside container
      dockerImage,
      "sh", "-c", `gcc ${escapedFileName} -o /tmp/main && /tmp/main`
    ];

    // Execute C program in Docker container
    const dockerCommand = "docker";
    const dockerProcess = spawn(dockerCommand, dockerArgs, {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        PATH: process.env.PATH || "",
      },
    });

    let stdout = "";
    let stderr = "";
    let hasTimedOut = false;

    // Set timeout for execution (2 seconds for C)
    const timeoutId = setTimeout(() => {
      hasTimedOut = true;
      dockerProcess.kill("SIGKILL");
      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
        stderr: (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + "\n[Execution timeout after 2 seconds]",
        exitCode: 124,
        state: "failed",
        compileError: false,
      });
    }, C_EXECUTION_TIMEOUT);

    dockerProcess.stdout?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stdout.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stdout += chunk;
      } else if (stdout.length < MAX_OUTPUT_LENGTH_C) {
        stdout += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stdout.length);
        stdout += "\n[Output truncated due to length limit]";
      }
    });

    dockerProcess.stderr?.on("data", (data: Buffer) => {
      const chunk = data.toString("utf-8");
      if (stderr.length + chunk.length <= MAX_OUTPUT_LENGTH_C) {
        stderr += chunk;
      } else if (stderr.length < MAX_OUTPUT_LENGTH_C) {
        stderr += chunk.substring(0, MAX_OUTPUT_LENGTH_C - stderr.length);
        stderr += "\n[Error output truncated due to length limit]";
      }
    });

    dockerProcess.on("close", (code) => {
      clearTimeout(timeoutId);

      if (hasTimedOut) {
        return; // Already resolved in timeout handler
      }

      // Docker exit codes:
      // 0 = success
      // 1 = compilation or runtime error
      // 125 = Docker daemon error
      // 126 = Docker command error
      // 127 = Container command not found
      // 124 = timeout (handled above)

      // Check if it's a compilation error (gcc errors typically have specific patterns)
      const isCompileError = code !== 0 && (
        stderr.includes("error:") ||
        stderr.includes("undefined reference") ||
        stderr.includes("cannot find") ||
        stderr.includes("No such file") ||
        (stderr.length > 0 && stdout.length === 0)
      );

      resolve({
        stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
        stderr: stderr.substring(0, MAX_OUTPUT_LENGTH_C),
        exitCode: code,
        state: code === 0 ? "completed" : "failed",
        compileError: isCompileError,
      });
    });

    dockerProcess.on("error", (error) => {
      clearTimeout(timeoutId);

      const isDevelopment = process.env.NODE_ENV !== "production";
      
      // Check if Docker is not available
      if (error.message.includes("ENOENT") || (error as any).code === "ENOENT") {
        // Developer-only logging
        if (isDevelopment) {
          console.error("[C Execution] Docker command not found. Ensure Docker is installed and in PATH.");
        }
        
        // User-facing error message (environment-aware)
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = "❌ Docker is required for local execution.\n\n" +
                         "C programs run inside a sandboxed container for security and platform independence.\n" +
                         "Please install and start Docker, then try again.\n\n" +
                         "Install Docker: https://docs.docker.com/get-docker/";
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: "",
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      } else {
        // Developer-only logging for other Docker errors
        if (isDevelopment) {
          console.error(`[C Execution] Docker error: ${error.message}`);
        }
        
        // User-facing error message (environment-aware)
        let errorMessage: string;
        if (isDevelopment) {
          errorMessage = (stderr.substring(0, MAX_OUTPUT_LENGTH_C) || "") + `\n[Docker error: ${error.message}]`;
        } else {
          errorMessage = "❌ Execution environment is temporarily unavailable.\n\n" +
                         "Please try again later. If the problem persists, contact support.";
        }
        
        resolve({
          stdout: stdout.substring(0, MAX_OUTPUT_LENGTH_C),
          stderr: errorMessage,
          exitCode: 1,
          state: "failed",
          compileError: false,
        });
      }
    });
  });
}
