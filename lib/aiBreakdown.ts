import type { Project } from "./projects";

/**
 * AI breakdown request payload
 */
export type AIBreakdownRequest = {
  step: {
    title: string;
    description?: string;
  };
  projectContext: {
    language?: Project["language"];
  };
};

/**
 * Substep suggestion from AI
 */
export type Substep = {
  id: string;
  title: string;
  description?: string;
  order: number;
};

/**
 * AI breakdown response
 */
export type AIBreakdownResponse = {
  substeps: Substep[];
  confidence?: number;
};

/**
 * Generates AI-suggested substeps for a step.
 * 
 * This function sends step information and project context to an AI model
 * and returns a list of suggested substeps to guide the user.
 * 
 * @param request - Step and project context for breakdown
 * @returns AI breakdown response with suggested substeps
 */
export async function generateStepBreakdown(
  request: AIBreakdownRequest
): Promise<AIBreakdownResponse> {
  // TODO: Replace with actual AI API call
  // Example structure:
  // const apiKey = process.env.AI_API_KEY;
  // const response = await fetch('https://api.example.com/v1/breakdown', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     'Authorization': `Bearer ${apiKey}`
  //   },
  //   body: JSON.stringify({
  //     step: request.step,
  //     context: request.projectContext,
  //     model: 'gpt-4' // or your preferred model
  //   })
  // });
  // const data = await response.json();
  // return parseAIBreakdownResponse(data);
  
  // Simulated AI breakdown for development
  return simulateAIBreakdown(request);
}

/**
 * Simulates AI breakdown for development/testing.
 * In production, replace with actual AI API call.
 */
function simulateAIBreakdown(
  request: AIBreakdownRequest
): AIBreakdownResponse {
  const { step, projectContext } = request;
  const language = projectContext.language || "python";
  
  // Generate substeps based on step title and description
  const stepTitleLower = step.title.toLowerCase();
  const stepDescLower = (step.description || "").toLowerCase();
  const combined = `${stepTitleLower} ${stepDescLower}`;
  
  const substeps: Substep[] = [];
  
  // Pattern-based substep generation (AI would do semantic analysis)
  if (combined.includes("function") || combined.includes("def")) {
    substeps.push(
      {
        id: `substep-${Date.now()}-1`,
        title: "Define function signature",
        description: "Create the function with proper parameters",
        order: 1,
      },
      {
        id: `substep-${Date.now()}-2`,
        title: "Implement function body",
        description: "Add the logic inside the function",
        order: 2,
      },
      {
        id: `substep-${Date.now()}-3`,
        title: "Add return statement",
        description: "Return the result if needed",
        order: 3,
      }
    );
  } else if (combined.includes("loop") || combined.includes("iterate")) {
    substeps.push(
      {
        id: `substep-${Date.now()}-1`,
        title: "Set up loop structure",
        description: "Create for or while loop",
        order: 1,
      },
      {
        id: `substep-${Date.now()}-2`,
        title: "Define iteration range",
        description: "Specify what to iterate over",
        order: 2,
      },
      {
        id: `substep-${Date.now()}-3`,
        title: "Add loop body logic",
        description: "Implement actions inside the loop",
        order: 3,
      }
    );
  } else if (combined.includes("input") || combined.includes("read")) {
    substeps.push(
      {
        id: `substep-${Date.now()}-1`,
        title: "Get user input",
        description: language === "python" 
          ? "Use input() function" 
          : "Use prompt() or readline",
        order: 1,
      },
      {
        id: `substep-${Date.now()}-2`,
        title: "Validate input",
        description: "Check if input is valid",
        order: 2,
      },
      {
        id: `substep-${Date.now()}-3`,
        title: "Process input",
        description: "Use the input in your code",
        order: 3,
      }
    );
  } else if (combined.includes("error") || combined.includes("exception")) {
    substeps.push(
      {
        id: `substep-${Date.now()}-1`,
        title: "Wrap code in try block",
        description: "Add try/except or try/catch",
        order: 1,
      },
      {
        id: `substep-${Date.now()}-2`,
        title: "Handle specific exceptions",
        description: "Catch and handle error types",
        order: 2,
      },
      {
        id: `substep-${Date.now()}-3`,
        title: "Add error messages",
        description: "Provide clear error feedback",
        order: 3,
      }
    );
  } else {
    // Generic breakdown
    substeps.push(
      {
        id: `substep-${Date.now()}-1`,
        title: "Plan the implementation",
        description: "Think about what needs to be done",
        order: 1,
      },
      {
        id: `substep-${Date.now()}-2`,
        title: "Write the code",
        description: "Implement the solution",
        order: 2,
      },
      {
        id: `substep-${Date.now()}-3`,
        title: "Test and verify",
        description: "Check that it works correctly",
        order: 3,
      }
    );
  }
  
  return {
    substeps,
    confidence: 0.8,
  };
}

/**
 * Parses AI API response into structured breakdown.
 * Use this when integrating with real AI API.
 */
export function parseAIBreakdownResponse(
  apiResponse: unknown
): AIBreakdownResponse {
  // TODO: Implement parsing logic based on your AI API response format
  // Example:
  // if (apiResponse && typeof apiResponse === 'object' && 'choices' in apiResponse) {
  //   const content = apiResponse.choices[0].message.content;
  //   // Parse JSON from AI response
  //   const parsed = JSON.parse(content);
  //   return {
  //     substeps: parsed.substeps.map((s: any, idx: number) => ({
  //       id: `substep-${Date.now()}-${idx}`,
  //       title: s.title,
  //       description: s.description,
  //       order: idx + 1,
  //     })),
  //     confidence: parsed.confidence || 0.8,
  //   };
  // }
  
  // Fallback
  return {
    substeps: [],
    confidence: 0.5,
  };
}





