"use client";

import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { getProjectById, updateProjectLanguage, updateProjectLastOpened, getCurrentUserId, addProject, updateProjectEntryFile, type Project } from "@/lib/projects";
import ProfileMenu from "@/components/ProfileMenu";
import EmptyState from "@/components/EmptyState";
import { getSteps, addStep, updateStepStatus, updateStepBlockedReason, updateStepCode, getStepById, canCompleteStep, explainStepCompletion, getActiveFileContent, type Step } from "@/lib/steps";
import { getProjectFiles, addProjectFile, addProjectFolder, deleteProjectFile, renameProjectFile, updateProjectFileContent, getProjectFileContent, getEntryFile, getEntryFileForLanguage, getEntryFileNameForLanguage, detectEntryFile, ensureProjectHasFile, getProjectFile, getProjectFileById, fileNameExists, type CodeFile } from "@/lib/projectFiles";
import { detectEntryFileWithAI, type AIEntryFileResponse } from "@/lib/aiEntryFileDetection";
import type { ExecutionResult } from "@/lib/codeExecution";
import type { RunHistory } from "@/lib/runHistory";
import { detectBrowserApis } from "@/lib/browserApiDetection";

// Helper function to check if a language supports execution
const isLanguageExecutable = (language: string | undefined): boolean => {
  return language === "python" || language === "javascript" || language === "java" || language === "c";
};

// Language definitions with enabled status
const LANGUAGES = [
  { label: "Python", value: "python", enabled: true },
  { label: "JavaScript (Node.js)", value: "javascript", enabled: true },
  { label: "C", value: "c", enabled: false },
  { label: "C++", value: "cpp", enabled: false },
  { label: "Java", value: "java", enabled: false },
  { label: "SQL", value: "sql", enabled: false },
];

// Helper function to get language display name
const getLanguageDisplayName = (language: string): string => {
  const lang = LANGUAGES.find(l => l.value === language);
  return lang ? lang.label : language;
};

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [steps, setSteps] = useState<Step[]>([]);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [code, setCode] = useState("");
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [askAIPrompt, setAskAIPrompt] = useState("");
  const [askAIResponse, setAskAIResponse] = useState<string | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [selectedCodeRange, setSelectedCodeRange] = useState<{ start: number; end: number } | null>(null);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null); // Navigation: what folder we're viewing
  const [creationTarget, setCreationTarget] = useState<string | null>(null); // Creation: where new files/folders are created
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [newFileInputValue, setNewFileInputValue] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showNewItemMenu, setShowNewItemMenu] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [stepExplanations, setStepExplanations] = useState<Record<string, Awaited<ReturnType<typeof explainStepCompletion>> | null>>({});
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  // Dashboard projects are always editable (owned by user)
  // View-only mode is only for community pages
  const [isStepsOpen, setIsStepsOpen] = useState(true);
  const [isAskAIOpen, setIsAskAIOpen] = useState(true);
  const [isOverviewOpen, setIsOverviewOpen] = useState(true);
  const [terminalInput, setTerminalInput] = useState("");
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [executionSessionId, setExecutionSessionId] = useState<string | null>(null);
  const [stdinInputs, setStdinInputs] = useState<string[]>([]); // Track user inputs separately
  const [runHistory, setRunHistory] = useState<RunHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [aiEntryFileSuggestion, setAiEntryFileSuggestion] = useState<AIEntryFileResponse | null>(null);
  const [isDetectingEntryFile, setIsDetectingEntryFile] = useState(false);
  const [showEntryFileSuggestion, setShowEntryFileSuggestion] = useState(false);
  // AI error explanation state - automatically generated when execution fails
  const [aiErrorExplanation, setAiErrorExplanation] = useState<string | null>(null);
  const [isExplainingError, setIsExplainingError] = useState(false);
  // AI fix suggestion state
  const [aiFixSuggestion, setAiFixSuggestion] = useState<{
    summary: string;
    filesToChange: Array<{
      filename: string;
      originalCode: string;
      fixedCode: string;
    }>;
    notes: string | null;
  } | null>(null);
  const [isFixingCode, setIsFixingCode] = useState(false);
  // JavaScript execution mode: "node" (Node.js Server) or "browser" (Browser Client)
  // Default: "node" - existing Node.js execution continues unchanged
  const [jsExecutionMode, setJsExecutionMode] = useState<"node" | "browser">("node");
  // Browser API suggestion state (shown when browser APIs detected in Node.js mode)
  const [browserApiSuggestion, setBrowserApiSuggestion] = useState<{
    detected: boolean;
    detectedApis: string[];
  } | null>(null);
  const browserExecutionIframeRef = useRef<HTMLIFrameElement | null>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const codeScrollContainerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadedSteps = getSteps(params.id);
    const loadedProject = getProjectById(params.id);
    setProject(loadedProject);
    setSteps(loadedSteps);
    
    // Dashboard projects are always owned by the user, so always update lastOpenedAt
    if (loadedProject) {
      updateProjectLastOpened(params.id);
    }
    
    // Load project files
    const files = getProjectFiles(params.id);
    setProjectFiles(files);
    
    // Set active file - find first non-folder file
    const firstFile = files.find(f => !f.isFolder);
    if (firstFile) {
      setActiveFileId(firstFile.id);
      setCode(firstFile.content);
    } else {
      setActiveFileId(null);
      setCode("");
    }
    
    // Load JavaScript execution mode preference (default: "node")
    if (loadedProject?.language === "javascript") {
      const savedMode = localStorage.getItem(`js-execution-mode-${params.id}`);
      if (savedMode === "browser" || savedMode === "node") {
        setJsExecutionMode(savedMode);
      } else {
        setJsExecutionMode("node"); // Default: Node.js
      }
    } else {
      setJsExecutionMode("node"); // Default for non-JS projects
    }
    
    // Load run history
    fetchRunHistory();
    
    // Cleanup function: remove any lingering iframes on unmount
    return () => {
      if (browserExecutionIframeRef.current && browserExecutionIframeRef.current.parentNode) {
        browserExecutionIframeRef.current.parentNode.removeChild(browserExecutionIframeRef.current);
        browserExecutionIframeRef.current = null;
      }
    };
  }, [params.id]);
  
  // Fetch run history
  const fetchRunHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/projects/${params.id}/runs`);
      const data = await response.json();
      // Ensure we have an array and it's sorted (latest first - backend should already do this)
      setRunHistory(Array.isArray(data.runs) ? data.runs : []);
    } catch (error) {
      console.error("Failed to fetch run history:", error);
      setRunHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // AI Entry File Detection
  const handleDetectEntryFile = useCallback(async () => {
    if (!project || projectFiles.length < 2) return;
    
    // Java Phase 2: Skip AI detection - entry file is always Main.java
    if (project.language === "java") {
      return;
    }
    
    setIsDetectingEntryFile(true);
    try {
      const files = projectFiles.map(f => ({
        name: f.name,
        content: f.content,
      }));
      
      const suggestion = await detectEntryFileWithAI({
        files,
        language: project.language,
      });
      
      // Only show suggestion if it's different from current entry file
      if (suggestion.entryFile && suggestion.entryFile !== project.entryFile) {
        setAiEntryFileSuggestion(suggestion);
        setShowEntryFileSuggestion(true);
      }
    } catch (error) {
      console.error("Failed to detect entry file:", error);
    } finally {
      setIsDetectingEntryFile(false);
    }
  }, [project, projectFiles]);

  // Fetch project files from API
  const fetchProjectFiles = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}/files`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.files) {
          // Convert API files to CodeFile format and sync to localStorage
          const codeFiles: CodeFile[] = data.files.map((file: any) => ({
            id: file.id,
            name: file.name,
            content: file.content,
            isFolder: file.isFolder,
          }));
          setProjectFiles(codeFiles);
          
          // Also sync to localStorage for backward compatibility
          codeFiles.forEach(file => {
            if (!getProjectFileById(params.id, file.id)) {
              addProjectFile(params.id, file.name, file.content, file.isFolder);
            }
          });
        }
      }
    } catch (error) {
      console.error("Error fetching project files:", error);
      // Fallback to localStorage
      const files = getProjectFiles(params.id);
      setProjectFiles(files);
    }
  };

  // Handle create file
  const handleCreateFile = async () => {
    const fileName = prompt("Enter file name (e.g. index.js or main.py)");
    
    if (!fileName || !fileName.trim()) return;
    
    try {
      const response = await fetch(`/api/projects/${params.id}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: fileName.trim(),
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create file");
      }
      
      const newFile = await response.json();
      
      // Refresh file list from API
      await fetchProjectFiles();
      
      // Set new file as active - find it in updated files
      const updatedFiles = getProjectFiles(params.id);
      const createdFile = updatedFiles.find(f => f.id === newFile.id || f.name === newFile.name);
      if (createdFile) {
        setActiveFileId(createdFile.id);
        setCode(createdFile.content || "");
      } else if (newFile.id) {
        // If file was created but not found in localStorage, set it directly
        setActiveFileId(newFile.id);
        setCode(newFile.content || "");
        // Add to localStorage
        addProjectFile(params.id, newFile.name, newFile.content || "", newFile.isFolder || false);
        setProjectFiles([...projectFiles, {
          id: newFile.id,
          name: newFile.name,
          content: newFile.content || "",
          isFolder: newFile.isFolder || false,
        }]);
      }
    } catch (error) {
      console.error("Error creating file:", error);
      alert(error instanceof Error ? error.message : "Failed to create file");
    }
  };

  // Auto-detect entry file with AI when project has multiple files
  useEffect(() => {
    if (!project || projectFiles.length < 2 || project.entryFile) return;
    // Java Phase 2: Skip AI detection - entry file is always Main.java
    if (project.language === "java") return;
    if (localStorage.getItem(`entry-file-suggestion-dismissed-${params.id}`)) return;
    if (showEntryFileSuggestion || aiEntryFileSuggestion) return;
    
    // Trigger AI detection after a short delay to avoid blocking UI
    const timer = setTimeout(() => {
      handleDetectEntryFile();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [project, projectFiles.length, params.id, handleDetectEntryFile, showEntryFileSuggestion, aiEntryFileSuggestion]);

  const handleAcceptEntryFileSuggestion = () => {
    if (!aiEntryFileSuggestion || !project) return;
    
    updateProjectEntryFile(params.id, aiEntryFileSuggestion.entryFile);
    setProject({ ...project, entryFile: aiEntryFileSuggestion.entryFile });
    setShowEntryFileSuggestion(false);
    setAiEntryFileSuggestion(null);
  };

  const handleDismissEntryFileSuggestion = () => {
    setShowEntryFileSuggestion(false);
    setAiEntryFileSuggestion(null);
    // Remember dismissal for this session
    localStorage.setItem(`entry-file-suggestion-dismissed-${params.id}`, "true");
  };

  // Steps only reference/highlight code - they don't control code loading
  // Code is global and loads immediately on page load


  // Handle container resize for editor layout updates
  useEffect(() => {
    if (!editorContainerRef.current || !codeTextareaRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Trigger layout recalculation when container resizes
      // For Monaco: editor.layout() would be called here
      // For textarea: ensure it fills available space
      if (codeTextareaRef.current && codeScrollContainerRef.current) {
        // Force textarea to recalculate width
        codeTextareaRef.current.style.width = '100%';
      }
    });

    resizeObserver.observe(editorContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [selectedStepId, activeFileId]);

  // Auto-scroll to step codeRefs when step is selected
  useEffect(() => {
    if (selectedStepId && codeTextareaRef.current) {
      const step = getStepById(params.id, selectedStepId);
      if (step?.codeRefs && step.codeRefs.length > 0) {
        const firstRef = step.codeRefs[0];
        const lineHeight = 24; // leading-6 = 24px
        const paddingTop = 16; // p-4 = 16px
        const scrollPosition = (firstRef.startLine - 1) * lineHeight + paddingTop;
        
        requestAnimationFrame(() => {
          if (codeScrollContainerRef.current) {
            codeScrollContainerRef.current.scrollTo({
              top: Math.max(0, scrollPosition - 80),
              behavior: "smooth",
            });
          }
          if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTo({
              top: Math.max(0, scrollPosition - 80),
              behavior: "smooth",
            });
          }
        });
      }
    }
  }, [selectedStepId, params.id]);


  // Debounced autosave for code to active file
  useEffect(() => {
    if (typeof window === "undefined" || !activeFileId) return;
    
    const timeout = setTimeout(() => {
      // Save to project file
      const activeFile = getProjectFileById(params.id, activeFileId);
      if (activeFile) {
        updateProjectFileContent(params.id, activeFile.name, code);
        setProjectFiles(getProjectFiles(params.id));
      }
      
      // Code is global - no step-based analysis needed
      // Steps are optional references only
    }, 500);

    return () => clearTimeout(timeout);
  }, [code, activeFileId, selectedStepId, params.id]);

  // Browser execution function - executes JavaScript in sandboxed iframe
  const executeJavaScriptInBrowser = async (code: string): Promise<ExecutionResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";
      let hasError = false;

      // Create sandboxed iframe
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      
      // Sandbox attributes: allow scripts and same-origin (needed for localStorage)
      // allow-same-origin is safe here because we block parent access in code
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      
      // Store reference for cleanup
      browserExecutionIframeRef.current = iframe;

      // Set up message listener for console output
      const messageHandler = (event: MessageEvent) => {
        // Security: Only accept messages from our iframe
        if (event.source !== iframe.contentWindow) return;
        
        if (event.data.type === "console-log") {
          stdout += (stdout ? "\n" : "") + String(event.data.message);
        } else if (event.data.type === "console-error") {
          stderr += (stderr ? "\n" : "") + String(event.data.message);
          hasError = true;
        } else if (event.data.type === "execution-complete") {
          // Cleanup
          window.removeEventListener("message", messageHandler);
          clearTimeout(timeoutId);
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            browserExecutionIframeRef.current = null;
          }, 100);

          const executionTime = Date.now() - startTime;
          resolve({
            state: hasError ? "failed" : "completed",
            stdout: stdout || "",
            stderr: stderr || "",
            exitCode: hasError ? 1 : 0,
            executionTime,
            executedAt: new Date().toISOString(),
            success: !hasError,
            waitingForInput: false,
          });
        } else if (event.data.type === "execution-error") {
          stderr = String(event.data.error);
          hasError = true;
          
          // Cleanup
          window.removeEventListener("message", messageHandler);
          clearTimeout(timeoutId);
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
            browserExecutionIframeRef.current = null;
          }, 100);

          const executionTime = Date.now() - startTime;
          resolve({
            state: "failed",
            stdout: stdout || "",
            stderr: stderr || "",
            exitCode: 1,
            executionTime,
            executedAt: new Date().toISOString(),
            success: false,
            waitingForInput: false,
          });
        }
      };

      window.addEventListener("message", messageHandler);

      // Set timeout for execution (30 seconds for browser execution)
      // Browser execution can take longer due to async operations
      const timeoutId = setTimeout(() => {
        window.removeEventListener("message", messageHandler);
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        browserExecutionIframeRef.current = null;
        
        resolve({
          state: "failed",
          stdout: stdout || "",
          stderr: (stderr ? stderr + "\n" : "") + "[Execution timeout after 30 seconds]",
          exitCode: 124,
          executionTime: Date.now() - startTime,
          executedAt: new Date().toISOString(),
          success: false,
          waitingForInput: false,
        });
      }, 30000);

      // Create HTML content with sandboxed JavaScript execution
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Sandboxed Execution</title>
</head>
<body>
  <script>
    (function() {
      // Store parent reference immediately (before any blocking)
      const parentWindow = window.parent;
      
      // Override console methods to send messages to parent
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalInfo = console.info;
      
      const sendToParent = (type, message) => {
        try {
          parentWindow.postMessage({ type, message }, '*');
        } catch (e) {
          // Ignore postMessage errors in sandbox
        }
      };
      
      console.log = function(...args) {
        originalLog.apply(console, args);
        sendToParent('console-log', args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch (e) {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' '));
      };
      
      console.error = function(...args) {
        originalError.apply(console, args);
        sendToParent('console-error', args.map(arg => String(arg)).join(' '));
      };
      
      console.warn = function(...args) {
        originalWarn.apply(console, args);
        sendToParent('console-log', 'WARN: ' + args.map(arg => String(arg)).join(' '));
      };
      
      console.info = function(...args) {
        originalInfo.apply(console, args);
        sendToParent('console-log', 'INFO: ' + args.map(arg => String(arg)).join(' '));
      };
      
      // Block network access attempts
      const originalFetch = window.fetch;
      window.fetch = function() {
        console.error('fetch() is not available in sandboxed execution');
        return Promise.reject(new Error('Network access is disabled in sandboxed execution'));
      };
      
      const originalXMLHttpRequest = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        console.error('XMLHttpRequest is not available in sandboxed execution');
        throw new Error('Network access is disabled in sandboxed execution');
      };
      
      // Runtime validation: Ensure browser APIs are available
      if (typeof window === "undefined") {
        parentWindow.postMessage({ 
          type: 'execution-error', 
          error: '[INTERNAL ERROR] window is not defined in browser execution context' 
        }, '*');
        return;
      }
      
      if (typeof localStorage === "undefined") {
        parentWindow.postMessage({ 
          type: 'execution-error', 
          error: '[INTERNAL ERROR] localStorage is not available in browser execution context' 
        }, '*');
        return;
      }
      
      // Execute user code immediately after setup
      // Wrap in try-catch to handle errors
      try {
        // Execute code in IIFE to isolate scope
        const result = (function() {
          ${code}
        })();
        
        // Check if code returned a Promise (async code)
        if (result && typeof result.then === 'function') {
          // Async code: wait for Promise to resolve/reject
          result
            .then(() => {
              // Small delay to ensure console messages are flushed
              setTimeout(() => {
                parentWindow.postMessage({ type: 'execution-complete' }, '*');
              }, 10);
            })
            .catch((error) => {
              parentWindow.postMessage({ 
                type: 'execution-error', 
                error: error.message || String(error) 
              }, '*');
            });
        } else {
          // Synchronous code - signal completion immediately
          // Use setTimeout to ensure console.log calls are captured first
          // This is critical: completion must be signaled after console interception
          setTimeout(() => {
            parentWindow.postMessage({ type: 'execution-complete' }, '*');
          }, 10);
        }
      } catch (error) {
        // Synchronous errors - report immediately
        parentWindow.postMessage({ 
          type: 'execution-error', 
          error: error.message || String(error) 
        }, '*');
      }
    })();
  </script>
</body>
</html>`;

      // Use srcdoc for better security (if supported) - set before appending
      if ('srcdoc' in HTMLIFrameElement.prototype) {
        iframe.srcdoc = htmlContent;
        // Append to body (hidden)
        document.body.appendChild(iframe);
      } else {
        // Fallback: use data URL (less secure but works)
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
        // Append to body (hidden)
        document.body.appendChild(iframe);
        // Cleanup blob URL after iframe loads
        iframe.onload = () => {
          URL.revokeObjectURL(url);
        };
      }
    });
  };

  // Auto-explain runtime errors when execution fails
  const handleAutoExplainError = async (errorResult: ExecutionResult) => {
    // Only trigger if execution failed and has stderr
    if (errorResult.state !== "failed" || !errorResult.stderr) {
      return;
    }
    
    // Prevent duplicate calls
    if (isExplainingError) {
      return;
    }
    
    setIsExplainingError(true);
    setAiErrorExplanation(null);
    
    try {
      // Get active file info
      const activeFile = activeFileId ? getProjectFileById(params.id, activeFileId) : null;
      
      // Build files object: filename -> content
      const files: Record<string, string> = {};
      projectFiles.forEach(file => {
        files[file.name] = file.content;
      });
      
      // Prepare request payload for error explanation
      // Include execution mode so AI can provide context-aware explanations
      const executionMode = project?.language === "javascript" && jsExecutionMode === "browser" 
        ? "browser" 
        : "node";
      
      // Check if code only contains declarations (no execution/output)
      const codeContent = activeFile?.content || "";
      const hasOnlyDeclarations = !codeContent.match(/console\.(log|error|warn|info)\(|alert\(|document\.|window\.(location|open)/) && 
                                   (codeContent.includes("const ") || codeContent.includes("let ") || codeContent.includes("var ") || codeContent.includes("function "));
      
      // For Java: Distinguish compile-time vs runtime errors
      const isJavaCompileError = project?.language === "java" && (errorResult as any).compileError === true;
      
      const payload = {
        question: executionMode === "browser" 
          ? (hasOnlyDeclarations && !errorResult.stderr
              ? "This code contains only variable and function declarations with no execution or output. Explain that this is valid code that defines state and functions but produces no output until invoked."
              : "Explain this runtime error in a browser execution context. Note: This code is running in a browser environment where localStorage, window, and document are available. Do NOT suggest that these APIs are unavailable.")
          : project?.language === "java" && isJavaCompileError
          ? "Explain this Java compilation error. This is a compile-time error (syntax error, missing semicolon, class name mismatch, etc.). Do NOT suggest Maven, Gradle, or external dependencies. This is Phase 1: single-file execution only."
          : project?.language === "java"
          ? "Explain this Java runtime error. This code compiled successfully but failed at runtime (NullPointerException, ArrayIndexOutOfBoundsException, etc.). Do NOT suggest Maven, Gradle, or external dependencies. This is Phase 1: single-file execution only."
          : "Explain this runtime error and how to fix it",
        language: project?.language || "unknown",
        activeFile: activeFile?.name || "",
        files: files,
        runtimeError: errorResult.stderr,
        executionOutput: errorResult.stdout || undefined,
        executionMode: executionMode, // Pass execution mode to AI
      };
      
      // Call AI API
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        // Handle rate limiting and other errors gracefully
        if (response.status === 429) {
          setAiErrorExplanation("AI explanation temporarily unavailable (rate limit exceeded).");
        } else {
          const errorData = await response.json().catch(() => ({}));
          setAiErrorExplanation("AI explanation temporarily unavailable.");
        }
      } else {
        const data = await response.json();
        setAiErrorExplanation(data.answer || "No explanation available.");
      }
    } catch (error) {
      console.error("Failed to get AI error explanation:", error);
      setAiErrorExplanation("AI explanation temporarily unavailable.");
    } finally {
      setIsExplainingError(false);
    }
  };

  // Handle "Fix My Code" button click
  const handleFixMyCode = async () => {
    if (!executionResult || executionResult.state !== "failed" || !executionResult.stderr) {
      return;
    }
    
    setIsFixingCode(true);
    setAiFixSuggestion(null);
    
    try {
      // Get active file info
      const activeFile = activeFileId ? getProjectFileById(params.id, activeFileId) : null;
      
      // Build files object: filename -> content
      const files: Record<string, string> = {};
      projectFiles.forEach(file => {
        files[file.name] = file.content;
      });
      
      // Prepare request payload for fix request
      const payload = {
        question: "Fix this runtime error",
        language: project?.language || "unknown",
        activeFile: activeFile?.name || "",
        files: files,
        runtimeError: executionResult.stderr,
        executionOutput: executionResult.stdout || undefined,
      };
      
      // Call AI API
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Check if fix suggestion is available
      if (data.fix) {
        setAiFixSuggestion(data.fix);
      } else {
        // Fallback: show answer as explanation
        setAiFixSuggestion({
          summary: data.answer || "No fix suggestion available.",
          filesToChange: [],
          notes: "AI did not provide structured fix suggestions.",
        });
      }
    } catch (error) {
      console.error("Failed to get AI fix suggestion:", error);
      setAiFixSuggestion({
        summary: `Error: ${error instanceof Error ? error.message : "Failed to get AI fix suggestion."}`,
        filesToChange: [],
        notes: null,
      });
    } finally {
      setIsFixingCode(false);
    }
  };

  const handleAskAI = async () => {
    if (!askAIPrompt.trim()) return;
    
    setIsAskingAI(true);
    setAskAIResponse(null);
    
    try {
      // Get active file info
      const activeFile = activeFileId ? getProjectFileById(params.id, activeFileId) : null;
      
      // Build files object: filename -> content
      const files: Record<string, string> = {};
      projectFiles.forEach(file => {
        files[file.name] = file.content;
      });
      
      // Prepare request payload
      const payload = {
        question: askAIPrompt.trim(),
        language: project?.language || "unknown",
        activeFile: activeFile?.name || "",
        files: files,
        runtimeError: executionResult?.state === "failed" ? executionResult.stderr : undefined,
        executionOutput: executionResult?.stdout || undefined,
      };
      
      // Call AI API
      const response = await fetch("/api/ai/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      setAskAIResponse(data.answer || "No response from AI.");
    } catch (error) {
      console.error("Failed to get AI response:", error);
      setAskAIResponse(
        `Error: ${error instanceof Error ? error.message : "Failed to get AI response. Please check your OpenAI API key configuration."}`
      );
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleCreateStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep = {
      id: Date.now().toString(),
      title: newStepTitle.trim(),
      status: "pending" as const, // Required by type, but not used in UI
    };

    

    addStep(params.id, newStep);
    setSteps(getSteps(params.id));
    setNewStepTitle("");
  };

  if (!project) {
    return (
      <main className="min-h-screen code-pattern relative">
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Project not found</h1>
            <Link
              href="/dashboard"
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="code-pattern relative w-screen min-h-screen flex flex-col">
      {/* Workspace Header - Compact, Left-Aligned */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-800 h-14 flex items-center">
        <div className="w-full px-4 md:px-6 flex items-center justify-between">
          {/* Left: Back Button + Project Name */}
          <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
              className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-gray-800/50"
          >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
          </Link>
            <div className="h-5 w-px bg-gray-700"></div>
            <h1 className="text-lg md:text-xl font-semibold text-white truncate max-w-md">
            {project.name}
          </h1>
          </div>

          {/* Right: Ask Community + Logout */}
          <div className="flex items-center gap-3">
            <Link
              href={`/community/create_post?projectId=${project.id}`}
              onClick={() => {
                // Store project context for community header
                if (project) {
                  sessionStorage.setItem("lastProjectId", project.id);
                  sessionStorage.setItem("lastProjectName", project.name);
                }
              }}
              className="px-3 py-1.5 bg-gray-700 text-white font-medium rounded text-sm hover:bg-gray-600 transition-colors inline-block"
              title="Ask Community"
            >
              Ask Community
            </Link>
            <ProfileMenu />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex flex-col px-4 md:px-6 pt-14 pb-8">
        {/* AI Entry File Suggestion Banner */}
        {showEntryFileSuggestion && aiEntryFileSuggestion && project && (
          <div className="mb-4 glass-strong rounded-xl p-4 border border-cyan-500/30 bg-cyan-500/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyan-400 font-semibold text-sm">🤖 AI Suggestion</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    aiEntryFileSuggestion.confidence === "high" ? "bg-green-500/20 text-green-400" :
                    aiEntryFileSuggestion.confidence === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {aiEntryFileSuggestion.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-1">
                  Suggested entry file: <span className="font-mono text-cyan-400 font-semibold">{aiEntryFileSuggestion.entryFile}</span>
                </p>
                <p className="text-xs text-gray-400 italic">
                  {aiEntryFileSuggestion.reason}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleAcceptEntryFileSuggestion}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={handleDismissEntryFileSuggestion}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-medium rounded transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout: Code Workspace (Left) | Steps + Tickets (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* LEFT COLUMN - Code Workspace */}
          <section className={`min-w-0 flex flex-col ${isStepsOpen || isAskAIOpen ? "md:col-span-8" : "md:col-span-12"}`}>
            {/* Overview Section - Project Description */}
            {isOverviewOpen && (
              <div className="glass-strong rounded-2xl p-6 md:p-8 shadow-soft-xl overflow-hidden flex-shrink-0 mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">Overview</h2>
                  <button
                    onClick={() => setIsOverviewOpen(false)}
                    className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
                    title="Hide Overview"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                {project?.description ? (
                  <div className="glass rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
                  </div>
                ) : (
                  <div className="glass rounded-xl p-6 border border-gray-700">
                    <p className="text-gray-400 text-sm italic">
                      No project description yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Code Workspace Section */}
            <div className="glass-strong rounded-2xl p-4 md:p-8 shadow-soft-xl flex flex-col min-w-0">
              {/* Fixed header - stays relative to container */}
              <div className="flex items-center justify-between mb-6 flex-shrink-0 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white truncate min-w-0">Code Workspace</h2>
                  {/* Manual AI Detection Button */}
                  {project && projectFiles.length >= 2 && !project.entryFile && (
                    <button
                      onClick={handleDetectEntryFile}
                      disabled={isDetectingEntryFile}
                      className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                      title="Use AI to suggest entry file"
                    >
                      {isDetectingEntryFile ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Analyzing...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖</span>
                          <span>Detect Entry File</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {project && (() => {
                    // Helper to detect file language from extension
                    const getFileLanguage = (fileName: string): string | null => {
                      const ext = fileName.split('.').pop()?.toLowerCase();
                      if (ext === 'py') return 'python';
                      if (ext === 'js') return 'javascript';
                      if (ext === 'ts') return 'typescript';
                      if (ext === 'c') return 'c';
                      if (ext === 'cpp' || ext === 'cc' || ext === 'cxx') return 'cpp';
                      if (ext === 'java') return 'java';
                      if (ext === 'sql') return 'mysql';
                      return null;
                    };
                    
                    // Check if project has entry file set
                    const hasEntryFile = project.entryFile && getProjectFile(params.id, project.entryFile);
                    const entryFile = hasEntryFile ? getProjectFile(params.id, project.entryFile!) : null;
                    const activeFile = activeFileId ? getProjectFileById(params.id, activeFileId) : null;
                    const projectLanguage = project.language || "python";
                    
                    // Show execution mode selector if entry file exists and is different from active file
                    const showProjectMode = hasEntryFile && entryFile && activeFile && entryFile.id !== activeFile.id;
                    
                    return (
                      <div className="flex flex-col gap-2">
                        {/* Show which file will be executed */}
                        {activeFile && (
                          <div className="text-xs text-gray-400 px-2">
                            {(() => {
                              const fileLanguage = getFileLanguage(activeFile.name);
                              const languageMatches = !fileLanguage || fileLanguage === projectLanguage;
                              
                              return languageMatches ? (
                                <span>Current file: <span className="text-cyan-400 font-mono">{activeFile.name}</span></span>
                              ) : (
                                <span className="text-yellow-400">
                                  ⚠️ File extension ({activeFile.name.split('.').pop()}) doesn't match project language ({projectLanguage})
                                </span>
                              );
                            })()}
                          </div>
                        )}
                        
                        {/* Show entry file info if different from active */}
                        {showProjectMode && entryFile && (
                          <div className="text-xs text-gray-400 px-2">
                            Entry file: <span className="text-green-400 font-mono">{entryFile.name}</span>
                          </div>
                        )}
                        
                        {/* Execution buttons */}
                        <div className="flex gap-2">
                          {/* Run Current File button */}
                          <button
                        onClick={async () => {
                          // Prevent multiple executions
                          if (isExecuting || isWaitingForInput || !project) return;
                          
                          // Get currently active file
                          if (!activeFileId) {
                            setExecutionResult({
                              state: "failed",
                              stdout: "",
                              stderr: "❌ No file is currently open. Please open a file to execute.",
                              exitCode: 1,
                              error: "No active file",
                              success: false,
                              waitingForInput: false,
                              executedAt: new Date().toISOString(),
                            });
                            return;
                          }
                          
                          const activeFile = getProjectFileById(params.id, activeFileId);
                          if (!activeFile) {
                            setExecutionResult({
                              state: "failed",
                              stdout: "",
                              stderr: "❌ Active file not found. Please select a file to execute.",
                              exitCode: 1,
                              error: "Active file not found",
                              success: false,
                              waitingForInput: false,
                              executedAt: new Date().toISOString(),
                            });
                            return;
                          }
                          
                          const fileLanguage = getFileLanguage(activeFile.name);
                          const projectLanguage = project.language || "python";
                          
                          // Check if language is executable
                          if (!isLanguageExecutable(projectLanguage)) {
                            setExecutionResult({
                              state: "failed",
                              stdout: "",
                              stderr: "⏳ Execution support for this language is coming soon. You can still write and edit code, but execution is not yet available.",
                              exitCode: 1,
                              error: "Language not yet supported for execution",
                              success: false,
                              waitingForInput: false,
                              executedAt: new Date().toISOString(),
                            });
                            return;
                          }
                          
                          // Java validation: Phase-aware entry point check
                          if (projectLanguage === "java") {
                            const javaFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".java"));
                            
                            // Detect Phase 3 (packages/folders)
                            const hasPackages = javaFiles.some(f => {
                              const hasPackageDecl = f.content.match(/^\s*package\s+\S+\s*;/m);
                              const hasFolderPath = f.name.includes("/");
                              return hasPackageDecl || hasFolderPath;
                            });
                            
                            if (javaFiles.length === 0) {
                              setExecutionResult({
                                state: "failed",
                                stdout: "",
                                stderr: "❌ No Java files found in project.\n\nPlease create at least one Java file with a main method.",
                                exitCode: 1,
                                error: "No Java files",
                                success: false,
                                waitingForInput: false,
                                executedAt: new Date().toISOString(),
                              });
                              return;
                            }
                            
                            if (hasPackages) {
                              // Phase 3: Check for main method (any class)
                              const hasMainMethod = javaFiles.some(f => 
                                f.content.match(/public\s+static\s+void\s+main\s*\(/)
                              );
                              
                              if (!hasMainMethod) {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: "❌ No valid main method found.\n\nJava Phase 3 requires exactly one public class with: public static void main(String[] args)",
                                  exitCode: 1,
                                  error: "No main method",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                            } else {
                              // Phase 1 & 2: Require Main.java
                              const hasMainJava = javaFiles.some(f => {
                                const name = f.name.split("/").pop() || f.name;
                                return name === "Main.java";
                              });
                              
                              if (!hasMainJava) {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: `❌ Main.java entry file is required to run this project.\n\nFound Java files: ${javaFiles.map(f => f.name).join(", ")}\n\nPlease ensure Main.java exists with a public class Main containing a main method.`,
                                  exitCode: 1,
                                  error: "Main.java not found",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                              
                              // Check for multiple Main.java files
                              const mainJavaFiles = javaFiles.filter(f => {
                                const name = f.name.split("/").pop() || f.name;
                                return name === "Main.java";
                              });
                              if (mainJavaFiles.length > 1) {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: `❌ Multiple Main.java files found. Only one Main.java entry file is allowed.\n\nFound ${mainJavaFiles.length} Main.java files.`,
                                  exitCode: 1,
                                  error: "Multiple Main.java files",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                            }
                          }
                          
                          // Validate language matches (warn but allow if user wants)
                          if (fileLanguage && fileLanguage !== projectLanguage) {
                            const proceed = confirm(
                              `⚠️ File "${activeFile.name}" appears to be ${fileLanguage}, but project is set to ${projectLanguage}.\n\n` +
                              `This may cause execution errors. Continue anyway?`
                            );
                            if (!proceed) return;
                          }
                          
                          // Use file language if detected, otherwise fall back to project language
                          const executionLanguage = fileLanguage || projectLanguage;

                          // Check for browser APIs when Node.js mode is selected (suggestion only, non-blocking)
                          if (projectLanguage === "javascript" && jsExecutionMode === "node") {
                            const detection = detectBrowserApis(activeFile.content);
                            if (detection.detected) {
                              // Show suggestion but don't block execution
                              setBrowserApiSuggestion({
                                detected: true,
                                detectedApis: detection.detectedApis,
                              });
                            } else {
                              setBrowserApiSuggestion(null);
                            }
                          } else {
                            setBrowserApiSuggestion(null);
                          }

                          // Set executing state BEFORE making the API call
                          setIsExecuting(true);
                          // Reset ALL execution state for new run
                          setStdinInputs([]);
                          setTerminalInput("");
                          setIsWaitingForInput(false);
                          setExecutionSessionId(null);
                          setExecutionResult(null);
                          // Clear AI error explanation and fix suggestion on new run
                          setAiErrorExplanation(null);
                          setAiFixSuggestion(null);
                          
                          try {
                            let result: ExecutionResult;
                            
                            // Browser execution mode (client-side only)
                            if (projectLanguage === "javascript" && jsExecutionMode === "browser") {
                              result = await executeJavaScriptInBrowser(activeFile.content);
                            } else {
                              // Node.js execution mode (server-side)
                              // Java Phase 2: Send all Java files for multi-file compilation
                              const requestBody: any = {
                                code: activeFile.content,
                                language: executionLanguage,
                                entryFileName: activeFile.name,
                              };
                              
                              // For Java, send all Java files (exclude folders)
                              if (executionLanguage === "java") {
                                const javaFiles = projectFiles
                                  .filter(f => !f.isFolder && f.name.endsWith(".java"))
                                  .map(f => ({ name: f.name, content: f.content }));
                                requestBody.files = javaFiles;
                              }
                              
                              // For C Phase 2, send all C and header files (exclude folders)
                              if (executionLanguage === "c") {
                                const cFiles = projectFiles
                                  .filter(f => !f.isFolder && (f.name.endsWith(".c") || f.name.endsWith(".h")))
                                  .map(f => ({ name: f.name, content: f.content }));
                                requestBody.files = cFiles;
                              }
                              
                              const response = await fetch(`/api/projects/${params.id}/run`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify(requestBody),
                              });
                              result = await response.json();
                            }
                          // Start fresh - no stdin inputs yet
                          setExecutionResult({
                            ...result,
                            stdinInputs: [], // Start with empty stdin inputs
                          });
                          setStdinInputs([]);
                          
                          // Check execution state
                          if (result.state === "waiting_for_input" && result.sessionId) {
                            // Keep isExecuting true while waiting for input - button stays disabled
                            setIsWaitingForInput(true);
                            setExecutionSessionId(result.sessionId);
                            // Focus input field after a brief delay
                            setTimeout(() => {
                              terminalInputRef.current?.focus();
                            }, 100);
                          } else {
                            // Execution completed or failed - re-enable button
                            setIsWaitingForInput(false);
                            setExecutionSessionId(null);
                            setIsExecuting(false);
                            // Save run history and refresh after execution completes
                            if (result.state === "completed" || result.state === "failed") {
                              // Save run history for browser execution (Node.js execution saves in API route)
                              if (projectLanguage === "javascript" && jsExecutionMode === "browser") {
                                try {
                                  await fetch(`/api/projects/${params.id}/runs`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      language: executionLanguage,
                                      entryFile: activeFile.name,
                                      status: result.state === "completed" ? "success" : "failed",
                                      executionTimeMs: result.executionTime || 0,
                                      stdout: result.stdout || "",
                                      stderr: result.stderr || null,
                                    }),
                                  });
                                } catch (historyError) {
                                  console.warn("Failed to save run history:", historyError);
                                }
                              }
                              fetchRunHistory();
                            }
                            // Auto-explain runtime errors when execution fails
                            if (result.state === "failed" && result.stderr) {
                              handleAutoExplainError(result);
                            } else {
                              // Clear AI explanation on successful run
                              setAiErrorExplanation(null);
                            }
                          }
                        } catch (error) {
                          const errorResult: ExecutionResult = {
                            state: "failed",
                            stdout: "",
                            stderr: error instanceof Error ? error.message : "Execution failed",
                            exitCode: 1,
                            error: error instanceof Error ? error.message : "Execution error",
                            success: false,
                            waitingForInput: false,
                          };
                          setExecutionResult(errorResult);
                          // Re-enable button on error
                          setIsExecuting(false);
                          setIsWaitingForInput(false);
                          setExecutionSessionId(null);
                          // Auto-explain runtime errors when execution fails
                          if (errorResult.stderr) {
                            handleAutoExplainError(errorResult);
                          }
                        }
                          // Note: Don't use finally here - we want to keep isExecuting true when waiting for input
                        }}
                        disabled={isExecuting || isWaitingForInput || !project || !activeFileId || !isLanguageExecutable(project?.language) || 
                          (project?.language === "java" && activeFileId && (() => {
                            const activeFile = getProjectFileById(params.id, activeFileId);
                            return !activeFile || activeFile.name !== "Main.java";
                          })())}
                        className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-700 text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                        title={!isLanguageExecutable(project?.language) ? "Execution support for this language is coming soon" : undefined}
                      >
                        {isExecuting || isWaitingForInput ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            {isWaitingForInput ? "Waiting..." : "Running..."}
                          </>
                        ) : !isLanguageExecutable(project?.language) ? (
                          <>
                            Not Available Yet
                          </>
                        ) : project?.language === "c" ? (
                          <>
                            🔨 Build & Run
                          </>
                        ) : (
                          <>
                            ▶ Run Current
                          </>
                        )}
                      </button>
                      
                      {/* Run Project button (only if entry file exists and is different from active) */}
                      {showProjectMode && entryFile && (
                        <button
                          onClick={async () => {
                            // Prevent multiple executions
                            if (isExecuting || isWaitingForInput || !project || !entryFile) return;
                            
                            // C: Run Project works for both Phase 1 and Phase 2
                            if (project?.language === "c") {
                              setExecutionResult({
                                state: "failed",
                                stdout: "",
                                stderr: "C Phase 1 supports single-file execution only. Use 'Run Current' to execute main.c.",
                                exitCode: 1,
                                error: "C Phase 1 restriction",
                                success: false,
                                waitingForInput: false,
                                executedAt: new Date().toISOString(),
                              });
                              return;
                            }
                            
                            // Check if language is executable
                            if (!isLanguageExecutable(project?.language)) {
                              setExecutionResult({
                                state: "failed",
                                stdout: "",
                                stderr: "⏳ Execution support for this language is coming soon. You can still write and edit code, but execution is not yet available.",
                                exitCode: 1,
                                error: "Language not yet supported for execution",
                                success: false,
                                waitingForInput: false,
                                executedAt: new Date().toISOString(),
                              });
                              return;
                            }
                            
                            // Java Phase 2 validation: Main.java required at execution time
                            if (projectLanguage === "java") {
                              const javaFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".java"));
                              if (javaFiles.length === 0) {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: "❌ Java Phase 1 requires Main.java file.\n\nPlease create a file named Main.java with a public class Main containing a main method.",
                                  exitCode: 1,
                                  error: "Main.java not found",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                              if (javaFiles.length > 1) {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: `❌ Java Phase 1 supports only one file: Main.java\n\nFound ${javaFiles.length} Java files: ${javaFiles.map(f => f.name).join(", ")}\n\nPlease keep only Main.java for Phase 1 execution.`,
                                  exitCode: 1,
                                  error: "Multiple Java files not supported",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                              if (entryFile.name !== "Main.java") {
                                setExecutionResult({
                                  state: "failed",
                                  stdout: "",
                                  stderr: `❌ Java Phase 1 requires Main.java to be executed.\n\nEntry file: ${entryFile.name}\n\nPlease set Main.java as the entry file.`,
                                  exitCode: 1,
                                  error: "Wrong entry file",
                                  success: false,
                                  waitingForInput: false,
                                  executedAt: new Date().toISOString(),
                                });
                                return;
                              }
                            }
                            
                            const fileLanguage = getFileLanguage(entryFile.name);
                            const executionLanguage = fileLanguage || projectLanguage;

                            // Check for browser APIs when Node.js mode is selected (suggestion only, non-blocking)
                            if (projectLanguage === "javascript" && jsExecutionMode === "node") {
                              const detection = detectBrowserApis(entryFile.content);
                              if (detection.detected) {
                                // Show suggestion but don't block execution
                                setBrowserApiSuggestion({
                                  detected: true,
                                  detectedApis: detection.detectedApis,
                                });
                              } else {
                                setBrowserApiSuggestion(null);
                              }
                            } else {
                              setBrowserApiSuggestion(null);
                            }

                            // Set executing state BEFORE making the API call
                            setIsExecuting(true);
                            // Reset ALL execution state for new run
                            setStdinInputs([]);
                            setTerminalInput("");
                            setIsWaitingForInput(false);
                            setExecutionSessionId(null);
                            setExecutionResult(null);
                            // Clear AI error explanation on new run
                            setAiErrorExplanation(null);
                            
                            try {
                              let result: ExecutionResult;
                              
                              // Browser execution mode (client-side only)
                              if (projectLanguage === "javascript" && jsExecutionMode === "browser") {
                                result = await executeJavaScriptInBrowser(entryFile.content);
                              } else {
                                // Node.js execution mode (server-side) - unchanged
                                const response = await fetch(`/api/projects/${params.id}/run`, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    code: entryFile.content,
                                    language: executionLanguage,
                                    entryFileName: entryFile.name,
                                  }),
                                });
                                result = await response.json();
                              }
                              setExecutionResult({
                                ...result,
                                stdinInputs: [],
                              });
                              setStdinInputs([]);
                              
                              if (result.state === "waiting_for_input" && result.sessionId) {
                                setIsWaitingForInput(true);
                                setExecutionSessionId(result.sessionId);
                                setTimeout(() => {
                                  terminalInputRef.current?.focus();
                                }, 100);
                              } else {
                                setIsWaitingForInput(false);
                                setExecutionSessionId(null);
                                setIsExecuting(false);
                                // Save run history and refresh after execution completes
                                if (result.state === "completed" || result.state === "failed") {
                                  // Save run history for browser execution (Node.js execution saves in API route)
                                  if (projectLanguage === "javascript" && jsExecutionMode === "browser") {
                                    try {
                                      await fetch(`/api/projects/${params.id}/runs`, {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          language: executionLanguage,
                                          entryFile: entryFile.name,
                                          status: result.state === "completed" ? "success" : "failed",
                                          executionTimeMs: result.executionTime || 0,
                                          stdout: result.stdout || "",
                                          stderr: result.stderr || null,
                                        }),
                                      });
                                    } catch (historyError) {
                                      console.warn("Failed to save run history:", historyError);
                                    }
                                  }
                                  fetchRunHistory();
                                }
                                // Auto-explain runtime errors when execution fails
                                if (result.state === "failed" && result.stderr) {
                                  handleAutoExplainError(result);
                                } else {
                                  // Clear AI explanation on successful run
                                  setAiErrorExplanation(null);
                                }
                              }
                            } catch (error) {
                              const errorResult: ExecutionResult = {
                                state: "failed",
                                stdout: "",
                                stderr: error instanceof Error ? error.message : "Execution failed",
                                exitCode: 1,
                                error: error instanceof Error ? error.message : "Execution error",
                                success: false,
                                waitingForInput: false,
                              };
                              setExecutionResult(errorResult);
                              setIsExecuting(false);
                              setIsWaitingForInput(false);
                              setExecutionSessionId(null);
                              // Auto-explain runtime errors when execution fails
                              if (errorResult.stderr) {
                                handleAutoExplainError(errorResult);
                              }
                            }
                          }}
                          disabled={isExecuting || isWaitingForInput || !project || !entryFile || !isLanguageExecutable(project?.language) ||
                            (project?.language === "java" && (!entryFile || entryFile.name !== "Main.java"))}
                          className="px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-600 disabled:to-gray-700 text-white text-xs font-medium rounded-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-2"
                          title={
                            !isLanguageExecutable(project?.language) 
                              ? "Execution support for this language is coming soon"
                              : project?.language === "java" && entryFile && entryFile.name !== "Main.java"
                              ? "Java Phase 1 requires Main.java to be the entry file"
                              : undefined
                          }
                        >
                          {isExecuting || isWaitingForInput ? (
                            <>
                              <span className="animate-spin">⏳</span>
                              {isWaitingForInput ? "Waiting..." : "Running..."}
                            </>
                          ) : !isLanguageExecutable(project?.language) ? (
                            <>
                              ⏳ Coming Soon
                            </>
                          ) : project?.language === "c" ? (
                            <>
                              🔨 Build & Run
                            </>
                          ) : (
                            <>
                              ▶ Run Project
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    </div>
                  )})()}
                </div>
              </div>
              {/* Language Selector */}
              <div className="mb-3 flex-shrink-0 flex items-center justify-end">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Language:</label>
                    <select
                      value={project?.language || "python"}
                      onChange={(e) => {
                        const lang = e.target.value as Project["language"];
                        updateProjectLanguage(params.id, lang);
                        setProject({ ...project!, language: lang });
                        // Reset execution mode when language changes (default to node)
                        if (lang !== "javascript") {
                          setJsExecutionMode("node");
                        } else {
                          // Load saved mode for JavaScript, or default to node
                          const savedMode = localStorage.getItem(`js-execution-mode-${params.id}`);
                          setJsExecutionMode(savedMode === "browser" ? "browser" : "node");
                        }
                      }}
                      className="px-2 py-1 text-xs bg-gray-800/50 text-white border border-gray-700 rounded focus:outline-none focus:border-cyan-400"
                    >
                      {LANGUAGES.map(lang => (
                        <option
                          key={lang.value}
                          value={lang.value}
                          disabled={!lang.enabled}
                        >
                          {lang.label}{!lang.enabled ? " (Not Available Yet)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* JavaScript Execution Mode Selector (only for JavaScript projects) */}
                  {project?.language === "javascript" && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Execution Mode:</label>
                      <select
                        value={jsExecutionMode}
                        onChange={(e) => {
                          const mode = e.target.value as "node" | "browser";
                          setJsExecutionMode(mode);
                          // Persist mode preference
                          localStorage.setItem(`js-execution-mode-${params.id}`, mode);
                        }}
                        className="px-2 py-1 text-xs bg-gray-800/50 text-white border border-gray-700 rounded focus:outline-none focus:border-cyan-400"
                      >
                        <option value="node">Node.js (Server)</option>
                        <option value="browser">Browser (Client)</option>
                      </select>
                      {jsExecutionMode === "browser" && (
                        <span className="text-xs text-cyan-400 flex items-center gap-1" title="Code will execute in a sandboxed browser environment">
                          🌐 Browser
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Editor container - flex-1 to fill available space, no height constraints */}
              <div className="glass rounded-xl border border-gray-700 flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
                {projectFiles.length > 0 ? (
                  <div className="flex flex-1 min-w-0 min-h-0 overflow-hidden">
                    {/* Files Sidebar - Project-level files */}
                    <div className="flex-shrink-0 w-48 bg-gray-800/30 border-r border-gray-700/50 flex flex-col overflow-hidden">
                      <div className="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
                        <h3 className="text-xs font-semibold text-gray-300 uppercase">Files</h3>
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowNewItemMenu(!showNewItemMenu);
                            }}
                            className="text-xs text-cyan-400 hover:text-cyan-300 px-1.5 py-0.5 rounded hover:bg-gray-700/50"
                            title="Add new file or folder"
                          >
                            +
                          </button>
                          {showNewItemMenu && (
                            <>
                              {/* Click outside to close */}
                              <div 
                                className="fixed inset-0 z-[5]" 
                                onClick={() => {
                                  setShowNewItemMenu(false);
                                  // Optionally clear folder selection when menu closes
                                  // setSelectedFolderPath(null);
                                }}
                              />
                              <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-[120px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Set creationTarget to currentDirectory
                                    setCreationTarget(currentDirectory);
                                    setShowNewItemMenu(false);
                                    setIsCreatingFolder(false);
                                    setShowNewFileInput(true);
                                  const defaultExtension = project?.language === "python" ? ".py" :
                                                          project?.language === "javascript" ? ".js" :
                                                          project?.language === "typescript" ? ".ts" :
                                                          project?.language === "html" ? ".html" :
                                                          project?.language === "css" ? ".css" :
                                                          project?.language === "json" ? ".json" :
                                                          project?.language === "c" ? ".c" :
                                                          project?.language === "cpp" ? ".cpp" :
                                                          project?.language === "java" ? ".java" :
                                                          project?.language === "mysql" ? ".sql" : ".py";
                                  setNewFileInputValue(`newfile${defaultExtension}`);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700/50"
                              >
                                📄 New File
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                    // Set creationTarget to currentDirectory
                                    setCreationTarget(currentDirectory);
                                  setShowNewItemMenu(false);
                                  setIsCreatingFolder(true);
                                  setShowNewFileInput(true);
                                  setNewFileInputValue("newfolder");
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-700/50 border-t border-gray-700"
                              >
                                📁 New Folder
                              </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {/* New file input */}
                      {showNewFileInput && (
                        <div className="px-3 py-2 border-b border-gray-700/50 bg-gray-800/50">
                          <input
                            type="text"
                            value={newFileInputValue}
                            onChange={(e) => setNewFileInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                let itemName = newFileInputValue.trim();
                                if (!itemName) {
                                  alert(isCreatingFolder ? "Folder name cannot be empty" : "Filename cannot be empty");
                                  return;
                                }
                                
                                try {
                                  if (isCreatingFolder) {
                                    // Create folder - no extension, no content
                                    // Validate folder name doesn't look like a file
                                    if (itemName.includes(".") && !itemName.includes("/")) {
                                      const parts = itemName.split(".");
                                      if (parts.length === 2 && parts[1].length <= 4) {
                                        // Looks like a file extension, warn user
                                        const proceed = confirm(
                                          `"${itemName}" looks like a filename with extension.\n\n` +
                                          `Did you mean to create a folder named "${parts[0]}" instead?\n\n` +
                                          `Click OK to create folder "${parts[0]}", or Cancel to go back.`
                                        );
                                        if (proceed) {
                                          itemName = parts[0];
                                        } else {
                                          return;
                                        }
                                      }
                                    }
                                    
                                    // Use creationTarget (defaults to currentDirectory)
                                    const targetDir = creationTarget !== null ? creationTarget : currentDirectory;
                                    let folderPath = itemName;
                                    if (targetDir) {
                                      folderPath = `${targetDir}/${itemName}`;
                                    }
                                    
                                    const newFolder = addProjectFolder(params.id, folderPath);
                                    setProjectFiles(getProjectFiles(params.id));
                                    // Expand the new folder and its parent if nested
                                    setExpandedFolders(prev => {
                                      const next = new Set(prev);
                                      next.add(newFolder.id);
                                      // Also expand parent folder if nested
                                      if (targetDir) {
                                        const parentFolder = projectFiles.find(f => f.isFolder && f.name === targetDir);
                                        if (parentFolder) {
                                          next.add(parentFolder.id);
                                        }
                                      }
                                      return next;
                                    });
                                    // Keep creationTarget after folder creation (stay in same directory)
                                    setShowNewFileInput(false);
                                    setNewFileInputValue("");
                                    setIsCreatingFolder(false);
                                    setShowNewItemMenu(false);
                                  } else {
                                    // Create file
                                    let fileName = itemName;
                                    
                                    // C Phase 2: Allow .c and .h files
                                    if (project?.language === "c") {
                                      // Allow any .c or .h file name
                                      if (!fileName.endsWith(".c") && !fileName.endsWith(".h")) {
                                        // Default to .c if no extension
                                        fileName = fileName + ".c";
                                      }
                                    }
                                    
                                    // If a folder is selected, prepend folder path
                                    if (creationTarget) {
                                      fileName = `${creationTarget}/${fileName}`;
                                    }
                                    
                                    // Handle folder paths: if user types "utils/Helper", create "utils/Helper.java"
                                    // Java Phase 3: Support folder paths
                                    if (project?.language === "java") {
                                      if (!fileName.includes("/")) {
                                        // Root file - auto-add .java extension
                                        if (!fileName.endsWith(".java")) {
                                          fileName = fileName + ".java";
                                        }
                                      } else {
                                        // File in folder - ensure .java extension on the filename part
                                        const parts = fileName.split("/");
                                        const lastPart = parts[parts.length - 1];
                                        if (!lastPart.endsWith(".java") && !lastPart.endsWith("/")) {
                                          parts[parts.length - 1] = lastPart + ".java";
                                          fileName = parts.join("/");
                                        }
                                      }
                                    } else {
                                      // Other languages: ensure extension if not in folder
                                      if (!fileName.includes("/") && !fileName.includes(".")) {
                                        const defaultExtension = project?.language === "python" ? ".py" :
                                                                project?.language === "javascript" ? ".js" :
                                                                project?.language === "typescript" ? ".ts" :
                                                                project?.language === "html" ? ".html" :
                                                                project?.language === "css" ? ".css" :
                                                                project?.language === "json" ? ".json" : "";
                                        if (defaultExtension) {
                                          fileName = fileName + defaultExtension;
                                        }
                                      }
                                    }
                                    
                                    const defaultContent = project?.language === "java" && fileName === "Main.java"
                                      ? `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
                                      : "";
                                    const newFile = addProjectFile(params.id, fileName, defaultContent, false);
                                    setProjectFiles(getProjectFiles(params.id));
                                    setActiveFileId(newFile.id);
                                    setCode(newFile.content);
                                    
                                    // Java Phase 2: Always set Main.java as entry file (only if root-level)
                                    if (project?.language === "java" && fileName === "Main.java" && !creationTarget) {
                                      updateProjectEntryFile(params.id, "Main.java");
                                    }
                                    
                                    // Clear folder selection after file creation
                                    setCreationTarget(currentDirectory);
                                    setShowNewFileInput(false);
                                    setNewFileInputValue("");
                                    setIsCreatingFolder(false);
                                    setShowNewItemMenu(false);
                                  }
                                } catch (error) {
                                  alert(error instanceof Error ? error.message : `Failed to create ${isCreatingFolder ? "folder" : "file"}`);
                                }
                              } else if (e.key === "Escape") {
                                setShowNewFileInput(false);
                                setNewFileInputValue("");
                                setIsCreatingFolder(false);
                                setShowNewItemMenu(false);
                                setCreationTarget(currentDirectory);
                              }
                            }}
                            onBlur={() => {
                              // Don't close on blur - let user finish typing
                            }}
                            className="w-full bg-gray-700 text-white text-xs px-2 py-1 rounded border border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                            placeholder={isCreatingFolder ? "Enter folder name..." : "Enter filename..."}
                            autoFocus
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Press Enter to create, Esc to cancel
                            <span className="block mt-1 text-cyan-300">
                              Creating in: <span className="font-semibold">{creationTarget !== null ? creationTarget : (currentDirectory !== null ? currentDirectory : "Root")}</span>
                            </span>
                            {isCreatingFolder ? (
                              <span className="block mt-1 text-cyan-400">
                                {project?.language === "java" 
                                  ? "Java Phase 3: Folders support packages. No file extensions needed."
                                  : "Folders help organize your project files."}
                              </span>
                            ) : project?.language === "java" && (
                              <span className="block mt-1 text-cyan-400">
                                Java Phase 3: Folders and packages supported. Use folder structure for packages.
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="ide-scrollbar flex-1 overflow-y-auto min-h-0">
                        {/* Breadcrumb navigation */}
                        {(currentDirectory !== null || projectFiles.length > 0) && (
                          <div className="px-3 py-2 border-b border-gray-700/50 bg-gray-800/50">
                            <div className="flex items-center gap-1 text-xs">
                              <button
                                onClick={() => {
                                  setCurrentDirectory(null);
                                  setCreationTarget(null);
                                }}
                                className={`px-2 py-1 rounded hover:bg-gray-700/50 ${
                                  currentDirectory === null ? "text-cyan-400 font-semibold" : "text-gray-400 hover:text-gray-300"
                                }`}
                              >
                                Root
                              </button>
                              {currentDirectory && (() => {
                                const parts = currentDirectory.split("/");
                                return parts.map((part, index) => {
                                  const pathToHere = parts.slice(0, index + 1).join("/");
                                  return (
                                    <span key={pathToHere} className="flex items-center gap-1">
                                      <span className="text-gray-600">/</span>
                                      <button
                                        onClick={() => {
                                          setCurrentDirectory(pathToHere);
                                          setCreationTarget(pathToHere);
                                        }}
                                        className={`px-2 py-1 rounded hover:bg-gray-700/50 ${
                                          currentDirectory === pathToHere ? "text-cyan-400 font-semibold" : "text-gray-400 hover:text-gray-300"
                                        }`}
                                      >
                                        {part}
                                      </button>
                                    </span>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        )}
                        {projectFiles.length === 0 ? (
                          <p className="text-xs text-gray-500 px-3 py-2">No files</p>
                        ) : (
                          <div className="py-1">
                            {(() => {
                              // Build tree structure
                              interface TreeNode {
                                file: CodeFile;
                                children: TreeNode[];
                                path: string;
                              }
                              
                              const buildTree = (): TreeNode[] => {
                                const folderMap = new Map<string, TreeNode>();
                                const rootNodes: TreeNode[] = [];
                                
                                // Helper to get or create folder node (handles nested paths)
                                const getOrCreateFolder = (folderPath: string): TreeNode => {
                                  if (folderMap.has(folderPath)) {
                                    return folderMap.get(folderPath)!;
                                  }
                                  
                                  // Check if explicit folder exists
                                  const explicitFolder = projectFiles.find(f => f.isFolder && f.name === folderPath);
                                  const folderFile: CodeFile = explicitFolder || {
                                    id: `implicit-${folderPath}`,
                                    name: folderPath,
                                    content: "",
                                    isFolder: true,
                                  };
                                  
                                  const node: TreeNode = {
                                    file: folderFile,
                                    children: [],
                                    path: folderPath,
                                  };
                                  folderMap.set(folderPath, node);
                                  
                                  // If nested, add to parent
                                  if (folderPath.includes("/")) {
                                    const parentPath = folderPath.substring(0, folderPath.lastIndexOf("/"));
                                    const parent = getOrCreateFolder(parentPath);
                                    if (!parent.children.some(c => c.file.id === node.file.id)) {
                                      parent.children.push(node);
                                    }
                                  }
                                  
                                  return node;
                                };
                                
                                // First pass: create all folder nodes (explicit and implicit)
                                projectFiles.forEach(file => {
                                  if (file.isFolder) {
                                    getOrCreateFolder(file.name);
                                  } else if (file.name.includes("/")) {
                                    // Create implicit folders from file paths
                                    const pathParts = file.name.split("/");
                                    for (let i = 0; i < pathParts.length - 1; i++) {
                                      const folderPath = pathParts.slice(0, i + 1).join("/");
                                      getOrCreateFolder(folderPath);
                                    }
                                  }
                                });
                                
                                // Second pass: add files to their folders
                                projectFiles.forEach(file => {
                                  if (!file.isFolder) {
                                    const pathParts = file.name.split("/");
                                    if (pathParts.length > 1) {
                                      // File is in a folder
                                      const folderPath = pathParts.slice(0, -1).join("/");
                                      const parentFolder = getOrCreateFolder(folderPath);
                                      parentFolder.children.push({
                                        file,
                                        children: [],
                                        path: file.name,
                                      });
                                    } else {
                                      // Root file
                                      rootNodes.push({
                                        file,
                                        children: [],
                                        path: file.name,
                                      });
                                    }
                                  }
                                });
                                
                                // Add root-level folders to root
                                folderMap.forEach((node, path) => {
                                  if (!path.includes("/")) {
                                    rootNodes.push(node);
                                  }
                                });
                                
                                // Sort: folders first, then files
                                const sortNode = (node: TreeNode) => {
                                  node.children.sort((a, b) => {
                                    if (a.file.isFolder && !b.file.isFolder) return -1;
                                    if (!a.file.isFolder && b.file.isFolder) return 1;
                                    return a.file.name.localeCompare(b.file.name);
                                  });
                                  node.children.forEach(sortNode);
                                };
                                
                                rootNodes.sort((a, b) => {
                                  if (a.file.isFolder && !b.file.isFolder) return -1;
                                  if (!a.file.isFolder && b.file.isFolder) return 1;
                                  return a.file.name.localeCompare(b.file.name);
                                });
                                rootNodes.forEach(sortNode);
                                
                                // Filter to show only currentDirectory contents
                                if (currentDirectory === null) {
                                  // Show root
                                  return rootNodes;
                                } else {
                                  // Show contents of currentDirectory
                                  const currentFolder = folderMap.get(currentDirectory);
                                  if (currentFolder) {
                                    return currentFolder.children;
                                  }
                                  return [];
                                }
                              };
                              
                              const renderTreeNode = (node: TreeNode, depth: number = 0): JSX.Element => {
                                const isExpanded = expandedFolders.has(node.file.id);
                                const hasChildren = node.children.length > 0;
                                
                                return (
                                  <div key={node.file.id}>
                                    <div
                                      className={`px-3 py-1.5 text-xs flex items-center gap-2 group ${
                                        node.file.isFolder
                                          ? "text-gray-500 hover:bg-gray-700/30 cursor-pointer"
                                          : activeFileId === node.file.id
                                          ? "bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400 cursor-pointer"
                                          : "text-gray-400 hover:bg-gray-700/30 hover:text-gray-300 cursor-pointer"
                                      }`}
                                      style={{ paddingLeft: `${12 + depth * 12}px` }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (node.file.isFolder) {
                                          // Navigate into folder (change currentDirectory)
                                          setCurrentDirectory(node.file.name);
                                          // Set creationTarget to match currentDirectory
                                          setCreationTarget(node.file.name);
                                        } else {
                                          // Open file (no navigation change)
                                          const fileFromStorage = getProjectFileById(params.id, node.file.id);
                                          if (fileFromStorage) {
                                            setActiveFileId(node.file.id);
                                            setCode(fileFromStorage.content);
                                          } else {
                                            setActiveFileId(node.file.id);
                                            setCode(node.file.content);
                                          }
                                        }
                                      }}
                                    >
                                      {node.file.isFolder ? (
                                        <>
                                          <span className="text-gray-500">
                                            {isExpanded ? "📂" : "📁"}
                                          </span>
                                          <span className="flex-1 truncate">
                                            {editingFileName === node.file.name ? (
                                              <input
                                                type="text"
                                                value={newFileName}
                                                onChange={(e) => setNewFileName(e.target.value)}
                                                onBlur={() => {
                                                  if (newFileName.trim() && newFileName.trim() !== node.file.name) {
                                                    try {
                                                      renameProjectFile(params.id, node.file.name, newFileName.trim());
                                                      setProjectFiles(getProjectFiles(params.id));
                                                    } catch (error) {
                                                      alert(error instanceof Error ? error.message : "Failed to rename folder");
                                                      setEditingFileName(null);
                                                      setNewFileName("");
                                                    }
                                                  }
                                                  setEditingFileName(null);
                                                  setNewFileName("");
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    if (newFileName.trim() && newFileName.trim() !== node.file.name) {
                                                      try {
                                                        renameProjectFile(params.id, node.file.name, newFileName.trim());
                                                        setProjectFiles(getProjectFiles(params.id));
                                                      } catch (error) {
                                                        alert(error instanceof Error ? error.message : "Failed to rename folder");
                                                      }
                                                    }
                                                    setEditingFileName(null);
                                                    setNewFileName("");
                                                  } else if (e.key === "Escape") {
                                                    setEditingFileName(null);
                                                    setNewFileName("");
                                                  }
                                                }}
                                                className="w-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded border border-cyan-400 focus:outline-none"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            ) : (
                                              node.file.name.split("/").pop() || node.file.name
                                            )}
                                          </span>
                                          {editingFileName === node.file.name && (
                                            <div className="flex items-center gap-1">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingFileName(null);
                                                  setNewFileName("");
                                                }}
                                                className="text-gray-500 hover:text-red-400"
                                                title="Cancel"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          )}
                                          {editingFileName !== node.file.name && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingFileName(node.file.name);
                                                  setNewFileName(node.file.name);
                                                }}
                                                className="text-gray-500 hover:text-cyan-400"
                                                title="Rename"
                                              >
                                                ✎
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Delete folder ${node.file.name} and all its contents?`)) {
                                                    // Delete folder and all files inside it
                                                    const filesToDelete = projectFiles.filter(f => 
                                                      f.name.startsWith(node.file.name + "/") || f.name === node.file.name
                                                    );
                                                    filesToDelete.forEach(f => {
                                                      deleteProjectFile(params.id, f.name);
                                                    });
                                                    const updatedFiles = getProjectFiles(params.id);
                                                    setProjectFiles(updatedFiles);
                                                    
                                                    // Check if deleted file was active
                                                    const deletedIds = filesToDelete.map(f => f.id);
                                                    if (deletedIds.includes(activeFileId || "")) {
                                                      const remainingFiles = updatedFiles.filter(f => !f.isFolder);
                                                      if (remainingFiles.length > 0) {
                                                        setActiveFileId(remainingFiles[0].id);
                                                        setCode(remainingFiles[0].content);
                                                      } else {
                                                        setActiveFileId(null);
                                                        setCode("");
                                                      }
                                                    }
                                                  }
                                                }}
                                                className="text-gray-500 hover:text-red-400"
                                                title="Delete"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <span className="flex-1 truncate">
                                            {editingFileName === node.file.name ? (
                                              <input
                                                type="text"
                                                value={newFileName}
                                                onChange={(e) => setNewFileName(e.target.value)}
                                                onBlur={() => {
                                                  if (newFileName.trim() && newFileName.trim() !== node.file.name) {
                                                    try {
                                                      renameProjectFile(params.id, node.file.name, newFileName.trim());
                                                      setProjectFiles(getProjectFiles(params.id));
                                                    } catch (error) {
                                                      alert(error instanceof Error ? error.message : "Failed to rename file");
                                                      setEditingFileName(null);
                                                      setNewFileName("");
                                                    }
                                                  }
                                                  setEditingFileName(null);
                                                  setNewFileName("");
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    if (newFileName.trim() && newFileName.trim() !== node.file.name) {
                                                      try {
                                                        renameProjectFile(params.id, node.file.name, newFileName.trim());
                                                        setProjectFiles(getProjectFiles(params.id));
                                                      } catch (error) {
                                                        alert(error instanceof Error ? error.message : "Failed to rename file");
                                                      }
                                                    }
                                                    setEditingFileName(null);
                                                    setNewFileName("");
                                                  } else if (e.key === "Escape") {
                                                    setEditingFileName(null);
                                                    setNewFileName("");
                                                  }
                                                }}
                                                className="w-full bg-gray-800 text-white text-xs px-1 py-0.5 rounded border border-cyan-400 focus:outline-none"
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                            ) : (
                                              node.file.name.split("/").pop() || node.file.name
                                            )}
                                          </span>
                                          {activeFileId === node.file.id && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingFileName(node.file.name);
                                                  setNewFileName(node.file.name);
                                                }}
                                                className="text-gray-500 hover:text-cyan-400"
                                                title="Rename"
                                              >
                                                ✎
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (confirm(`Delete ${node.file.name}?`)) {
                                                    deleteProjectFile(params.id, node.file.name);
                                                    const updatedFiles = getProjectFiles(params.id);
                                                    setProjectFiles(updatedFiles);
                                                    
                                                    // Check if deleted file was active
                                                    if (activeFileId === node.file.id) {
                                                      const remainingFiles = updatedFiles.filter(f => !f.isFolder);
                                                      if (remainingFiles.length > 0) {
                                                        setActiveFileId(remainingFiles[0].id);
                                                        setCode(remainingFiles[0].content);
                                                      } else {
                                                        setActiveFileId(null);
                                                        setCode("");
                                                      }
                                                    }
                                                  }
                                                }}
                                                className="text-gray-500 hover:text-red-400"
                                                title="Delete"
                                              >
                                                ×
                                              </button>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    {node.file.isFolder && isExpanded && hasChildren && (
                                      <div>
                                        {node.children
                                          .sort((a, b) => {
                                            if (a.file.isFolder && !b.file.isFolder) return -1;
                                            if (!a.file.isFolder && b.file.isFolder) return 1;
                                            return a.file.name.localeCompare(b.file.name);
                                          })
                                          .map(child => renderTreeNode(child, depth + 1))}
                                      </div>
                                    )}
                                  </div>
                                );
                              };
                              
                              const tree = buildTree();
                              return tree.map(node => renderTreeNode(node));
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Line numbers - scrolls with content - only show when file is active */}
                    {activeFileId && (
                      <div 
                        ref={lineNumbersRef}
                        className="flex-shrink-0 bg-gray-800/50 px-3 py-4 text-right select-none border-r border-gray-700/50 overflow-y-auto line-numbers-scrollbar"
                        style={{ height: '100%' }}
                        onScroll={(e) => {
                          // Sync line numbers scroll with code editor
                          if (codeScrollContainerRef.current) {
                            codeScrollContainerRef.current.scrollTop = e.currentTarget.scrollTop;
                          }
                        }}
                      >
                        <div className="text-xs text-gray-500 font-mono leading-6">
                          {code.split("\n").map((_, i) => {
                            const lineNum = i + 1;
                            // Check if line is part of selected step's codeRefs (optional reference)
                            const selectedStep = selectedStepId ? steps.find(s => s.id === selectedStepId) : null;
                            const isStepHighlighted = selectedStep?.codeRefs?.some(ref => 
                              lineNum >= ref.startLine && lineNum <= ref.endLine
                            );
                            
                            return (
                              <div
                                key={i}
                                className={`${
                                  isStepHighlighted ? "text-green-400 font-medium" : ""
                                }`}
                              >
                                {lineNum}
                              </div>
                            );
                          })}
                          {code.split("\n").length === 0 && <div>1</div>}
                        </div>
                      </div>
                    )}
                    {/* Code editor container - flex-1 to fill available space */}
                    {activeFileId ? (() => {
                      const activeFile = getProjectFileById(params.id, activeFileId);
                      return activeFile ? (
                        <div 
                          ref={editorContainerRef}
                          className="flex-1 flex flex-col min-w-0 min-h-0 relative" 
                          style={{ overflow: 'hidden' }}
                        >
                          {/* Scroll container with padding - allows horizontal scroll */}
                          <div 
                            ref={codeScrollContainerRef}
                            className="flex-1 overflow-y-auto overflow-x-auto code-editor-scrollbar min-h-0"
                            style={{ 
                              padding: '16px 16px 16px 12px',
                              boxSizing: 'border-box',
                              width: '100%'
                            }}
                            onScroll={(e) => {
                              // Sync code editor scroll with line numbers
                              if (lineNumbersRef.current) {
                                lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                              }
                            }}
                          >
                            <textarea
                              ref={codeTextareaRef}
                              value={code}
                              onChange={(e) => {
                                setCode(e.target.value);
                              }}
                              readOnly={false}
                              onSelect={(e) => {
                                const textarea = e.currentTarget;
                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                
                                if (start !== end) {
                                  // Calculate line numbers from selection
                                  const textBeforeStart = code.substring(0, start);
                                  const textBeforeEnd = code.substring(0, end);
                                  const startLine = textBeforeStart.split("\n").length;
                                  const endLine = textBeforeEnd.split("\n").length;
                                  
                                  setSelectedCodeRange({ start: startLine, end: endLine });
                                } else {
                                  setSelectedCodeRange(null);
                                }
                              }}
                              placeholder="Write or paste code here..."
                              className="bg-transparent text-white placeholder-gray-500 text-sm font-mono resize-none focus:outline-none focus:ring-0 focus:ring-offset-0 leading-6"
                              style={{
                                tabSize: 2,
                                width: '100%',
                                minHeight: '100%',
                                height: '100%',
                                lineHeight: '24px',
                                display: 'block',
                                boxSizing: 'border-box',
                              }}
                            />
                            {/* Step codeRefs highlighting overlay - subtle green (optional reference) */}
                            {selectedStepId && (() => {
                              const selectedStep = steps.find(s => s.id === selectedStepId);
                              if (!selectedStep?.codeRefs || selectedStep.codeRefs.length === 0) return null;
                              
                              return selectedStep.codeRefs.map((ref, idx) => {
                                const codeLines = code.split("\n");
                                const totalLines = Math.max(codeLines.length, 1);
                                const adjustedStartLine = Math.min(ref.startLine, totalLines);
                                const adjustedEndLine = Math.min(ref.endLine, totalLines);
                                
                                const lineHeight = 24; // leading-6 = 24px
                                const paddingTop = 16; // p-4 = 16px
                                const paddingLeft = 12; // pl-3 = 12px
                                const topOffset = (adjustedStartLine - 1) * lineHeight + paddingTop;
                                const height = Math.max((adjustedEndLine - adjustedStartLine + 1) * lineHeight, lineHeight);
                                
                                return (
                                  <div
                                    key={idx}
                                    className="absolute pointer-events-none z-5"
                                    style={{
                                      left: `${paddingLeft}px`,
                                      right: `${paddingTop}px`,
                                      top: `${topOffset}px`,
                                      height: `${height}px`,
                                      background: "rgba(34, 197, 94, 0.08)",
                                      borderLeft: "2px solid rgba(34, 197, 94, 0.3)",
                                      borderRadius: "4px",
                                      width: `calc(100% - ${paddingLeft + paddingTop}px)`,
                                      maxWidth: `calc(100% - ${paddingLeft + paddingTop}px)`,
                                      boxSizing: "border-box",
                                    }}
                                  />
                                );
                              });
                            })()}
                          </div>
                        </div>
                      ) : null;
                    })() : (
                      <EmptyState 
                        onCreateFile={handleCreateFile}
                      />
                    )}
                  </div>
                ) : (
                  <EmptyState 
                    onCreateFile={handleCreateFile}
                  />
                )}
              </div>
            </div>

            {/* Execution Output Panel - Interactive Terminal */}
            {executionResult && (
              <div className="glass-strong rounded-2xl p-4 md:p-8 shadow-soft-xl flex flex-col min-w-0 flex-shrink-0 mt-4 md:mt-6">
                <h2 className="text-2xl font-bold mb-4 text-white">Execution Output</h2>
                
                {/* Last Run Timestamp */}
                <div className="mb-4 flex items-center gap-2 text-xs text-gray-400">
                  <span>Last run:</span>
                  {executionResult.executionTime && executionResult.state === "completed" && (
                    <>
                      <span>{executionResult.executionTime}ms</span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    {executionResult.executedAt
                      ? new Date(executionResult.executedAt).toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                </div>

                {/* Execution Status Badge */}
                <div className="mb-4 flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      executionResult.state === "completed"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : executionResult.state === "waiting_for_input"
                        ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        : executionResult.state === "running"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {executionResult.state === "waiting_for_input" 
                      ? "🟡 Waiting for input"
                      : executionResult.state === "running"
                      ? "🔄 Running"
                      : executionResult.state === "completed"
                      ? "✓ Success"
                      : "✗ Failed"}
                  </span>
                  
                  {/* Environment Label - Always visible */}
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300 border border-gray-600/50">
                    {project?.language === "c"
                      ? "⚙️ C Phase 1 (Single-file)"
                      : project?.language === "java" 
                      ? (() => {
                              const javaFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".java"));
                          const hasPackages = javaFiles.some(f => {
                            const hasPackageDecl = f.content.match(/^\s*package\s+\S+\s*;/m);
                            const hasFolderPath = f.name.includes("/");
                            return hasPackageDecl || hasFolderPath;
                          });
                          const phase = hasPackages ? 3 : (javaFiles.length > 1 ? 2 : 1);
                          return phase === 3 
                            ? "☕ Java Phase 3 (Packages)"
                            : phase === 2
                            ? "☕ Java Phase 2"
                            : "☕ Java Phase 1";
                        })()
                      : jsExecutionMode === "browser" 
                      ? "🔧 Execution Environment: Browser (Client-side)" 
                      : "🔧 Execution Environment: Node.js (Server-side)"}
                  </span>
                </div>

                {/* C Phase 3.5 Info Banner */}
                {project?.language === "c" && (() => {
                  const cFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".c"));
                  const hFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".h"));
                  const isPhase3_5 = cFiles.length > 1 || hFiles.length > 0;
                  
                  return (
                    <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <div className="flex items-start gap-3">
                        <span className="text-blue-400 text-xl flex-shrink-0">ℹ️</span>
                        <div className="flex-1">
                          <h3 className="text-blue-400 font-semibold mb-1 text-sm">
                            {isPhase3_5 ? "C Phase 3.5: Build Graph & Multi-file Support" : "C Phase 1: Single-file execution"}
                          </h3>
                          <p className="text-gray-300 text-xs leading-relaxed">
                            {isPhase3_5 
                              ? "Multi-file projects use compile-then-link build system. Each .c file compiles to .o, then all .o files link into executable. One main() function required."
                              : "Single-file execution. Create additional .c or .h files to enable build graph."}
                          </p>
                          <p className="text-gray-400 text-xs leading-relaxed mt-2">
                            <strong>Note:</strong> C programs run inside a sandboxed container. No local compiler required.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Java Phase Detection and Info Banner */}
                {project?.language === "java" && (() => {
                              const javaFiles = projectFiles.filter(f => !f.isFolder && f.name.endsWith(".java"));
                  const hasPackages = javaFiles.some(f => {
                    const hasPackageDecl = f.content.match(/^\s*package\s+\S+\s*;/m);
                    const hasFolderPath = f.name.includes("/");
                    return hasPackageDecl || hasFolderPath;
                  });
                  
                  const phase = hasPackages ? 3 : (javaFiles.length > 1 ? 2 : 1);
                  
                  return (
                    <>
                      <div className="mb-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <div className="flex items-start gap-3">
                          <span className="text-blue-400 text-xl flex-shrink-0">ℹ️</span>
                          <div className="flex-1">
                            <h3 className="text-blue-400 font-semibold mb-1 text-sm">
                              {phase === 3 
                                ? "Java Phase 3: Package & Folder Support"
                                : phase === 2
                                ? "Java Phase 2: Multi-file execution (no packages)"
                                : "Java Phase 1: Single-file execution (Main.java only)"}
                            </h3>
                            <p className="text-gray-300 text-xs leading-relaxed">
                              {phase === 3
                                ? "Packages and folders are supported. Build tools not included. Use standard Java package structure."
                                : phase === 2
                                ? "Multiple Java files are supported. Main.java is required as the entry point. No packages or external libraries."
                                : "Single-file execution only. Main.java is required. No packages or external libraries."}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Java Validation Error Banner */}
                      {(() => {
                        const hasMainJava = javaFiles.some(f => {
                          const name = f.name.split("/").pop() || f.name;
                          return name === "Main.java";
                        });
                        const hasMainMethod = javaFiles.some(f => 
                          f.content.match(/public\s+static\s+void\s+main\s*\(/)
                        );
                        
                        if (phase === 3) {
                          // Phase 3: Check for main method (not necessarily Main.java)
                          if (!hasMainMethod) {
                            return (
                              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                  <span className="text-red-400 text-xl flex-shrink-0">❌</span>
                                  <div className="flex-1">
                                    <h3 className="text-red-400 font-semibold mb-1 text-sm">
                                      Main Method Required
                                    </h3>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                      Java Phase 3 requires exactly one public class with: public static void main(String[] args)
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        } else {
                          // Phase 1 & 2: Check for Main.java
                          if (javaFiles.length === 0) {
                            return (
                              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                  <span className="text-red-400 text-xl flex-shrink-0">❌</span>
                                  <div className="flex-1">
                                    <h3 className="text-red-400 font-semibold mb-1 text-sm">
                                      Main.java Required
                                    </h3>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                      Java Phase {phase} requires Main.java file. Please create a file named Main.java with a public class Main containing a main method.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          } else if (!hasMainJava) {
                            return (
                              <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                  <span className="text-red-400 text-xl flex-shrink-0">❌</span>
                                  <div className="flex-1">
                                    <h3 className="text-red-400 font-semibold mb-1 text-sm">
                                      Main.java Not Found
                                    </h3>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                      Java Phase {phase} requires Main.java as the entry file. Found Java files: {javaFiles.map(f => f.name).join(", ")}. Please ensure Main.java exists.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </>
                  );
                })()}

                {/* Browser API Suggestion - When browser APIs detected in Node.js mode */}
                {browserApiSuggestion?.detected && jsExecutionMode === "node" && project?.language === "javascript" && (
                  <div className="mb-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                    <div className="flex items-start gap-3">
                      <span className="text-cyan-400 text-xl flex-shrink-0">💡</span>
                      <div className="flex-1">
                        <h3 className="text-cyan-400 font-semibold mb-2 text-sm">
                          Browser API Detected
                        </h3>
                        <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                          This code uses browser APIs ({browserApiSuggestion.detectedApis.join(", ")}). 
                          These APIs are not available in Node.js and may cause errors.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setJsExecutionMode("browser");
                              localStorage.setItem(`js-execution-mode-${params.id}`, "browser");
                              setBrowserApiSuggestion(null);
                            }}
                            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-xs font-medium rounded-lg border border-cyan-500/30 transition-colors"
                          >
                            Switch to Browser Mode
                          </button>
                          <button
                            onClick={() => setBrowserApiSuggestion(null)}
                            className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700/70 text-gray-300 text-xs font-medium rounded-lg border border-gray-600/50 transition-colors"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Browser API Detection Warning - Safety Layer */}
                {executionResult.browserApiDetection?.detected && executionResult.browserApiExplanation && (
                  <div className="mb-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-start gap-3">
                      <span className="text-yellow-400 text-xl flex-shrink-0">⚠️</span>
                      <div className="flex-1">
                        <h3 className="text-yellow-400 font-semibold mb-2 text-sm">
                          Browser API Detected
                        </h3>
                        <div className="text-gray-300 text-xs whitespace-pre-wrap leading-relaxed">
                          {executionResult.browserApiExplanation}
                        </div>
                        <div className="mt-3 pt-3 border-t border-yellow-500/20">
                          <p className="text-yellow-300/80 text-xs font-medium mb-1">
                            Detected APIs: {executionResult.browserApiDetection.detectedApis.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Terminal-like Output Container */}
                {/* Latest run output - separate from history */}
                <div className="glass rounded-lg bg-gray-900/80 border border-gray-700 flex flex-col overflow-hidden">
                  {/* Terminal Output Area - Inline input support */}
                  <div className="ide-scrollbar overflow-y-auto overflow-x-hidden p-4" style={{ maxHeight: '280px', scrollBehavior: 'smooth' }}>
                    <div className="text-sm font-mono whitespace-pre-wrap break-words">
                      {/* Java: Show Compilation Output section */}
                      {project?.language === "java" && (executionResult as any).compileError && executionResult.stderr && (
                        <div className="mb-4">
                          <div className="text-red-400 font-semibold text-xs mb-2 uppercase tracking-wide">Compilation Errors</div>
                          <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap bg-red-500/10 p-3 rounded border border-red-500/20">
                            {executionResult.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {/* Java: Show Runtime Output section (if not compile error) */}
                      {project?.language === "java" && !(executionResult as any).compileError && executionResult.stdout && (
                        <div className="mb-4">
                          <div className="text-green-400 font-semibold text-xs mb-2 uppercase tracking-wide">Runtime Output</div>
                          <pre className="text-gray-100 text-sm font-mono whitespace-pre-wrap bg-green-500/10 p-3 rounded border border-green-500/20">
                            {executionResult.stdout}
                          </pre>
                        </div>
                      )}
                      
                      {/* Java: Show Runtime Errors section (if not compile error) */}
                      {project?.language === "java" && !(executionResult as any).compileError && executionResult.stderr && (
                        <div className="mb-4">
                          <div className="text-red-400 font-semibold text-xs mb-2 uppercase tracking-wide">Runtime Errors</div>
                          <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap bg-red-500/10 p-3 rounded border border-red-500/20">
                            {executionResult.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {/* Non-Java: Render stdout - terminal style with inline input */}
                      {project?.language !== "java" && executionResult.stdout && (
                        <span className="text-gray-100">
                          {executionResult.stdout}
                        </span>
                      )}
                      
                      {/* Non-Java: Show stderr normally */}
                      {project?.language !== "java" && executionResult.stderr && (
                        <pre className="text-red-400 mt-2">
                          {executionResult.stderr}
                        </pre>
                      )}
                      
                      {/* Show inline input field when waiting for input */}
                      {isWaitingForInput && executionSessionId && (
                        <span className="inline-flex items-center gap-1 text-cyan-300">
                          <input
                            ref={terminalInputRef}
                            type="text"
                            value={terminalInput}
                            onChange={(e) => setTerminalInput(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter" && terminalInput.trim() !== "") {
                                      const inputValue = terminalInput.trim();
                                      setTerminalInput("");
                                      
                                      // Do NOT echo input manually - only program output is allowed
                                      // Send input to continue execution
                                      try {
                                        const response = await fetch(`/api/projects/${params.id}/run/continue`, {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: JSON.stringify({
                                            sessionId: executionSessionId,
                                            input: inputValue,
                                          }),
                                        });
                                        
                                        const result: ExecutionResult = await response.json();
                                        
                                        // Backend returns complete stdout (prompt + new output after input)
                                        // Use it directly - no manual input echoing
                                        setExecutionResult({
                                          ...result,
                                        });
                                  
                                  // Check execution state
                                  if (result.state === "waiting_for_input" && result.sessionId) {
                                    setIsWaitingForInput(true);
                                    setExecutionSessionId(result.sessionId);
                                    setTimeout(() => {
                                      terminalInputRef.current?.focus();
                                    }, 100);
                                  } else {
                                    setIsWaitingForInput(false);
                                    setExecutionSessionId(null);
                                    setIsExecuting(false);
                                    // Refresh run history after execution completes (after interactive input)
                                    if (result.state === "completed" || result.state === "failed") {
                                      fetchRunHistory();
                                    }
                                    // Auto-explain runtime errors when execution fails
                                    if (result.state === "failed" && result.stderr) {
                                      handleAutoExplainError(result);
                                    } else {
                                      // Clear AI explanation and fix suggestion on successful run
                                      setAiErrorExplanation(null);
                                      setAiFixSuggestion(null);
                                    }
                                  }
                                } catch (error) {
                                  console.error("Failed to send input:", error);
                                  setIsWaitingForInput(false);
                                  setExecutionSessionId(null);
                                  setIsExecuting(false);
                                }
                              }
                            }}
                            className="bg-transparent text-cyan-300 font-mono text-sm focus:outline-none focus:ring-0 border-none p-0 m-0 inline-block"
                            style={{ 
                              caretColor: 'cyan', 
                              width: 'auto', 
                              minWidth: '200px',
                              outline: 'none'
                            }}
                            autoFocus
                          />
                          <span className="animate-pulse">|</span>
                        </span>
                      )}
                      
                      {/* Java: Show compile errors separately */}
                      {project?.language === "java" && (executionResult as any).compileError && executionResult.stderr && (
                        <div className="mt-2">
                          <div className="text-red-400 font-semibold text-xs mb-1">Compilation Errors:</div>
                          <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap">
                            {executionResult.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {/* Java: Show runtime errors separately (if not compile error) */}
                      {project?.language === "java" && !(executionResult as any).compileError && executionResult.stderr && (
                        <div className="mt-2">
                          <div className="text-red-400 font-semibold text-xs mb-1">Runtime Errors:</div>
                          <pre className="text-red-300 text-sm font-mono whitespace-pre-wrap">
                            {executionResult.stderr}
                          </pre>
                        </div>
                      )}
                      
                      {/* Non-Java: Show stderr normally */}
                      {project?.language !== "java" && executionResult.stderr && (
                        <pre className="text-red-400 mt-2">
                          {executionResult.stderr}
                        </pre>
                      )}
                      
                      {/* Empty state - show message for successful execution with no output */}
                      {!executionResult.stdout && !executionResult.stderr && executionResult.state === "completed" && 
                       (!executionResult.stdinInputs || executionResult.stdinInputs.length === 0) && 
                       stdinInputs.length === 0 && (
                        <div className="text-gray-400 italic">
                          {project?.language === "javascript" && jsExecutionMode === "browser" 
                            ? "No output (definitions only - code executed successfully)"
                            : "No output (code executed successfully)"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* AI Error Explanation Section - Always shown when execution fails */}
                {executionResult?.state === "failed" && (
                  <div className="mt-6 flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-white">🤖 AI Explanation</h3>
                      {isExplainingError && (
                        <span className="text-xs text-gray-400 animate-pulse">Analyzing error...</span>
                      )}
                    </div>
                    <div className="ide-scrollbar glass rounded-lg bg-gray-900/80 border border-cyan-500/30 p-4 overflow-y-auto" style={{ maxHeight: '300px', scrollBehavior: 'smooth' }}>
                      {isExplainingError ? (
                        <div className="text-sm text-gray-400 text-center py-4">
                          <span className="animate-spin inline-block mr-2">⏳</span>
                          Getting AI explanation...
                        </div>
                      ) : aiErrorExplanation ? (
                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                          {aiErrorExplanation}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          AI explanation temporarily unavailable.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Fix My Code Button and Results */}
                {executionResult?.state === "failed" && executionResult.stderr && (
                  <div className="mt-6 flex-shrink-0">
                    {/* Fix My Code Button */}
                    <button
                      onClick={handleFixMyCode}
                      disabled={isFixingCode || isExplainingError}
                      className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium rounded-lg shadow-lg transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isFixingCode ? (
                        <>
                          <span className="animate-spin">⏳</span>
                          <span>Analyzing code...</span>
                        </>
                      ) : (
                        <>
                          <span>🛠</span>
                          <span>Fix My Code</span>
                        </>
                      )}
                    </button>
                    
                    {/* Fix Suggestion Results */}
                    {aiFixSuggestion && (
                      <div className="mt-4 glass rounded-lg bg-gray-900/80 border border-orange-500/30 p-4">
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-orange-400 mb-2">Fix Summary</h4>
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {aiFixSuggestion.summary}
                          </p>
                          {aiFixSuggestion.notes && (
                            <p className="text-xs text-gray-400 mt-2 italic">
                              {aiFixSuggestion.notes}
                            </p>
                          )}
                        </div>
                        
                        {/* Code Changes */}
                        {aiFixSuggestion.filesToChange.length > 0 && (
                          <div className="mt-4 space-y-4">
                            <h4 className="text-sm font-semibold text-orange-400 mb-2">Suggested Changes</h4>
                            {aiFixSuggestion.filesToChange.map((fileChange, idx) => (
                              <div key={idx} className="border border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-800/50 px-3 py-2 border-b border-gray-700">
                                  <span className="text-xs font-mono text-cyan-400">{fileChange.filename}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-0">
                                  {/* Original Code */}
                                  <div className="border-r border-gray-700">
                                    <div className="bg-red-500/10 px-2 py-1 text-xs text-red-400 font-semibold border-b border-gray-700">
                                      Original
                                    </div>
                                    <pre className="ide-scrollbar text-xs font-mono text-gray-300 p-3 overflow-x-auto overflow-y-auto max-h-64 bg-gray-900/50 whitespace-pre-wrap break-words">
                                      {fileChange.originalCode}
                                    </pre>
                                  </div>
                                  {/* Fixed Code */}
                                  <div>
                                    <div className="bg-green-500/10 px-2 py-1 text-xs text-green-400 font-semibold border-b border-gray-700">
                                      Fixed
                                    </div>
                                    <pre className="ide-scrollbar text-xs font-mono text-gray-300 p-3 overflow-x-auto overflow-y-auto max-h-64 bg-gray-900/50 whitespace-pre-wrap break-words">
                                      {fileChange.fixedCode}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {aiFixSuggestion.filesToChange.length === 0 && (
                          <div className="mt-4 text-sm text-gray-400 italic">
                            No automatic fixes available. Please review the error and fix manually.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Run History Panel */}
                {/* Historical runs - separate from latest run in Execution Output */}
                <div className="mt-6 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-white mb-3">Run History</h3>
                  <div className="ide-scrollbar glass rounded-lg bg-gray-900/80 border border-gray-700 overflow-y-auto overflow-x-hidden" style={{ maxHeight: '260px', scrollBehavior: 'smooth' }}>
                    {isLoadingHistory ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Loading history...
                      </div>
                    ) : runHistory.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No run history yet. Execute your project to see history here.
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700">
                        {/* TODO: Add pagination for large history lists */}
                        {runHistory.map((run) => (
                          <div key={run.id} className="p-4 hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    run.status === "success"
                                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                                  }`}
                                >
                                  {run.status === "success" ? "✓ Success" : "✗ Failed"}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(run.executedAt).toLocaleString()}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {run.executionTimeMs}ms
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setExpandedRunId(expandedRunId === run.id ? null : run.id);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-gray-700/50 transition-colors"
                              >
                                {expandedRunId === run.id ? "Hide Output" : "View Output"}
                              </button>
                            </div>
                            
                            {expandedRunId === run.id && (
                              <div className="mt-3 space-y-2">
                                {run.stdout && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-400 mb-1">stdout:</div>
                                    <pre className="ide-scrollbar text-sm font-mono text-gray-100 bg-gray-800/50 p-2 rounded border border-gray-700 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                      {run.stdout}
                                    </pre>
                                  </div>
                                )}
                                {run.stderr && (
                                  <div>
                                    <div className="text-xs font-semibold text-gray-400 mb-1">stderr:</div>
                                    <pre className="ide-scrollbar text-sm font-mono text-red-400 bg-gray-800/50 p-2 rounded border border-gray-700 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                                      {run.stderr}
                                    </pre>
                                  </div>
                                )}
                                {!run.stdout && !run.stderr && (
                                  <div className="text-xs text-gray-500">No output</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RIGHT COLUMN - Steps + Ask AI */}
          {(isStepsOpen || isAskAIOpen) && (
            <aside className="md:col-span-4 min-w-0 flex flex-col gap-4 md:gap-6">
            {/* Steps Section */}
              {isStepsOpen && (
                <section className="min-w-0 flex flex-col">
                  <div className="glass-strong rounded-2xl p-4 md:p-8 shadow-soft-xl min-w-0 flex flex-col" style={{ maxHeight: '600px' }}>
                    <div className="flex items-center justify-between mb-6 flex-shrink-0">
                      <h2 className="text-2xl font-bold text-white">Steps</h2>
                      <button
                        onClick={() => setIsStepsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
                        title="Hide Steps"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                
                {/* Create Step Form */}
                <form onSubmit={handleCreateStep} className="mb-6 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="Enter step title"
                      className="flex-1 px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none text-sm"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg text-sm hover:opacity-90 transition-opacity"
                    >
                      Add
                    </button>
                  </div>
                </form>

                {/* Steps List - Scrollable Container */}
                {steps.length === 0 ? (
                  <div className="glass rounded-xl p-6 border border-gray-700 flex items-center justify-center">
                    <p className="text-gray-400 text-sm text-center py-4">
                      No steps yet. Steps will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="ide-scrollbar overflow-y-auto space-y-3" style={{ maxHeight: '500px' }}>
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`glass rounded-xl p-4 border transition-colors cursor-pointer ${
                          selectedStepId === step.id
                            ? "border-cyan-400 bg-cyan-400/10"
                            : "border-gray-700 hover:border-cyan-400/50"
                        }`}
                        onClick={() => setSelectedStepId(step.id)}
                      >
                          <div className="flex-1">
                            <Link
                              href={`/dashboard/projects/${params.id}/steps/${step.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block text-sm font-medium cursor-pointer hover:text-cyan-400 transition-colors text-white"
                            >
                              {step.title}
                            </Link>
                            {step.description && (
                              <p className="text-gray-400 text-xs mt-1">
                                {step.description}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
              )}

              {/* Ask AI Section */}
              {isAskAIOpen && (
                <section className="min-w-0 flex flex-col">
                  <div className="glass-strong rounded-2xl p-4 md:p-8 shadow-soft-xl flex flex-col min-w-0" style={{ maxHeight: '600px' }}>
                    <div className="flex items-center justify-between mb-4 flex-shrink-0">
                      <h2 className="text-2xl font-bold text-white">Ask AI</h2>
                      <button
                        onClick={() => setIsAskAIOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-gray-700/50"
                        title="Hide Ask AI"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                <p className="text-xs text-gray-400 mb-4 flex-shrink-0">
                  Ask questions about your selected code, current file, or entire project.
                </p>
                
                <div className="ide-scrollbar flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: '500px' }}>
                  <div className="flex-shrink-0">
                    <textarea
                      value={askAIPrompt}
                      onChange={(e) => setAskAIPrompt(e.target.value)}
                      placeholder="Ask AI about your code..."
                      className="w-full h-24 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-cyan-400"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleAskAI();
                        }
                      }}
                    />
                    <button
                      onClick={handleAskAI}
                      disabled={!askAIPrompt.trim() || isAskingAI}
                      className="mt-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAskingAI ? "Asking..." : "Ask AI (⌘+Enter)"}
                    </button>
                  </div>
                  
                  {askAIResponse && (
                    <div className="ide-scrollbar overflow-y-auto glass rounded-lg p-4 bg-gray-800/50 border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-cyan-400">Response</h3>
                        <button
                          onClick={() => setAskAIResponse(null)}
                          className="text-gray-400 hover:text-white text-xs"
                        >
                          Clear
                        </button>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {askAIResponse}
                      </p>
                    </div>
                  )}
                  
                  {!askAIResponse && (
                    <div className="flex items-center justify-center">
                      <p className="text-gray-500 text-sm text-center">
                        {selectedCodeRange 
                          ? "Ask about your selected code, current file, or entire project."
                          : "Select code or ask about your current file or entire project."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
              )}
          </aside>
          )}

          {/* Collapsed Panel Buttons - Show when panels are hidden */}
          {(!isOverviewOpen || !isStepsOpen || !isAskAIOpen) && (
            <div className="fixed right-4 top-20 z-40 flex flex-col gap-2">
              {!isOverviewOpen && (
                <button
                  onClick={() => setIsOverviewOpen(true)}
                  className="glass-strong rounded-lg p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-700/50"
                  title="Show Overview"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {!isStepsOpen && (
                <button
                  onClick={() => setIsStepsOpen(true)}
                  className="glass-strong rounded-lg p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-700/50"
                  title="Show Steps"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {!isAskAIOpen && (
                <button
                  onClick={() => setIsAskAIOpen(true)}
                  className="glass-strong rounded-lg p-2 text-gray-400 hover:text-white transition-colors hover:bg-gray-700/50"
                  title="Show Ask AI"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

    </main>
  );
}
