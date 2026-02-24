export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

interface AskAIRequest {
  question: string;
  language: string;
  activeFile: string;
  files: Record<string, string>;
  runtimeError?: string;
  executionOutput?: string;
  executionMode?: "browser" | "node"; // Execution mode for context-aware explanations
}

interface AskAIResponse {
  answer: string;
  fix?: {
    summary: string;
    filesToChange: Array<{
      filename: string;
      originalCode: string;
      fixedCode: string;
    }>;
    notes: string | null;
  };
}

/**
 * POST /api/ai/ask
 * 
 * AI coding assistant endpoint using OpenAI.
 * Provides explanations, error analysis, and code suggestions.
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body: AskAIRequest = await request.json();
    const { question, language, activeFile, files, runtimeError, executionOutput, executionMode } = body;

    // Validate required fields
    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "AI service is not configured. Please set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    // Determine if this is a fix request (has runtime error and question asks for fix)
    const isFixRequest = runtimeError && (
      question.toLowerCase().includes("fix") || 
      question.toLowerCase().includes("error") ||
      question.toLowerCase().includes("explain this runtime error")
    );

    // Build system prompt - different for fix requests vs explanations
    const systemPrompt = isFixRequest
      ? `You are an AI coding assistant inside a platform called Buildwithme.

Context you will receive:
- Programming language
- Active file name
- All project files with their content
- Runtime error (stderr), if any
- Execution output (stdout), if any

Rules (VERY IMPORTANT):
- Never invent files, variables, or project structure.
- Never assume missing code.
- Only modify files that are explicitly provided.
- If multiple fixes are possible, choose the simplest and safest one.
- Do NOT refactor unrelated code.
- Do NOT add new features.
- Do NOT change formatting unless required.
- If the error cannot be fixed safely, explain why instead of guessing.

Your task:
- Analyze the runtime error.
- Determine the exact cause in the code.
- Propose a FIX.

Output format (STRICT):
Return a JSON object with the following structure ONLY:

{
  "summary": "Short explanation of what was wrong",
  "filesToChange": [
    {
      "filename": "<file name>",
      "originalCode": "<exact original content>",
      "fixedCode": "<corrected content>"
    }
  ],
  "notes": "Optional extra explanation for the user (can be null)"
}

Additional rules:
- The \`originalCode\` MUST exactly match the existing code.
- The \`fixedCode\` MUST be runnable.
- If no safe automatic fix exists, return:
{
  "summary": "Cannot safely auto-fix this error",
  "filesToChange": [],
  "notes": "Explain what the user should do manually"
}

IMPORTANT: Return ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text outside the JSON.`
      : `You are an AI coding assistant inside a platform called Buildwithme.
Rules:
- Never invent files or code not provided.
- Never assume project structure.
- Only analyze provided code, errors, or output.
- If information is missing, say what is missing.
- Do not modify code unless explicitly asked.
Your job is to explain code, explain errors, and suggest fixes when asked.`;

    // Build user prompt with context
    let userPrompt = `Question: ${question}\n\n`;
    userPrompt += `Language: ${language || "unknown"}\n`;
    userPrompt += `Active file: ${activeFile || "none"}\n`;
    if (executionMode) {
      userPrompt += `Execution Mode: ${executionMode === "browser" ? "Browser (Client-side)" : "Node.js (Server-side)"}\n`;
      if (executionMode === "browser") {
        userPrompt += `\nIMPORTANT: This code is executing in a browser environment. Browser APIs like localStorage, window, document, and alert are AVAILABLE and working. Do NOT suggest that these APIs are unavailable or need to be replaced with Node.js equivalents.\n`;
      }
    }
    
    // C Phase 1/2 context
    if (language === "c") {
      // Detect if this is Phase 2 (multi-file) based on files array or error context
      const hasMultipleFiles = files && Array.isArray(files) && files.length > 1;
      type FileItem = { name: string; [key: string]: unknown };
      const hasHeaders = files && Array.isArray(files) && (files as FileItem[]).some((f: FileItem) => f.name && f.name.endsWith(".h"));
      type ExecutionOutput = { stderr?: string; [key: string]: unknown };
      const errorText = (runtimeError || (executionOutput && typeof executionOutput === "object" && "stderr" in executionOutput ? (executionOutput as ExecutionOutput).stderr : "") || question || "").toLowerCase();
      const isPhase2 = hasMultipleFiles || hasHeaders || 
                       errorText.includes("multiple") || errorText.includes("header") || 
                       errorText.includes(".h") || errorText.includes("include");
      
      if (isPhase2) {
        userPrompt += `\nIMPORTANT: This is C Phase 2 - Multi-file and header support.\n`;
        userPrompt += `- Multiple .c files are supported\n`;
        userPrompt += `- Header files (.h) are supported\n`;
        userPrompt += `- Local includes: #include "file.h" and #include "folder/file.h" are supported\n`;
        userPrompt += `- Entry file must be main.c with main() function\n`;
        userPrompt += `- All .c files are compiled together: gcc file1.c file2.c ... -o main\n`;
        userPrompt += `- Include paths are automatically added based on folder structure\n`;
        userPrompt += `- Execution uses Docker container (gcc:latest image)\n`;
        userPrompt += `- Execution timeout: 2 seconds\n`;
        userPrompt += `- Output limit: 100KB\n\n`;
        userPrompt += `DO NOT suggest:\n`;
        userPrompt += `- External libraries (beyond standard C library)\n`;
        userPrompt += `- Build systems (Make, CMake, etc.)\n`;
        userPrompt += `- C++ features\n`;
        userPrompt += `- Package managers\n\n`;
      } else {
        userPrompt += `\nIMPORTANT: This is C Phase 1 - Single-file execution.\n`;
        userPrompt += `- Only main.c is supported\n`;
        userPrompt += `- Multiple files are NOT supported\n`;
        userPrompt += `- Header files (.h) are NOT supported\n`;
        userPrompt += `- External libraries are NOT supported\n`;
        userPrompt += `- Folders are NOT supported\n`;
        userPrompt += `- Makefiles are NOT supported\n`;
        userPrompt += `- Custom entry points are NOT supported\n`;
        userPrompt += `- Execution uses: gcc main.c -o main && ./main\n`;
        userPrompt += `- Execution timeout: 2 seconds\n`;
        userPrompt += `- Output limit: 100KB\n\n`;
        userPrompt += `DO NOT suggest:\n`;
        userPrompt += `- Multiple .c files\n`;
        userPrompt += `- Header files (#include "file.h")\n`;
        userPrompt += `- External libraries\n`;
        userPrompt += `- Build systems (Make, CMake, etc.)\n`;
        userPrompt += `- Folder structures\n`;
        userPrompt += `- Package imports\n\n`;
        userPrompt += `Keep all guidance strictly Phase 1 compliant.\n\n`;
      }
      
      userPrompt += `EXECUTION ENVIRONMENT:\n`;
      userPrompt += `- C programs execute inside a Docker container (gcc:latest image)\n`;
      userPrompt += `- Container has resource limits: 128MB memory, 1 CPU core, 2s timeout\n`;
      userPrompt += `- No network access, read-only filesystem (except /tmp)\n`;
      userPrompt += `- If Docker is not available, execution will fail with a clear platform error\n`;
      userPrompt += `- This is a platform limitation, not a code error\n`;
    }

    // Java Phase 1 context
    if (language === "java") {
      userPrompt += `\nIMPORTANT: This is Java Phase 1 execution. Constraints:\n`;
      userPrompt += `- Single-file execution only (Main.java)\n`;
      userPrompt += `- No packages, no external libraries, no Maven/Gradle\n`;
      userPrompt += `- Do NOT suggest installing dependencies or using build tools\n`;
      userPrompt += `- Focus on fixing the code within these constraints\n`;
    }
    
    userPrompt += `\n`;

    // Add file contents
    if (Object.keys(files).length > 0) {
      userPrompt += `Project files:\n`;
      for (const [fileName, fileContent] of Object.entries(files)) {
        userPrompt += `\n--- ${fileName} ---\n${fileContent}\n`;
      }
    } else {
      userPrompt += `No files provided.\n`;
    }

    // Add runtime error if present
    if (runtimeError) {
      userPrompt += `\n--- Runtime Error ---\n${runtimeError}\n`;
    }

    // Add execution output if present
    if (executionOutput) {
      userPrompt += `\n--- Execution Output ---\n${executionOutput}\n`;
    }

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Using GPT-4o (can be changed to gpt-4-turbo or gpt-4)
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.2,
        max_tokens: isFixRequest ? 2000 : 500, // More tokens needed for structured fix responses
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: `AI service error: ${errorData.error?.message || "Unknown error"}` },
        { status: openaiResponse.status }
      );
    }

    const data = await openaiResponse.json();
    const rawContent = data.choices?.[0]?.message?.content || "No response from AI.";

    // If this is a fix request, try to parse JSON response
    if (isFixRequest) {
      try {
        // Try to extract JSON from the response (remove markdown code blocks if present)
        let jsonContent = rawContent.trim();
        
        // Remove markdown code blocks if present
        if (jsonContent.startsWith("```json")) {
          jsonContent = jsonContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        } else if (jsonContent.startsWith("```")) {
          jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
        
        const fixData = JSON.parse(jsonContent);
        
        // Validate structure
        if (
          typeof fixData === "object" &&
          fixData !== null &&
          typeof fixData.summary === "string" &&
          Array.isArray(fixData.filesToChange) &&
          (fixData.notes === null || typeof fixData.notes === "string")
        ) {
          // Validate filesToChange structure
          type FileToChange = {
            filename: string;
            originalCode: string;
            fixedCode: string;
            [key: string]: unknown;
          };
          const validFiles = (fixData.filesToChange as FileToChange[]).every(
            (file: FileToChange) =>
              typeof file === "object" &&
              file !== null &&
              typeof file.filename === "string" &&
              typeof file.originalCode === "string" &&
              typeof file.fixedCode === "string"
          );
          
          if (validFiles) {
            return NextResponse.json({
              answer: fixData.summary + (fixData.notes ? `\n\n${fixData.notes}` : ""),
              fix: {
                summary: fixData.summary,
                filesToChange: fixData.filesToChange,
                notes: fixData.notes || null,
              },
            } as AskAIResponse);
          }
        }
        
        // If validation fails, fall back to regular answer
        console.warn("AI returned invalid fix structure, falling back to text response");
        return NextResponse.json({
          answer: rawContent,
        } as AskAIResponse);
      } catch (parseError) {
        // If JSON parsing fails, fall back to regular answer
        console.warn("Failed to parse AI fix response as JSON:", parseError);
        return NextResponse.json({
          answer: rawContent,
        } as AskAIResponse);
      }
    }

    // Regular explanation response
    return NextResponse.json({
      answer: rawContent,
    } as AskAIResponse);
  } catch (error) {
    console.error("Error in /api/ai/ask:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

