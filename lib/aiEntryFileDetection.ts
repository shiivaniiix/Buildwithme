import { CodeFile } from "./projectFiles";

/**
 * AI entry file detection request
 */
export type AIEntryFileRequest = {
  files: Array<{
    name: string;
    content: string;
  }>;
  language?: string;
};

/**
 * AI entry file detection response
 */
export type AIEntryFileResponse = {
  entryFile: string;
  confidence: "low" | "medium" | "high";
  reason: string;
};

/**
 * Analyzes project files using AI to suggest the most likely entry file.
 * 
 * This function analyzes:
 * - File names (e.g., main.py, app.py, index.js, server.js)
 * - Import/export relationships between files
 * - Main execution logic indicators:
 *   - Function calls not wrapped in imports
 *   - __main__ guard in Python
 *   - server/app bootstrap code
 *   - event listeners / app.listen / main function calls
 * 
 * @param request - Project files and language context
 * @returns AI suggestion with entry file, confidence, and explanation
 */
export async function detectEntryFileWithAI(
  request: AIEntryFileRequest
): Promise<AIEntryFileResponse> {
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
  //         content: 'You are a code analysis assistant. Analyze the project files and suggest which file is the entry point. Consider file names, import/export relationships, main execution logic, and bootstrap code.'
  //       },
  //       {
  //         role: 'user',
  //         content: `Language: ${request.language || 'unknown'}\n\nFiles:\n${request.files.map(f => `${f.name}:\n${f.content}`).join('\n\n---\n\n')}`
  //       }
  //     ],
  //     response_format: { type: 'json_object' }
  //   })
  // });
  // const data = await response.json();
  // return parseAIEntryFileResponse(data);
  
  // For client-side, use API route:
  // const response = await fetch('/api/ai/detect-entry-file', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(request)
  // });
  // if (!response.ok) throw new Error('AI entry file detection failed');
  // return await response.json();
  
  // Simulated AI detection for development
  return simulateEntryFileDetection(request);
}

/**
 * Parses AI API response into structured entry file suggestion.
 * Use this when integrating with real AI API.
 */
export function parseAIEntryFileResponse(
  apiResponse: unknown
): AIEntryFileResponse {
  // TODO: Implement actual parsing based on your AI provider's response format
  // Example:
  // if (typeof apiResponse === 'object' && apiResponse !== null) {
  //   const data = apiResponse as any;
  //   return {
  //     entryFile: data.entryFile || data.suggested_file || '',
  //     confidence: data.confidence || 'medium',
  //     reason: data.reason || data.explanation || 'AI analysis suggests this file.'
  //   };
  // }
  
  return {
    entryFile: "",
    confidence: "low",
    reason: "Failed to parse AI response",
  };
}

/**
 * Simulates AI entry file detection for development/testing.
 * Uses heuristic analysis to suggest entry file.
 * In production, replace with actual AI API call.
 */
function simulateEntryFileDetection(
  request: AIEntryFileRequest
): AIEntryFileResponse {
  const { files, language } = request;
  
  if (files.length === 0) {
    return {
      entryFile: "",
      confidence: "low",
      reason: "No files found in project.",
    };
  }
  
  if (files.length === 1) {
    return {
      entryFile: files[0].name,
      confidence: "high",
      reason: "Only one file exists in the project.",
    };
  }
  
  // Analyze files for entry point indicators
  const scores: Array<{ name: string; score: number; reasons: string[] }> = [];
  
  for (const file of files) {
    let score = 0;
    const reasons: string[] = [];
    const fileName = file.name.toLowerCase();
    const content = file.content;
    const contentLower = content.toLowerCase();
    
    // Check file name patterns
    const entryNamePatterns = [
      /^main\.(py|js|ts)$/i,
      /^app\.(py|js|ts)$/i,
      /^index\.(js|ts)$/i,
      /^server\.(js|ts)$/i,
      /^run\.(py|js|ts)$/i,
      /^start\.(py|js|ts)$/i,
    ];
    
    for (const pattern of entryNamePatterns) {
      if (pattern.test(fileName)) {
        score += 30;
        reasons.push(`File name matches common entry point pattern (${fileName})`);
        break;
      }
    }
    
    // Python-specific indicators
    if (language === "python" || fileName.endsWith(".py")) {
      // Check for __main__ guard
      if (content.includes("if __name__ == \"__main__\"") || content.includes("if __name__ == '__main__'")) {
        score += 40;
        reasons.push("Contains Python __main__ guard (entry point indicator)");
      }
      
      // Check for direct function calls (not in imports)
      const hasDirectCalls = /^(def |class |import |from |#)/m.test(content) === false && 
                             (content.match(/^[a-zA-Z_][a-zA-Z0-9_]*\(/m) !== null);
      if (hasDirectCalls && !content.includes("if __name__")) {
        score += 20;
        reasons.push("Contains top-level execution code");
      }
    }
    
    // JavaScript/TypeScript-specific indicators
    if (language === "javascript" || language === "typescript" || fileName.endsWith(".js") || fileName.endsWith(".ts")) {
      // Check for server bootstrap code
      if (contentLower.includes("app.listen") || contentLower.includes("server.listen")) {
        score += 40;
        reasons.push("Contains server bootstrap code (app.listen/server.listen)");
      }
      
      if (contentLower.includes("express()") || contentLower.includes("createServer")) {
        score += 30;
        reasons.push("Contains web server initialization");
      }
      
      // Check for event listeners at top level
      if (contentLower.includes("addEventListener") && !contentLower.includes("export")) {
        score += 25;
        reasons.push("Contains top-level event listeners");
      }
      
      // Check for main function calls
      if (contentLower.includes("main()") && !contentLower.includes("function main") && !contentLower.includes("const main")) {
        score += 20;
        reasons.push("Calls main() function (likely entry point)");
      }
    }
    
    // Check import/export relationships
    // Files that are imported by many others are less likely to be entry points
    // Files that import many others but aren't imported are more likely to be entry points
    const importCount = (content.match(/^(import |from |require\(|import\s*\{)/gm) || []).length;
    const exportCount = (content.match(/^(export |module\.exports)/gm) || []).length;
    
    if (importCount > 2 && exportCount === 0) {
      score += 15;
      reasons.push("Imports multiple modules but doesn't export (likely entry point)");
    }
    
    // Check for minimal exports (entry points usually don't export much)
    if (exportCount === 0 && importCount > 0) {
      score += 10;
      reasons.push("No exports, only imports (common entry point pattern)");
    }
    
    // Check for execution code at top level
    const hasTopLevelCode = content.split("\n").slice(0, 20).some(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith("#") && 
             !trimmed.startsWith("//") && 
             !trimmed.startsWith("import") && 
             !trimmed.startsWith("from") && 
             !trimmed.startsWith("require") &&
             !trimmed.startsWith("export") &&
             !trimmed.startsWith("function") &&
             !trimmed.startsWith("const") &&
             !trimmed.startsWith("let") &&
             !trimmed.startsWith("var") &&
             !trimmed.startsWith("class") &&
             !trimmed.startsWith("def");
    });
    
    if (hasTopLevelCode) {
      score += 15;
      reasons.push("Contains top-level execution code");
    }
    
    scores.push({ name: file.name, score, reasons });
  }
  
  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);
  
  const topScore = scores[0];
  
  if (!topScore || topScore.score === 0) {
    // Fallback: use first file or file with entry name pattern
    const firstFile = files[0];
    return {
      entryFile: firstFile.name,
      confidence: "low",
      reason: "Could not determine entry file. Using first file as fallback.",
    };
  }
  
  // Determine confidence based on score and score difference
  let confidence: "low" | "medium" | "high" = "low";
  if (topScore.score >= 50) {
    confidence = "high";
  } else if (topScore.score >= 25) {
    confidence = "medium";
  }
  
  // Increase confidence if score is significantly higher than second place
  if (scores.length > 1 && topScore.score - scores[1].score > 20) {
    if (confidence === "low") confidence = "medium";
    if (confidence === "medium") confidence = "high";
  }
  
  const reason = topScore.reasons.length > 0
    ? topScore.reasons.slice(0, 2).join("; ")
    : `File "${topScore.name}" appears to be the entry point based on code analysis.`;
  
  return {
    entryFile: topScore.name,
    confidence,
    reason,
  };
}





