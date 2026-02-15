import { getTickets, addTicket } from "./tickets";
import { getStepById } from "./steps";

export type CodeIssue = {
  type: "empty" | "imports_only" | "todo_comment" | "incomplete_function";
  message: string;
};

/**
 * Analyzes code for simple issues that might indicate problems.
 * This is a lightweight client-side analysis (no compiler).
 */
export function analyzeCode(code: string): CodeIssue | null {
  if (!code || code.trim().length === 0) {
    return {
      type: "empty",
      message: "Code workspace is empty. Consider adding implementation code.",
    };
  }

  const trimmed = code.trim();
  const lines = trimmed.split("\n").filter(line => line.trim().length > 0);

  // Check for near-empty code (less than 3 lines of actual content)
  if (lines.length < 3) {
    return {
      type: "empty",
      message: "Code appears to be minimal. Consider adding more implementation.",
    };
  }

  // Check for import-only files
  const hasImports = /^(import|from|require|#include)/m.test(trimmed);
  const hasImplementation = /(function|const|let|var|class|def|return|=>|{|})/m.test(trimmed);
  
  if (hasImports && !hasImplementation) {
    return {
      type: "imports_only",
      message: "Code contains only imports. Consider adding implementation logic.",
    };
  }

  // Check for TODO comments
  const todoPattern = /TODO|FIXME|XXX|HACK|NOTE:/i;
  if (todoPattern.test(trimmed)) {
    return {
      type: "todo_comment",
      message: "Code contains TODO/FIXME comments. These may indicate incomplete work.",
    };
  }

  // Check for incomplete functions (function declaration without body or return)
  const functionPattern = /(function|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+\s*\(|public\s+(static\s+)?\w+\s*\(|private\s+\w+\s*\()/;
  const hasFunctionDeclarations = functionPattern.test(trimmed);
  
  if (hasFunctionDeclarations) {
    // Check if functions have bodies (look for opening braces or colons)
    const functionWithBodyPattern = /(function|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+\s*\(|public\s+(static\s+)?\w+\s*\(|private\s+\w+\s*\()[^)]*\)\s*[{:]/;
    const hasFunctionBodies = functionWithBodyPattern.test(trimmed);
    
    if (!hasFunctionBodies) {
      return {
        type: "incomplete_function",
        message: "Code contains function declarations without implementation bodies.",
      };
    }

    // Check for functions without return statements (basic heuristic)
    const hasReturn = /\breturn\b/.test(trimmed);
    const hasMultipleFunctions = (trimmed.match(functionPattern) || []).length > 1;
    
    if (hasMultipleFunctions && !hasReturn) {
      return {
        type: "incomplete_function",
        message: "Functions may be missing return statements or implementation logic.",
      };
    }
  }

  return null;
}

/**
 * Infers code range for highlighting based on code content and issue type.
 * Intelligence: Estimates where the issue likely occurs in the code.
 */
function inferCodeRange(code: string, issue: CodeIssue): { startLine: number; endLine: number } {
  const lines = code.split("\n");
  const totalLines = lines.length;

  // If code is very short, highlight the entire block
  if (totalLines < 10) {
    return { startLine: 1, endLine: totalLines || 1 };
  }

  // For TODO comments, find the line with TODO
  if (issue.type === "todo_comment") {
    const todoPattern = /TODO|FIXME|XXX|HACK|NOTE:/i;
    for (let i = 0; i < lines.length; i++) {
      if (todoPattern.test(lines[i])) {
        const start = Math.max(1, i + 1);
        const end = Math.min(totalLines, i + 3);
        return { startLine: start, endLine: end };
      }
    }
  }

  // For incomplete functions, find function declarations
  if (issue.type === "incomplete_function") {
    const functionPattern = /(function|const\s+\w+\s*=\s*(async\s+)?\(|def\s+\w+\s*\(|public\s+(static\s+)?\w+\s*\(|private\s+\w+\s*\()/;
    for (let i = 0; i < lines.length; i++) {
      if (functionPattern.test(lines[i])) {
        const start = Math.max(1, i + 1);
        const end = Math.min(totalLines, i + 5);
        return { startLine: start, endLine: end };
      }
    }
  }

  // For imports-only, highlight import section (usually at top)
  if (issue.type === "imports_only") {
    let lastImportLine = 1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (/^(import|from|require|#include)/.test(lines[i])) {
        lastImportLine = i + 1;
      }
    }
    return { startLine: 1, endLine: Math.min(totalLines, lastImportLine + 2) };
  }

  // Default: highlight last 5-10 lines (where recent edits likely occurred)
  const start = Math.max(1, totalLines - 7);
  return { startLine: start, endLine: totalLines };
}

/**
 * Creates a ticket for a code issue if one doesn't already exist.
 */
export function createTicketForCodeIssue(
  projectId: string,
  stepId: string,
  issue: CodeIssue,
  code: string
): void {
  if (typeof window === "undefined") return;

  // Check if ticket already exists for this step
  const tickets = getTickets(projectId);
  const existingTicket = tickets.find(
    t => t.stepId === stepId && t.status === "open"
  );

  if (existingTicket) {
    return; // Don't create duplicate tickets
  }

  // Get step to use its title
  const step = getStepById(projectId, stepId);
  if (!step) return;

  // Infer code range for highlighting
  const codeRange = inferCodeRange(code, issue);

  // Create ticket with explanatory message and code context
  const ticketTitle = `${step.title}: ${issue.message}`;
  
  addTicket(projectId, {
    id: Date.now().toString(),
    title: ticketTitle,
    projectId,
    stepId,
    status: "open",
    codeContext: {
      startLine: codeRange.startLine,
      endLine: codeRange.endLine,
      reason: issue.message,
    },
  });
}

/**
 * Analyzes step code and creates tickets for detected issues.
 */
export function analyzeStepCode(
  projectId: string,
  stepId: string,
  code: string
): void {
  const issue = analyzeCode(code);
  
  if (issue) {
    createTicketForCodeIssue(projectId, stepId, issue, code);
  }
}

