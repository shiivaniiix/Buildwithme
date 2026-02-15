import type { Step, StepHighlight } from "./steps";
import type { CodeFile } from "./projectFiles";

/**
 * AI validation request payload
 */
export type AIValidationRequest = {
  step: {
    title: string;
    description?: string;
    requirements?: string[];
  };
  files: Array<{
    name: string;
    content: string;
  }>;
  highlights?: StepHighlight[];
};

/**
 * AI validation response
 */
export type AIValidationResponse = {
  status: "completed" | "incomplete" | "blocked";
  reason: string;
  suggestions: string[];
  missingRequirements?: string[];
  confidence?: number;
};

/**
 * Validates step completion using AI analysis.
 * 
 * This function sends step information and relevant code to an AI model
 * and returns structured validation results.
 * 
 * @param request - Step and file information for validation
 * @returns AI validation response with status, reason, and suggestions
 */
export async function validateStepWithAI(
  request: AIValidationRequest
): Promise<AIValidationResponse> {
  // TODO: Replace with actual AI API call
  // Example structure for OpenAI:
  // const apiKey = process.env.OPENAI_API_KEY;
  // const response = await fetch('https://api.openai.com/v1/chat/completions', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`
  //   },
  //   body: JSON.stringify({
  //     model: 'gpt-4',
  //     messages: [
  //       {
  //         role: 'system',
  //         content: 'You are a code validation assistant. Analyze if the code satisfies the step requirements.'
  //       },
  //       {
  //         role: 'user',
  //         content: `Step: ${request.step.title}\nDescription: ${request.step.description || ''}\nCode:\n${request.files.map(f => `${f.name}:\n${f.content}`).join('\n\n')}`
  //       }
  //     ],
  //     response_format: { type: 'json_object' }
  //   })
  // });
  // const data = await response.json();
  // return parseAIValidationResponse(data);
  
  // For client-side, use API route:
  // const response = await fetch('/api/ai/validate-step', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // });
  // if (!response.ok) throw new Error('AI validation failed');
  // return await response.json();
  
  // Simulated AI validation for development
  return simulateAIValidation(request);
}

/**
 * Parses AI API response into structured validation result.
 * Use this when integrating with real AI API.
 */
export function parseAIValidationResponse(
  apiResponse: unknown
): AIValidationResponse {
  // TODO: Implement parsing logic based on your AI API response format
  // Example for OpenAI:
  // if (apiResponse && typeof apiResponse === 'object' && 'choices' in apiResponse) {
  //   const content = apiResponse.choices[0].message.content;
  //   const parsed = JSON.parse(content);
  //   return {
  //     status: parsed.status || 'incomplete',
  //     reason: parsed.reason || 'Validation completed',
  //     suggestions: parsed.suggestions || [],
  //     missingRequirements: parsed.missingRequirements,
  //     confidence: parsed.confidence || 0.8,
  //   };
  // }
  
  // Fallback
  return {
    status: "incomplete",
    reason: "Unable to parse AI response",
    suggestions: [],
    confidence: 0.5,
  };
}

/**
 * Simulates AI validation for development/testing.
 * In production, replace with actual AI API call.
 */
function simulateAIValidation(
  request: AIValidationRequest
): AIValidationResponse {
  const { step, files, highlights } = request;
  
  // Get relevant code from highlighted regions or first file
  let relevantCode = "";
  if (highlights && highlights.length > 0) {
    highlights.forEach(highlight => {
      const file = files.find(f => f.name === highlight.file);
      if (file) {
        const lines = file.content.split("\n");
        const relevantLines = lines.slice(
          Math.max(0, highlight.startLine - 1),
          Math.min(lines.length, highlight.endLine)
        );
        relevantCode += relevantLines.join("\n") + "\n\n";
      }
    });
  } else if (files.length > 0) {
    relevantCode = files[0].content;
  }
  
  // Basic heuristic checks (will be replaced by AI)
  const codeLower = relevantCode.toLowerCase();
  const stepTitleLower = step.title.toLowerCase();
  const stepDescLower = (step.description || "").toLowerCase();
  
  // Check if code is empty
  if (!relevantCode || relevantCode.trim().length === 0) {
    return {
      status: "incomplete",
      reason: "No code found in the highlighted regions or referenced files.",
      suggestions: [
        "Add implementation code for this step",
        "Ensure the code is in the correct file",
        "Check that the file is properly referenced by the step"
      ],
      missingRequirements: ["Code implementation"],
      confidence: 1.0,
    };
  }
  
  // Check step requirements if specified
  if (step.requirements && step.requirements.length > 0) {
    const missing: string[] = [];
    const suggestions: string[] = [];
    
    step.requirements.forEach(req => {
      const reqLower = req.toLowerCase();
      let found = false;
      
      // Simple pattern matching (AI would do semantic analysis)
      if (reqLower.includes("variable") && reqLower.includes("exists")) {
        found = /\b\w+\s*=/.test(relevantCode);
        if (!found) {
          missing.push(req);
          suggestions.push("Define a variable in the highlighted code region");
        }
      } else if (reqLower.includes("function") && reqLower.includes("call")) {
        found = /\w+\s*\(/.test(relevantCode);
        if (!found) {
          missing.push(req);
          suggestions.push("Add a function call in the highlighted code");
        }
      } else if (reqLower.includes("print")) {
        found = /\bprint\s*\(/.test(relevantCode) || /\bconsole\.log\s*\(/.test(relevantCode);
        if (!found) {
          missing.push(req);
          suggestions.push("Add a print or console.log statement");
        }
      } else {
        // Generic keyword check
        const keyword = req.split(" ")[0].toLowerCase();
        found = new RegExp(`\\b${keyword}\\b`, "i").test(relevantCode);
        if (!found) {
          missing.push(req);
          suggestions.push(`Ensure '${keyword}' is present in the code`);
        }
      }
    });
    
    if (missing.length > 0) {
      return {
        status: "incomplete",
        reason: `Missing required elements: ${missing.join(", ")}`,
        suggestions,
        missingRequirements: missing,
        confidence: 0.8,
      };
    }
  }
  
  // Semantic analysis based on step title/description
  // (AI would do much better semantic understanding)
  const hasImplementation = relevantCode.trim().length > 10;
  const hasStructure = /(function|def|class|const|let|var|if|for|while)/.test(relevantCode);
  
  if (!hasImplementation) {
    return {
      status: "incomplete",
      reason: "Code appears to be too minimal or incomplete.",
      suggestions: [
        "Add more implementation details",
        "Ensure the code logic is complete",
        "Check that all necessary components are present"
      ],
      missingRequirements: ["Complete implementation"],
      confidence: 0.7,
    };
  }
  
  if (!hasStructure && stepTitleLower.includes("function")) {
    return {
      status: "incomplete",
      reason: "Expected function definition but none found.",
      suggestions: [
        "Define a function for this step",
        "Ensure the function has proper parameters and return value"
      ],
      missingRequirements: ["Function definition"],
      confidence: 0.9,
    };
  }
  
  // If all checks pass, step is complete
  return {
    status: "completed",
    reason: "Code appears to satisfy the step requirements.",
    suggestions: [],
    confidence: 0.85,
  };
}

/**
 * Prepares validation request from step and project files
 */
export function prepareAIValidationRequest(
  step: Step,
  projectFiles: CodeFile[],
  getFileContent: (fileName: string) => string
): AIValidationRequest {
  // Get files referenced by step
  const relevantFiles: Array<{ name: string; content: string }> = [];
  
  if (step.files && step.files.length > 0) {
    step.files.forEach(fileName => {
      const content = getFileContent(fileName);
      relevantFiles.push({ name: fileName, content });
    });
  } else if (projectFiles.length > 0) {
    // Fallback to first file if step doesn't reference files
    const firstFile = projectFiles[0];
    relevantFiles.push({ name: firstFile.name, content: firstFile.content });
  }
  
  return {
    step: {
      title: step.title,
      description: step.description,
      requirements: step.requirements,
    },
    files: relevantFiles,
    highlights: step.highlights,
  };
}

