import type { Project } from "./projects";
import { getEntryFile, getProjectFiles } from "./projectFiles";

/**
 * Execution states for code execution
 */
export type ExecutionState = 
  | "idle"
  | "running"
  | "waiting_for_input"
  | "completed"
  | "failed";

/**
 * Browser API detection result (safety layer)
 */
export interface BrowserApiDetection {
  detected: boolean;
  detectedApis: string[];
  apiDetails: Array<{
    api: string;
    description: string;
    nodeAlternative?: string;
  }>;
}

/**
 * Execution result from code execution engine
 */
export type ExecutionResult = {
  state: ExecutionState;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime?: number;
  error?: string;
  executedAt?: string;
  sessionId?: string;
  stdinInputs?: string[]; // User-provided inputs, separate from stdout
  // Legacy support - derived from state
  success?: boolean;
  waitingForInput?: boolean;
  // Browser API detection (safety layer - informational only)
  browserApiDetection?: BrowserApiDetection;
  browserApiExplanation?: string;
};

/**
 * Executes project code based on language.
 * 
 * This function runs the entry file of a project and captures
 * stdout, stderr, and execution results.
 * 
 * @param projectId - ID of the project to execute
 * @param project - Project object with language information
 * @returns Execution result with output and errors
 */
export async function executeProject(
  projectId: string,
  project: Project
): Promise<ExecutionResult> {
  const startTime = Date.now();
  
  try {
    // Get entry file
    const entryFile = getEntryFile(projectId);
    if (!entryFile) {
      return {
        success: false,
        stdout: "",
        stderr: "",
        exitCode: 1,
        error: "No entry file found. Please create a main file for your project.",
      };
    }

    // Get all project files for context (for languages that need multiple files)
    const allFiles = getProjectFiles(projectId);
    
    // Execute based on language
    const language = project.language || "python";
    
    switch (language) {
      case "python":
        return await executePython(entryFile, allFiles, startTime);
      case "javascript":
        return await executeJavaScript(entryFile, allFiles, startTime);
      case "typescript":
        return await executeTypeScript(entryFile, allFiles, startTime);
      case "html":
        return await executeHTML(entryFile, allFiles, startTime);
      default:
        return {
          success: false,
          stdout: "",
          stderr: "",
          exitCode: 1,
          error: `Execution not supported for language: ${language}`,
        };
    }
  } catch (error) {
    const executionTime = Date.now() - startTime;
    return {
      success: false,
      stdout: "",
      stderr: "",
      exitCode: 1,
      executionTime,
      error: error instanceof Error ? error.message : "Unknown execution error",
    };
  }
}

/**
 * Executes Python code
 */
async function executePython(
  entryFile: { name: string; content: string },
  allFiles: Array<{ name: string; content: string }>,
  startTime: number
): Promise<ExecutionResult> {
  // In a browser environment, we can't directly execute Python
  // This would typically require a backend service or WebAssembly runtime
  // For now, return a placeholder that shows the structure
  
  // TODO: Integrate with Python execution service
  // Example: Pyodide (WebAssembly Python) or backend API
  // const pyodide = await loadPyodide();
  // pyodide.runPython(entryFile.content);
  
  return {
    success: false,
    stdout: "",
    stderr: "",
    exitCode: 1,
    executionTime: Date.now() - startTime,
    error: "Python execution requires a backend service. Please set up a Python execution API endpoint.",
  };
}

/**
 * Executes JavaScript code
 */
async function executeJavaScript(
  entryFile: { name: string; content: string },
  allFiles: Array<{ name: string; content: string }>,
  startTime: number
): Promise<ExecutionResult> {
  try {
    // Capture console.log output
    const originalLog = console.log;
    const originalError = console.error;
    const stdout: string[] = [];
    const stderr: string[] = [];
    
    console.log = (...args: unknown[]) => {
      stdout.push(args.map(arg => String(arg)).join(" "));
      originalLog(...args);
    };
    
    console.error = (...args: unknown[]) => {
      stderr.push(args.map(arg => String(arg)).join(" "));
      originalError(...args);
    };
    
    try {
      // Create a safe execution context
      // Note: Using eval is generally unsafe, but for educational purposes
      // in a controlled environment, it can be acceptable
      // In production, use a sandboxed environment or backend service
      
      // Wrap code in IIFE to isolate scope
      const wrappedCode = `
        (function() {
          try {
            ${entryFile.content}
          } catch (error) {
            console.error("Execution error:", error.message);
            throw error;
          }
        })();
      `;
      
      // Execute in strict mode
      eval(`"use strict"; ${wrappedCode}`);
      
      const executionTime = Date.now() - startTime;
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      return {
        success: stderr.length === 0,
        stdout: stdout.join("\n"),
        stderr: stderr.join("\n"),
        exitCode: stderr.length === 0 ? 0 : 1,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Restore console
      console.log = originalLog;
      console.error = originalError;
      
      return {
        success: false,
        stdout: stdout.join("\n"),
        stderr: stderr.length > 0 
          ? stderr.join("\n") 
          : (error instanceof Error ? error.message : String(error)),
        exitCode: 1,
        executionTime,
      };
    }
  } catch (error) {
    return {
      success: false,
      stdout: "",
      stderr: error instanceof Error ? error.message : "Unknown error",
      exitCode: 1,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Executes TypeScript code
 */
async function executeTypeScript(
  entryFile: { name: string; content: string },
  allFiles: Array<{ name: string; content: string }>,
  startTime: number
): Promise<ExecutionResult> {
  // TypeScript needs to be transpiled to JavaScript first
  // For now, try to execute as JavaScript (will fail on type-only features)
  
  return {
    success: false,
    stdout: "",
    stderr: "TypeScript execution requires transpilation. Please compile TypeScript to JavaScript first or use a backend service.",
    exitCode: 1,
    executionTime: Date.now() - startTime,
    error: "TypeScript execution not supported in browser. Use a transpilation service.",
  };
}

/**
 * Executes HTML (opens in new window or returns preview)
 */
async function executeHTML(
  entryFile: { name: string; content: string },
  allFiles: Array<{ name: string; content: string }>,
  startTime: number
): Promise<ExecutionResult> {
  // HTML execution means opening in a new window or showing preview
  // For now, return success with HTML content as stdout
  
  const executionTime = Date.now() - startTime;
  
  return {
    success: true,
    stdout: `HTML file ready. Content:\n\n${entryFile.content.substring(0, 500)}${entryFile.content.length > 500 ? "..." : ""}`,
    stderr: "",
    exitCode: 0,
    executionTime,
  };
}

/**
 * Safe execution wrapper that prevents infinite loops and memory issues
 */
export function createSafeExecutor(
  code: string,
  timeout: number = 5000
): Promise<ExecutionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Set timeout to prevent infinite loops
    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        stdout: "",
        stderr: `Execution timeout after ${timeout}ms. Code may contain infinite loop or take too long.`,
        exitCode: 1,
        executionTime: Date.now() - startTime,
        error: "Execution timeout",
      });
    }, timeout);
    
    // Execute code (would be wrapped in try-catch in real implementation)
    // For now, this is a placeholder
    clearTimeout(timeoutId);
    
    resolve({
      success: false,
      stdout: "",
      stderr: "Safe executor not fully implemented. Use executeProject() instead.",
      exitCode: 1,
      executionTime: Date.now() - startTime,
    });
  });
}

