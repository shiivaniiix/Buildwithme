export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession, deleteSession, updateSessionStdout, updateSessionStderr } from "@/lib/executionSessions";

const MAX_OUTPUT_LENGTH = 10000;

interface ContinueRequest {
  sessionId: string;
  input: string;
}

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
}

/**
 * POST /api/projects/[id]/run/continue
 * 
 * Continues execution with user input for interactive programs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const body: ContinueRequest = await request.json();
    const { sessionId, input } = body;

    if (!sessionId || !input) {
      return NextResponse.json(
        { 
          state: "failed" as ExecutionState,
          stdout: "", 
          stderr: "Missing sessionId or input", 
          exitCode: 1, 
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        },
        { status: 400 }
      );
    }

    // Get session
    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { 
          state: "failed" as ExecutionState,
          stdout: "", 
          stderr: "Session not found or expired", 
          exitCode: 1, 
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        },
        { status: 404 }
      );
    }

    const { process: execProcess, stdout: existingStdout, stderr: existingStderr, startTime } = session;

    // Check if process is still alive
    if (execProcess.killed || execProcess.exitCode !== null) {
      deleteSession(sessionId);
      const finalState: ExecutionState = execProcess.exitCode === 0 ? "completed" : "failed";
      return NextResponse.json({
        state: finalState,
        stdout: existingStdout,
        stderr: existingStderr + "\n[Process already terminated]",
        exitCode: execProcess.exitCode || 1,
        executedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        success: finalState === "completed",
        waitingForInput: false,
      } as ExecutionResponse);
    }

    // Send input to the process
    // Start with existing output - we'll append new output to it
    // IMPORTANT: When user provides input, we need to ensure the prompt line is complete
    // If existingStdout ends with a prompt (no newline), add the input value and a newline
    let newStdout = existingStdout;
    let newStderr = existingStderr;
    let hasTimedOut = false;
    let waitingForMoreInput = false;
    let outputReceived = false;
    let processCompleted = false;
    let lastOutputTime = Date.now();
    let hasReceivedNewOutput = false;

    // Write input to stdin - only write once, when user submits
    if (execProcess.stdin && !execProcess.stdin.destroyed) {
      // Before writing input, ensure the prompt line is properly formatted
      // Python's input() prints prompts without trailing newlines, so we need to add the input value
      // and a newline to ensure proper line-by-line formatting
      // Check if stdout ends with a prompt pattern (no newline)
      const promptPattern = /:\s*$|\?\s*$|>\s*$/;
      if (promptPattern.test(newStdout) && !newStdout.endsWith('\n')) {
        // Prompt detected without newline - add input value and newline for proper formatting
        // This ensures "A: 2\n" instead of "A: " followed by "B: " on the same line
        newStdout += input + '\n';
        updateSessionStdout(sessionId, newStdout);
      }
      
      // Write the input followed by newline (simulating Enter key)
      // Do NOT close stdin - keep it open for potential more inputs
      execProcess.stdin.write(input + "\n", "utf-8");
    } else {
      deleteSession(sessionId);
      return NextResponse.json({
        state: "failed" as ExecutionState,
        stdout: existingStdout,
        stderr: existingStderr + "\n[Stdin closed]",
        exitCode: 1,
        executedAt: new Date().toISOString(),
        executionTime: Date.now() - startTime,
        success: false,
        waitingForInput: false,
      } as ExecutionResponse);
    }

    // Wait for more output or completion
    // Use a longer timeout and better detection for waiting state
    return new Promise<Response>((resolve) => {
      const CONTINUE_TIMEOUT = 10000; // 10 seconds - longer for programs that might process input
      let lastOutputTime = Date.now();
      let hasReceivedNewOutput = false;
      
      const timeoutId = setTimeout(() => {
        hasTimedOut = true;
        // Check if process is still running (might be waiting for more input)
        if (execProcess.exitCode === null && !execProcess.killed) {
          // Process is still running - check if it needs more input
          const timeSinceLastOutput = Date.now() - lastOutputTime;
          
          // If process is still running and no new output for a while, it's likely waiting for input
          // OR if we got output but process is still running, it might need more input
          if (timeSinceLastOutput > 500 || (hasReceivedNewOutput && execProcess.exitCode === null)) {
            // Check stderr for EOFError (Python) - more reliable indicator
            if (newStderr.includes("EOFError") || newStderr.includes("EOF when reading a line")) {
              // Definitely waiting for input
              waitingForMoreInput = true;
              updateSessionStdout(sessionId, newStdout);
              updateSessionStderr(sessionId, newStderr);
              resolve(NextResponse.json({
                state: "waiting_for_input" as ExecutionState,
                stdout: newStdout,
                stderr: newStderr,
                exitCode: null,
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                sessionId,
                success: false,
                waitingForInput: true,
              } as ExecutionResponse));
              return;
            }
            
            // Process is still running - likely waiting for input (heuristic)
            // Don't kill it - let it wait for user input
            waitingForMoreInput = true;
            updateSessionStdout(sessionId, newStdout);
            updateSessionStderr(sessionId, newStderr);
            resolve(NextResponse.json({
              state: "waiting_for_input" as ExecutionState,
              stdout: newStdout,
              stderr: newStderr,
              exitCode: null,
              executedAt: new Date().toISOString(),
              executionTime: Date.now() - startTime,
              sessionId,
              success: false,
              waitingForInput: true,
            } as ExecutionResponse));
            return;
          }
          
          // If we haven't received output and process is stuck, it might be an issue
          // But give it more time - don't kill immediately
          if (!hasReceivedNewOutput && timeSinceLastOutput > 3000) {
            // Process seems stuck - but don't kill, just report waiting
            waitingForMoreInput = true;
            updateSessionStdout(sessionId, newStdout);
            updateSessionStderr(sessionId, newStderr);
            resolve(NextResponse.json({
              state: "waiting_for_input" as ExecutionState,
              stdout: newStdout,
              stderr: newStderr,
              exitCode: null,
              executedAt: new Date().toISOString(),
              executionTime: Date.now() - startTime,
              sessionId,
              success: false,
              waitingForInput: true,
            } as ExecutionResponse));
            return;
          }
        } else {
          // Process completed
          deleteSession(sessionId);
          const finalState: ExecutionState = execProcess.exitCode === 0 ? "completed" : "failed";
          resolve(NextResponse.json({
            state: finalState,
            stdout: newStdout,
            stderr: newStderr,
            exitCode: execProcess.exitCode,
            executedAt: new Date().toISOString(),
            executionTime: Date.now() - startTime,
            success: finalState === "completed",
            waitingForInput: false,
          } as ExecutionResponse));
        }
      }, CONTINUE_TIMEOUT);

      // Remove any existing handlers to prevent duplicates
      execProcess.stdout?.removeAllListeners("data");
      execProcess.stderr?.removeAllListeners("data");
      execProcess.removeAllListeners("close");
      
      // Helper function to detect if stdout ends with a prompt pattern
      function detectPrompt(text: string): boolean {
        // Common prompt patterns: ends with ": ", "? ", "> ", etc.
        const promptPatterns = [
          /:\s*$/,           // Ends with ": "
          /\?\s*$/,          // Ends with "? "
          />\s*$/,            // Ends with "> "
          /Enter\s+\w+:\s*$/i, // "Enter X: "
          /Please\s+enter\s+\w+:\s*$/i, // "Please enter X: "
        ];
        
        return promptPatterns.some(pattern => pattern.test(text));
      }
      
      // Capture new stdout - only capture NEW output after input was sent
      const stdoutHandler = (data: Buffer) => {
        outputReceived = true;
        hasReceivedNewOutput = true;
        lastOutputTime = Date.now();
        const chunk = data.toString("utf-8");
        // Only append new output (don't duplicate existing)
        if (newStdout.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          newStdout += chunk;
          updateSessionStdout(sessionId, newStdout);
          
          // Check if stdout now ends with a prompt pattern
          // If so, immediately enter WAITING_FOR_INPUT state
          if (!processCompleted && detectPrompt(newStdout) && execProcess.exitCode === null && !execProcess.killed) {
            clearTimeout(timeoutId);
            clearInterval(inputCheckInterval);
            waitingForMoreInput = true;
            updateSessionStdout(sessionId, newStdout);
            updateSessionStderr(sessionId, newStderr);
            resolve(NextResponse.json({
              state: "waiting_for_input" as ExecutionState,
              stdout: newStdout,
              stderr: newStderr,
              exitCode: null,
              executedAt: new Date().toISOString(),
              executionTime: Date.now() - startTime,
              sessionId,
              success: false,
              waitingForInput: true,
            } as ExecutionResponse));
          }
        }
      };

      // Capture new stderr - only capture NEW errors after input was sent
      const stderrHandler = (data: Buffer) => {
        lastOutputTime = Date.now(); // stderr also counts as output
        const chunk = data.toString("utf-8");
        if (newStderr.length + chunk.length <= MAX_OUTPUT_LENGTH) {
          newStderr += chunk;
          updateSessionStderr(sessionId, newStderr);
        }
      };

      // Set up handlers for new output
      execProcess.stdout?.on("data", stdoutHandler);
      execProcess.stderr?.on("data", stderrHandler);

      // Handle process completion - use once() to prevent duplicate handlers
      execProcess.once("close", async (code: number | null) => {
        clearTimeout(timeoutId);
        processCompleted = true;
        // Remove handlers to prevent any further processing
        execProcess.stdout?.removeAllListeners("data");
        execProcess.stderr?.removeAllListeners("data");
        // Close stdin when process completes
        if (execProcess.stdin && !execProcess.stdin.destroyed) {
          execProcess.stdin.end();
        }
        deleteSession(sessionId);
        const finalState: ExecutionState = code === 0 ? "completed" : "failed";
        const executionTime = Date.now() - startTime;
        
        // Save run history when execution completes (after interactive input)
        try {
          const { saveRunHistory } = await import("@/lib/runHistory");
          // Get language and entry file from session
          const session = getSession(sessionId);
          const language = session?.language || 
                          (session?.filePath?.endsWith(".py") ? "python" : 
                           session?.filePath?.endsWith(".js") ? "javascript" :
                           session?.filePath?.endsWith(".ts") ? "typescript" : "python");
          // Use stored entryFileName from session, or fallback to language-based default
          const detectedEntryFile = session?.entryFileName || 
                                   (language === "python" ? "main.py" :
                                    language === "javascript" ? "main.js" :
                                    language === "typescript" ? "main.ts" : "main.py");
          
          saveRunHistory({
            projectId: params.id,
            language: language,
            entryFile: detectedEntryFile,
            status: finalState === "completed" ? "success" : "failed",
            executionTimeMs: executionTime,
            stdout: newStdout,
            stderr: newStderr || null,
            executedAt: Date.now(),
          });
        } catch (historyError) {
          console.warn("Failed to save run history:", historyError);
        }
        
        resolve(NextResponse.json({
          state: finalState,
          stdout: newStdout,
          stderr: newStderr,
          exitCode: code,
          executedAt: new Date().toISOString(),
          executionTime,
          success: finalState === "completed",
          waitingForInput: false,
        } as ExecutionResponse));
      });
      
      // Fallback: Check interval to detect if process is waiting for more input (only if prompt detection didn't trigger)
      // This runs in parallel with the timeout and close handler
      const inputCheckInterval = setInterval(() => {
        // If process completed, stop checking
        if (execProcess.exitCode !== null || execProcess.killed || processCompleted) {
          clearInterval(inputCheckInterval);
          return;
        }
        
        // Fallback: Check stderr for EOFError (Python) - this means stdin was closed and input() was called
        if (newStderr.includes("EOFError") || newStderr.includes("EOF when reading a line")) {
          clearTimeout(timeoutId);
          clearInterval(inputCheckInterval);
          waitingForMoreInput = true;
          updateSessionStdout(sessionId, newStdout);
          updateSessionStderr(sessionId, newStderr);
          resolve(NextResponse.json({
            state: "waiting_for_input" as ExecutionState,
            stdout: newStdout,
            stderr: newStderr,
            exitCode: null,
            executedAt: new Date().toISOString(),
            executionTime: Date.now() - startTime,
            sessionId,
            success: false,
            waitingForInput: true,
          } as ExecutionResponse));
          return;
        }
      }, 300); // Check every 300ms
      
      // Clean up interval when process completes
      execProcess.once("close", () => {
        clearInterval(inputCheckInterval);
      });
    });
  } catch (error) {
    return NextResponse.json(
      {
        state: "failed" as ExecutionState,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error",
        exitCode: 1,
        executedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
        waitingForInput: false,
      } as ExecutionResponse,
      { status: 500 }
    );
  }
}

