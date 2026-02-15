import type { Step } from "./steps";

/**
 * Semantic validation result for step completion.
 */
export type SemanticValidationResult = {
  valid: boolean;
  reason?: string;
  missingRequirements?: string[];
};

/**
 * Validation rule definition.
 */
type ValidationRule = {
  keywords: string[];
  checks: (code: string, stepTitle: string) => {
    passed: boolean;
    requirement: string;
  }[];
};

/**
 * Semantic validation rules based on step title keywords.
 * Easily extendable - add new rules here.
 */
const VALIDATION_RULES: ValidationRule[] = [
  // Addition/Sum operations
  {
    keywords: ["addition", "sum", "add", "plus", "calculate sum"],
    checks: (code, stepTitle) => [
      {
        passed: code.includes("+") || /\badd\b/i.test(code) || /\bsum\b/i.test(code),
        requirement: "Code should contain addition operation (+) or sum function",
      },
      {
        passed: (code.match(/\binput\s*\(/gi) || []).length >= 2 || 
                (code.match(/\bint\s*\(/gi) || []).length >= 1 ||
                /\b\d+\s*\+\s*\d+/.test(code) ||
                /\b\w+\s*\+\s*\w+/.test(code),
        requirement: "Code should have at least two numeric inputs or variables for addition",
      },
      {
        passed: code.includes("print") || code.includes("return") || code.includes("console.log"),
        requirement: "Code should print or return the result",
      },
    ],
  },
  
  // Error handling
  {
    keywords: ["error", "exception", "invalid input", "error handling", "try", "catch"],
    checks: (code, stepTitle) => [
      {
        passed: /\btry\s*:/.test(code) || /\btry\s*{/.test(code),
        requirement: "Code should contain a try block",
      },
      {
        passed: /\bexcept\s+/.test(code) || /\bcatch\s*\(/.test(code),
        requirement: "Code should contain exception handling (except/catch)",
      },
      {
        passed: /\bValueError\b/i.test(code) || 
                /\bException\b/i.test(code) || 
                /\bError\b/i.test(code) ||
                /\bthrow\b/i.test(code),
        requirement: "Code should handle specific error types (ValueError, Exception, etc.)",
      },
    ],
  },
  
  // Function definition
  {
    keywords: ["function", "define", "create function", "def"],
    checks: (code, stepTitle) => [
      {
        passed: /\bfunction\s+\w+\s*\(/.test(code) || 
                /\bdef\s+\w+\s*\(/.test(code) ||
                /\bconst\s+\w+\s*=\s*(async\s+)?\(/.test(code) ||
                /\bfunction\s*\(/.test(code),
        requirement: "Code should define a function",
      },
      {
        passed: code.includes("return") || code.includes("print"),
        requirement: "Function should return or print a result",
      },
    ],
  },
  
  // Loop operations
  {
    keywords: ["loop", "iterate", "for", "while", "repeat"],
    checks: (code, stepTitle) => [
      {
        passed: /\bfor\s+/.test(code) || /\bwhile\s+/.test(code),
        requirement: "Code should contain a loop (for/while)",
      },
      {
        passed: code.includes("range") || code.includes("in ") || code.includes("length") || code.includes(".length"),
        requirement: "Loop should iterate over a range or collection",
      },
    ],
  },
  
  // Conditional logic
  {
    keywords: ["if", "condition", "conditional", "check", "validate"],
    checks: (code, stepTitle) => [
      {
        passed: /\bif\s*\(/.test(code) || /\bif\s+/.test(code),
        requirement: "Code should contain conditional logic (if statement)",
      },
      {
        passed: code.includes("else") || code.includes("elif") || code.includes("else if"),
        requirement: "Code should handle alternative cases (else/elif)",
      },
    ],
  },
  
  // List/Array operations
  {
    keywords: ["list", "array", "collection", "items"],
    checks: (code, stepTitle) => [
      {
        passed: /\[.*\]/.test(code) || /\barray\s*\(/.test(code) || /\bList\s*</.test(code),
        requirement: "Code should create or use a list/array",
      },
      {
        passed: code.includes("append") || code.includes("push") || code.includes("add") || code.includes("[]"),
        requirement: "Code should manipulate the list (append, push, etc.)",
      },
    ],
  },
  
  // String operations
  {
    keywords: ["string", "text", "concatenate", "format"],
    checks: (code, stepTitle) => [
      {
        passed: /["']/.test(code) || /\bString\b/.test(code),
        requirement: "Code should work with strings",
      },
      {
        passed: code.includes("+") || code.includes("concat") || code.includes("join") || code.includes("format"),
        requirement: "Code should perform string operations (concatenation, formatting, etc.)",
      },
    ],
  },
  
  // Input/Output
  {
    keywords: ["input", "read", "user input", "get input"],
    checks: (code, stepTitle) => [
      {
        passed: /\binput\s*\(/.test(code) || /\breadline\s*\(/.test(code) || /\bprompt\s*\(/.test(code),
        requirement: "Code should read user input",
      },
      {
        passed: code.includes("print") || code.includes("console.log") || code.includes("output"),
        requirement: "Code should output or display results",
      },
    ],
  },
];

/**
 * Validates if code semantically satisfies a step's intent.
 * Uses heuristic-based checks on code content.
 */
export function validateStepSemantics(
  step: Step,
  code: string
): SemanticValidationResult {
  if (!code || code.trim().length === 0) {
    return {
      valid: false,
      reason: "Code is empty",
      missingRequirements: ["Code workspace is empty"],
    };
  }

  const stepTitle = (step.title || "").toLowerCase();
  const stepDescription = (step.description || "").toLowerCase();
  const combinedText = `${stepTitle} ${stepDescription}`.toLowerCase();

  // Find matching validation rules
  const matchingRules = VALIDATION_RULES.filter(rule =>
    rule.keywords.some(keyword => combinedText.includes(keyword.toLowerCase()))
  );

  // If no rules match, allow completion (no semantic requirements detected)
  if (matchingRules.length === 0) {
    return { valid: true };
  }

  // Run all checks from matching rules
  const allChecks: { passed: boolean; requirement: string }[] = [];
  matchingRules.forEach(rule => {
    rule.checks(code, stepTitle).forEach(check => {
      allChecks.push(check);
    });
  });

  // Check if all requirements are met
  const failedChecks = allChecks.filter(check => !check.passed);
  
  if (failedChecks.length === 0) {
    return { valid: true };
  }

  // Return validation failure with specific missing requirements
  const missingRequirements = failedChecks.map(check => check.requirement);
  const reason = `Step incomplete: ${missingRequirements[0]}`;

  return {
    valid: false,
    reason,
    missingRequirements,
  };
}

