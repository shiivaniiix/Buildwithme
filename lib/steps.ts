import { addTicket, getTickets } from "./tickets";
import { validateStepSemantics } from "./stepValidation";
import { getProjectFiles, saveProjectFiles, ensureProjectHasFile, getProjectFileContent } from "./projectFiles";
import { validateStepWithAI, prepareAIValidationRequest, type AIValidationResponse } from "./aiValidation";

export type StepValidationResult = {
  blocked: boolean;
  reason?: string;
};

export type StepHighlight = {
  file: string;
  startLine: number;
  endLine: number;
};

export type Substep = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

export type Step = {
    id: string;
    title: string;
    description?: string;
    status: "pending" | "blocked" | "done";
    difficulty?: "easy" | "medium" | "hard";
    estimatedMinutes?: number;
    createdAt: number;
    completedAt?: number;
    lastUpdatedAt: number;
    blockedReason?: string;
    // New architecture: step references project files
    files?: string[]; // File names referenced by this step
    highlights?: StepHighlight[]; // Code regions to highlight
    requirements?: string[]; // Validation requirements (e.g., "variable exists", "function call exists")
    // AI breakdown substeps (read-only guidance)
    substeps?: Substep[];
    // Legacy fields for backward compatibility
    code?: string;
    codeRefs?: { startLine: number; endLine: number }[];
  };
  
  const storageKey = (projectId: string) =>
    `buildwithme-steps-${projectId}`;
  
  function hasOpenTicketForStep(projectId: string, stepId: string): boolean {
    if (typeof window === "undefined") return false;
    const tickets = getTickets(projectId);
    return tickets.some(t => t.stepId === stepId && t.status === "open");
  }

  /**
   * Detects which lines of code satisfy a step based on heuristics.
   * Simple keyword and structure matching - no external parsing libraries.
   */
  function detectCodeRefs(step: Step, code: string): { startLine: number; endLine: number }[] {
    if (!code || code.trim().length === 0) {
      return [];
    }

    const lines = code.split("\n");
    const stepTitle = step.title.toLowerCase();
    const stepDescription = (step.description || "").toLowerCase();
    const codeLower = code.toLowerCase();

    // Extract keywords from step title and description
    const keywords: string[] = [];
    
    // Common patterns to extract from step title
    const titleWords = stepTitle.split(/\s+/).filter(w => w.length > 3);
    keywords.push(...titleWords);

    // Extract action verbs and important nouns
    const actionVerbs = ["create", "add", "implement", "build", "setup", "configure", "define", "write", "make"];
    const foundVerbs = actionVerbs.filter(v => stepTitle.includes(v));
    keywords.push(...foundVerbs);

    // Extract technology/framework names (common patterns)
    const techPatterns = /\b(react|vue|angular|node|express|typescript|javascript|python|java|html|css|api|route|component|function|class|interface|type|const|let|var|import|export)\b/gi;
    const techMatches = [...codeLower.matchAll(techPatterns)];
    const techKeywords = [...new Set(techMatches.map(m => m[0]))];
    keywords.push(...techKeywords);

    // Find lines that contain relevant keywords
    const relevantLines: number[] = [];
    lines.forEach((line, index) => {
      const lineLower = line.toLowerCase();
      const hasKeyword = keywords.some(kw => lineLower.includes(kw));
      const hasCode = line.trim().length > 0 && !line.trim().startsWith("//") && !line.trim().startsWith("/*");
      
      if (hasKeyword && hasCode) {
        relevantLines.push(index + 1); // 1-indexed line numbers
      }
    });

    // If no keyword matches, use structural heuristics
    if (relevantLines.length === 0) {
      // For very short code, return entire block
      if (lines.length <= 5) {
        return [{ startLine: 1, endLine: Math.max(1, lines.length) }];
      }

      // Find function/class definitions (common implementation patterns)
      const structurePatterns = [
        /^(function|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+\s*\(|class\s+\w+|interface\s+\w+|type\s+\w+|export\s+(const|function|class|interface|type))/,
        /^(public|private|protected)\s+\w+/,
      ];

      lines.forEach((line, index) => {
        if (structurePatterns.some(pattern => pattern.test(line.trim()))) {
          relevantLines.push(index + 1);
        }
      });

      // If still no matches, return first non-empty code block
      if (relevantLines.length === 0) {
        let firstCodeLine = 1;
        let lastCodeLine = lines.length;
        
        // Skip leading comments/whitespace
        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
            firstCodeLine = i + 1;
            break;
          }
        }

        // Find last non-empty line
        for (let i = lines.length - 1; i >= 0; i--) {
          const trimmed = lines[i].trim();
          if (trimmed && !trimmed.startsWith("//") && !trimmed.startsWith("/*")) {
            lastCodeLine = i + 1;
            break;
          }
        }

        return [{ startLine: firstCodeLine, endLine: lastCodeLine }];
      }
    }

    // Group consecutive lines into ranges
    if (relevantLines.length === 0) {
      return [];
    }

    relevantLines.sort((a, b) => a - b);
    const ranges: { startLine: number; endLine: number }[] = [];
    let currentStart = relevantLines[0];
    let currentEnd = relevantLines[0];

    for (let i = 1; i < relevantLines.length; i++) {
      if (relevantLines[i] <= currentEnd + 3) {
        // Within 3 lines, extend range
        currentEnd = relevantLines[i];
      } else {
        // New range
        ranges.push({ startLine: currentStart, endLine: currentEnd });
        currentStart = relevantLines[i];
        currentEnd = relevantLines[i];
      }
    }
    ranges.push({ startLine: currentStart, endLine: currentEnd });

    // Merge overlapping or adjacent ranges
    const merged: { startLine: number; endLine: number }[] = [];
    ranges.forEach(range => {
      if (merged.length === 0) {
        merged.push(range);
      } else {
        const last = merged[merged.length - 1];
        if (range.startLine <= last.endLine + 2) {
          // Merge if within 2 lines
          last.endLine = Math.max(last.endLine, range.endLine);
        } else {
          merged.push(range);
        }
      }
    });

    return merged;
  }
  
  function normalizeSteps(steps: any[], projectId: string): Step[] {
    const now = Date.now();
    return steps.map(step => {
      // Remove completed field if it exists, keep only status
      const { completed, ...rest } = step;
      const createdAt = step.createdAt ?? now;
      const lastUpdatedAt = step.lastUpdatedAt ?? createdAt;
      
      // Migration: Move step-level files to project-level storage
      let stepFiles: string[] = step.files; // New format: string[]
      let highlights: StepHighlight[] = step.highlights;
      
      // Check if this is old format (CodeFile[] array)
      if (step.files && Array.isArray(step.files) && step.files.length > 0) {
        const firstFile = step.files[0];
        // Check if it's old format (has 'id' and 'content' properties)
        if (firstFile && typeof firstFile === 'object' && 'id' in firstFile && 'content' in firstFile) {
          // Migrate old step files to project files
          if (typeof window !== "undefined") {
            const projectFiles = getProjectFiles(projectId);
            const fileNames: string[] = [];
            
            step.files.forEach((oldFile: any) => {
              // Check if file already exists in project
              const existingFile = projectFiles.find(pf => pf.name === oldFile.name);
              if (existingFile) {
                // Merge content if project file is empty
                if (!existingFile.content.trim() && oldFile.content.trim()) {
                  const updated = projectFiles.map(pf =>
                    pf.name === oldFile.name ? { ...pf, content: oldFile.content } : pf
                  );
                  saveProjectFiles(projectId, updated);
                }
                fileNames.push(oldFile.name);
              } else {
                // Add new file to project
                const newFile = {
                  id: oldFile.id || `${projectId}-file-${Date.now()}`,
                  name: oldFile.name,
                  content: oldFile.content || "",
                  isEntry: oldFile.isEntry || false,
                };
                saveProjectFiles(projectId, [...projectFiles, newFile]);
                fileNames.push(oldFile.name);
              }
            });
            
            stepFiles = fileNames;
            
            // Convert codeRefs to highlights if they exist
            if (step.codeRefs && step.codeRefs.length > 0 && stepFiles.length > 0) {
              highlights = step.codeRefs.map((ref: { startLine: number; endLine: number }) => ({
                file: stepFiles[0], // Use first file as default
                startLine: ref.startLine,
                endLine: ref.endLine,
              }));
            }
          }
        } else if (Array.isArray(step.files) && typeof step.files[0] === 'string') {
          // Already new format
          stepFiles = step.files;
        }
      }
      
      // Migrate old code field to project file if no files exist
      if ((!stepFiles || stepFiles.length === 0) && step.code) {
        const oldCode = step.code || "";
        if (typeof window !== "undefined") {
          ensureProjectHasFile(projectId);
          const entryFile = getProjectFiles(projectId).find(f => f.isEntry) || getProjectFiles(projectId)[0];
          if (entryFile) {
            // Merge old code into entry file if it's empty
            if (!entryFile.content.trim() && oldCode.trim()) {
              const projectFiles = getProjectFiles(projectId);
              const updated = projectFiles.map(f =>
                f.name === entryFile.name ? { ...f, content: oldCode } : f
              );
              saveProjectFiles(projectId, updated);
            }
            stepFiles = [entryFile.name];
            
            // Convert codeRefs to highlights
            if (step.codeRefs && step.codeRefs.length > 0) {
              highlights = step.codeRefs.map((ref: { startLine: number; endLine: number }) => ({
                file: entryFile.name,
                startLine: ref.startLine,
                endLine: ref.endLine,
              }));
            }
          }
        }
      }
      
      return {
        ...rest,
        status: step.status ?? (step.completed ? "done" : "pending"),
        difficulty: step.difficulty ?? "medium",
        estimatedMinutes: step.estimatedMinutes ?? 10,
        createdAt,
        lastUpdatedAt,
        completedAt: step.completedAt,
        code: step.code ?? "", // Keep for backward compatibility
        codeRefs: step.codeRefs ?? undefined, // Keep for backward compatibility
        files: stepFiles,
        highlights,
        requirements: step.requirements ?? undefined,
      };
    });
  }
  
  export function getSteps(projectId: string): Step[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(storageKey(projectId));
    const raw = stored ? JSON.parse(stored) : [];
    return normalizeSteps(raw, projectId);
  }
  
  
  export function addStep(
    projectId: string,
    step: Omit<Step, "createdAt" | "lastUpdatedAt">
  ) {
    const now = Date.now();
  
    const enrichedStep: Step = {
      ...step,
      createdAt: now,
      lastUpdatedAt: now,
    };
  
    const steps = getSteps(projectId);
    localStorage.setItem(
      storageKey(projectId),
      JSON.stringify([...steps, enrichedStep])
    );
  }
  
  
  
  export function toggleStep(projectId: string, stepId: string) {
    const now = Date.now();
    const steps = getSteps(projectId).map(step => {
      if (step.id === stepId) {
        const newStatus = step.status === "done" ? "pending" : "done";
        const baseUpdate = {
          ...step,
          status: newStatus,
          lastUpdatedAt: now,
        };
        
        if (newStatus === "done") {
          return {
            ...baseUpdate,
            completedAt: now,
          };
        } else {
          const { completedAt, ...rest } = baseUpdate;
          return rest;
        }
      }
      return step;
    });
  
    localStorage.setItem(
      storageKey(projectId),
      JSON.stringify(steps)
    );
  }
  
  /** 🔥 THIS MUST EXIST EXACTLY LIKE THIS 🔥 */
  export function updateStepDescription(
    projectId: string,
    stepId: string,
    description: string
  ) {
    const now = Date.now();
    const steps = getSteps(projectId).map(step =>
      step.id === stepId
        ? { ...step, description, lastUpdatedAt: now }
        : step
    );
  
    localStorage.setItem(
      storageKey(projectId),
      JSON.stringify(steps)
    );
  }
  
  /**
   * Get highlighted code region for a step
   */
  function getStepHighlightedCodeRegion(projectId: string, step: Step): string {
    if (!step.highlights || step.highlights.length === 0) {
      // If no highlights, use first referenced file
      if (step.files && step.files.length > 0) {
        return getProjectFileContent(projectId, step.files[0]);
      }
      // Fallback to old code field
      return step.code || "";
    }
    
    // Extract code from highlighted regions
    const codeParts: string[] = [];
    step.highlights.forEach((highlight: StepHighlight) => {
      const fileContent = getProjectFileContent(projectId, highlight.file);
      const lines = fileContent.split("\n");
      const relevantLines = lines.slice(
        Math.max(0, highlight.startLine - 1),
        Math.min(lines.length, highlight.endLine)
      );
      codeParts.push(relevantLines.join("\n"));
    });
    
    return codeParts.join("\n\n");
  }

  /**
   * Validate requirements in highlighted code region
   */
  function validateStepRequirements(projectId: string, step: Step): { valid: boolean; missingRequirements?: string[] } {
    if (!step.requirements || step.requirements.length === 0) {
      return { valid: true };
    }
    
    const highlightedCode = getStepHighlightedCodeRegion(projectId, step);
    const missing: string[] = [];
    
    step.requirements.forEach((requirement: string) => {
      const lowerReq = requirement.toLowerCase();
      let found = false;
      
      // Simple heuristic checks
      if (lowerReq.includes("variable") && lowerReq.includes("exists")) {
        found = /\b\w+\s*=/.test(highlightedCode);
      } else if (lowerReq.includes("function") && lowerReq.includes("call")) {
        found = /\w+\s*\(/.test(highlightedCode);
      } else if (lowerReq.includes("print")) {
        found = /\bprint\s*\(/.test(highlightedCode) || /\bconsole\.log\s*\(/.test(highlightedCode);
      } else if (lowerReq.includes("return")) {
        found = /\breturn\s+/.test(highlightedCode);
      } else if (lowerReq.includes("import")) {
        found = /\bimport\s+/.test(highlightedCode) || /\bfrom\s+\w+\s+import/.test(highlightedCode);
      } else {
        const keyword = requirement.split(" ")[0].toLowerCase();
        found = new RegExp(`\\b${keyword}\\b`, "i").test(highlightedCode);
      }
      
      if (!found) {
        missing.push(requirement);
      }
    });
    
    return {
      valid: missing.length === 0,
      missingRequirements: missing.length > 0 ? missing : undefined,
    };
  }

  export async function canCompleteStep(
    projectId: string,
    stepId: string,
    code?: string // Optional, will use highlighted region if not provided
  ): Promise<{ valid: boolean; reason?: string; codeRefs?: { startLine: number; endLine: number }[]; missingRequirements?: string[] }> {
    if (typeof window === "undefined") {
      return { valid: false, reason: "Cannot validate in server context" };
    }

    const step = getStepById(projectId, stepId);
    if (!step) {
      return { valid: false, reason: "Step not found" };
    }

    // Check if step is blocked
    if (step.status === "blocked") {
      return { valid: false, reason: "Blocked steps cannot be completed" };
    }

    // Check if there are open tickets for this step
    if (hasOpenTicketForStep(projectId, stepId)) {
      return { valid: false, reason: "This step has unresolved tickets" };
    }

    // Get highlighted code region (or use provided code for backward compatibility)
    const highlightedCode = code || getStepHighlightedCodeRegion(projectId, step);
    
    // Check if code is not empty
    if (!highlightedCode || highlightedCode.trim().length === 0) {
      return { valid: false, reason: "Add some code before completing this step" };
    }

    // Check if previous steps are completed
    const allSteps = getSteps(projectId);
    // Sort steps by creation time to determine order
    const sortedSteps = [...allSteps].sort((a, b) => a.createdAt - b.createdAt);
    const currentStepIndex = sortedSteps.findIndex(s => s.id === stepId);
    
    if (currentStepIndex > 0) {
      // Check all previous steps (steps created before this one)
      const previousSteps = sortedSteps.slice(0, currentStepIndex);
      const incompletePreviousSteps = previousSteps.filter(s => s.status !== "done");
      
      if (incompletePreviousSteps.length > 0) {
        const incompleteCount = incompletePreviousSteps.length;
        return { 
          valid: false, 
          reason: `Complete ${incompleteCount} previous step${incompleteCount > 1 ? 's' : ''} first` 
        };
      }
    }

    // AI-based validation - replaces hardcoded validation logic
    // Get project files for AI analysis
    const projectFiles = getProjectFiles(projectId);
    const aiRequest = prepareAIValidationRequest(
      step,
      projectFiles,
      (fileName: string) => getProjectFileContent(projectId, fileName)
    );
    
    // Perform AI validation (async, but we'll handle it synchronously for now)
    // In production, this should be awaited, but for compatibility we'll use a promise
    try {
      const aiResponse = await validateStepWithAI(aiRequest);
      
      // Convert AI response to validation result
      if (aiResponse.status === "completed") {
        const codeRefs = step.highlights?.map((h: StepHighlight) => ({
          startLine: h.startLine,
          endLine: h.endLine,
        }));
        return { valid: true, codeRefs };
      } else {
        return {
          valid: false,
          reason: aiResponse.reason,
          missingRequirements: aiResponse.missingRequirements || aiResponse.suggestions,
        };
      }
    } catch (error) {
      // Fallback to basic validation if AI fails
      console.error("AI validation failed, using fallback:", error);
      
      // Basic validation fallback
      if (!highlightedCode || highlightedCode.trim().length === 0) {
        return { valid: false, reason: "Add some code before completing this step" };
      }
      
      // Convert highlights to codeRefs for backward compatibility
      const codeRefs = step.highlights?.map((h: StepHighlight) => ({
        startLine: h.startLine,
        endLine: h.endLine,
      }));
      
      return { valid: true, codeRefs };
    }
  }

  export async function updateStepStatus(
    projectId: string,
    stepId: string,
    status: Step["status"]
  ): Promise<StepValidationResult> {
    const now = Date.now();
    const steps = getSteps(projectId);
    const step = steps.find(s => s.id === stepId);
    
    // Validate before allowing completion
    let detectedCodeRefs: { startLine: number; endLine: number }[] | undefined;
    if (status === "done" && step) {
      const validation = await canCompleteStep(projectId, stepId); // Uses highlighted region automatically
      if (!validation.valid) {
        // Auto-create ticket from AI validation feedback
        if (validation.missingRequirements && validation.missingRequirements.length > 0 && typeof window !== "undefined") {
          // Get AI validation response for suggestions
          const projectFiles = getProjectFiles(projectId);
          const { prepareAIValidationRequest, validateStepWithAI } = await import("./aiValidation");
          const aiRequest = prepareAIValidationRequest(
            step,
            projectFiles,
            (fileName: string) => getProjectFileContent(projectId, fileName)
          );
          
          let aiSuggestions: string[] = [];
          try {
            const aiResponse = await validateStepWithAI(aiRequest);
            aiSuggestions = aiResponse.suggestions || [];
          } catch (error) {
            console.error("Failed to get AI suggestions:", error);
          }
          
          // Check if ticket already exists for this validation issue
          const existingTickets = getTickets(projectId);
          const validationTicketExists = existingTickets.some(
            t => t.stepId === stepId && 
                 t.status === "open" && 
                 (t.title.includes("Step incomplete") || t.title.includes(validation.reason || ""))
          );
          
          if (!validationTicketExists) {
            const ticketTitle = `Step incomplete: ${validation.reason || validation.missingRequirements[0]}`;
            const ticketDescription = [
              validation.reason || "Step requirements not met",
              "",
              "Missing requirements:",
              ...validation.missingRequirements.map((req, idx) => `${idx + 1}. ${req}`),
              ...(aiSuggestions.length > 0 ? ["", "Suggestions:", ...aiSuggestions.map((s, idx) => `• ${s}`)] : []),
            ].join("\n");
            
            // Infer code range for ticket (use step highlights if available)
            let codeRange = { startLine: 1, endLine: 5 };
            if (step.highlights && step.highlights.length > 0) {
              const firstHighlight = step.highlights[0];
              codeRange = {
                startLine: firstHighlight.startLine,
                endLine: firstHighlight.endLine,
              };
            } else if (step.files && step.files.length > 0) {
              // Use first referenced file
              const fileContent = getProjectFileContent(projectId, step.files[0]);
              const codeLines = fileContent.split("\n");
              const totalLines = Math.max(codeLines.length, 1);
              codeRange = totalLines < 10 
                ? { startLine: 1, endLine: totalLines }
                : { startLine: 1, endLine: Math.min(5, totalLines) };
            }
            
            addTicket(projectId, {
              id: Date.now().toString(),
              title: ticketTitle,
              projectId,
              stepId,
              status: "open",
              codeContext: {
                startLine: codeRange.startLine,
                endLine: codeRange.endLine,
                reason: ticketDescription,
              },
            });
          }
        }
        
        // Return early - status update is blocked
        return { blocked: true, reason: validation.reason };
      }
      // Store detected code refs for traceability
      detectedCodeRefs = validation.codeRefs;
    }
    
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        const baseUpdate = {
          ...step,
          status,
          lastUpdatedAt: now,
        };
        
        if (status === "done") {
          return {
            ...baseUpdate,
            completedAt: now,
            codeRefs: detectedCodeRefs, // Store code refs when marking as done
          };
        } else {
          const { completedAt, codeRefs, ...rest } = baseUpdate;
          return rest;
        }
      }
      return step;
    });
  
    localStorage.setItem(
      storageKey(projectId),
      JSON.stringify(updatedSteps)
    );

    // Automatically create ticket when step is blocked AND has a reason
    if (status === "blocked" && step) {
      const updatedStep = updatedSteps.find(s => s.id === stepId);
      if (updatedStep && updatedStep.blockedReason && !hasOpenTicketForStep(projectId, stepId)) {
        if (typeof window !== "undefined") {
          addTicket(projectId, {
            id: Date.now().toString(),
            title: step.title,
            projectId,
            stepId,
            status: "open",
          });
        }
      }
    }

    return { blocked: false };
  }

  /**
   * Updates substeps for a step (from AI breakdown)
   */
  export function updateStepSubsteps(
    projectId: string,
    stepId: string,
    substeps: Substep[]
  ): void {
    if (typeof window === "undefined") return;
    
    const steps = getSteps(projectId);
    const updatedSteps = steps.map(step =>
      step.id === stepId
        ? { ...step, substeps, lastUpdatedAt: Date.now() }
        : step
    );
    
    localStorage.setItem(storageKey(projectId), JSON.stringify(updatedSteps));
  }

  export function updateStepBlockedReason(
    projectId: string,
    stepId: string,
    reason: string
  ) {
    const now = Date.now();
    const steps = getSteps(projectId);
    const step = steps.find(s => s.id === stepId);
    
    const updatedSteps = steps.map(step =>
      step.id === stepId
        ? { ...step, blockedReason: reason, lastUpdatedAt: now }
        : step
        );
      
        localStorage.setItem(
          storageKey(projectId),
      JSON.stringify(updatedSteps)
    );

    // Automatically create ticket if step is blocked and now has a reason
    if (step && step.status === "blocked" && reason && !hasOpenTicketForStep(projectId, stepId)) {
      if (typeof window !== "undefined") {
        addTicket(projectId, {
          id: Date.now().toString(),
          title: step.title,
          projectId,
          stepId,
          status: "open",
        });
      }
    }
  }

  export function getStepById(projectId: string, stepId: string): Step | undefined {
    const steps = getSteps(projectId);
    return steps.find(s => s.id === stepId);
  }

  /**
   * Legacy function - kept for backward compatibility
   * Updates project file content (not step-specific)
   */
  export function updateStepCode(
    projectId: string,
    stepId: string,
    code: string
  ) {
    // In new architecture, code is stored at project level
    // Find the file referenced by this step
    const step = getStepById(projectId, stepId);
    if (step && step.files && step.files.length > 0) {
      const { updateProjectFileContent } = require("./projectFiles");
      updateProjectFileContent(projectId, step.files[0], code);
    }
  }

  /**
   * Legacy function - kept for backward compatibility
   * Gets file content for a step
   */
  export function getActiveFileContent(projectId: string, stepId: string): string {
    const step = getStepById(projectId, stepId);
    if (!step) return "";
    
    // If step references files, get content from project files
    if (step.files && step.files.length > 0) {
      return getProjectFileContent(projectId, step.files[0]);
    }
    
    // Fallback to old code field
    return step.code || "";
  }

  /**
   * Explains why a step is complete, blocked, or what's missing.
   * Returns a human-readable explanation for traceability.
   */
  export async function explainStepCompletion(
    projectId: string,
    stepId: string,
    code?: string
  ): Promise<{
    status: "done" | "blocked" | "pending" | "incomplete";
    explanation: string;
    codeRefs?: { startLine: number; endLine: number }[];
    missingCode?: string;
  }> {
    if (typeof window === "undefined") {
      return {
        status: "pending",
        explanation: "Cannot explain in server context",
      };
    }

    const step = getStepById(projectId, stepId);
    if (!step) {
      return {
        status: "pending",
        explanation: "Step not found",
      };
    }

    // Get code from active file if not provided
    const stepCode = code || getActiveFileContent(projectId, stepId);

    // If step is blocked, explain why
    if (step.status === "blocked") {
      return {
        status: "blocked",
        explanation: step.blockedReason || "Step is blocked",
        codeRefs: step.codeRefs,
      };
    }

    // Validate completion (async)
    try {
      const validation = await canCompleteStep(projectId, stepId, code);

      if (validation.valid) {
        const codeRefs = validation.codeRefs || step.highlights?.map((h: StepHighlight) => ({
          startLine: h.startLine,
          endLine: h.endLine,
        })) || [];
        if (codeRefs.length > 0) {
          const refsText = codeRefs
            .map((ref: { startLine: number; endLine: number }) => 
              ref.startLine === ref.endLine 
                ? `line ${ref.startLine}` 
                : `lines ${ref.startLine}-${ref.endLine}`
            )
            .join(", ");
          return {
            status: "done",
            explanation: `Step is complete. Implementation found at ${refsText}.`,
            codeRefs,
          };
        } else {
          return {
            status: "done",
            explanation: "Step is complete. Code has been added.",
          };
        }
      }

      // Step cannot be completed - explain what's missing
      const highlightedCode = code || getStepHighlightedCodeRegion(projectId, step);
      if (!highlightedCode || highlightedCode.trim().length === 0) {
        return {
          status: "incomplete",
          explanation: "No code has been added yet. Write code to satisfy this step.",
          missingCode: "Add implementation code for this step",
        };
      }

      if (hasOpenTicketForStep(projectId, stepId)) {
        return {
          status: "blocked",
          explanation: "Step has unresolved tickets. Resolve them before completing.",
          codeRefs: step.highlights?.map((h: StepHighlight) => ({
            startLine: h.startLine,
            endLine: h.endLine,
          })),
        };
      }

      // Check for previous steps
      const allSteps = getSteps(projectId);
      const sortedSteps = [...allSteps].sort((a, b) => a.createdAt - b.createdAt);
      const currentStepIndex = sortedSteps.findIndex(s => s.id === stepId);
      
      if (currentStepIndex > 0) {
        const previousSteps = sortedSteps.slice(0, currentStepIndex);
        const incompletePreviousSteps = previousSteps.filter(s => s.status !== "done");
        
        if (incompletePreviousSteps.length > 0) {
          const incompleteTitles = incompletePreviousSteps.map(s => s.title).join(", ");
          return {
            status: "incomplete",
            explanation: `Complete previous steps first: ${incompleteTitles}`,
            missingCode: "Complete dependencies first",
          };
        }
      }

      // Generic incomplete state
      return {
        status: "incomplete",
        explanation: validation.reason || "Step requirements not met. Check highlighted code region.",
        codeRefs: step.highlights?.map((h: StepHighlight) => ({
          startLine: h.startLine,
          endLine: h.endLine,
        })),
      };
    } catch (error) {
      console.error("Error in explainStepCompletion:", error);
      return {
        status: "incomplete",
        explanation: "Unable to validate step completion. Please try again.",
        missingCode: "Validation error",
      };
    }
  }
  
  
// 🔍 DEBUG EXPORT CHECK
export const __steps_debug = true;
