import { NextRequest, NextResponse } from "next/server";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";

/**
 * POST /api/architecture/compare
 * 
 * Compares two architecture graphs and generates AI explanation of changes.
 * Body: { currentGraph, historicalGraph }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentGraph, historicalGraph } = body;

    // Validate required fields
    if (!currentGraph || typeof currentGraph !== "object") {
      return NextResponse.json(
        { error: "currentGraph is required and must be an object" },
        { status: 400 }
      );
    }

    if (!historicalGraph || typeof historicalGraph !== "object") {
      return NextResponse.json(
        { error: "historicalGraph is required and must be an object" },
        { status: 400 }
      );
    }

    // Validate graph structures
    if (!currentGraph.nodes || !Array.isArray(currentGraph.nodes)) {
      return NextResponse.json(
        { error: "currentGraph.nodes is required and must be an array" },
        { status: 400 }
      );
    }

    if (!historicalGraph.nodes || !Array.isArray(historicalGraph.nodes)) {
      return NextResponse.json(
        { error: "historicalGraph.nodes is required and must be an array" },
        { status: 400 }
      );
    }

    // Get OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "AI service is not configured. Please set OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    // Detect changes
    const currentFilePaths = new Set(
      currentGraph.nodes.filter((n: any) => n.type === "file").map((n: any) => n.path)
    );
    const historicalFilePaths = new Set(
      historicalGraph.nodes.filter((n: any) => n.type === "file").map((n: any) => n.path)
    );

    const addedFiles = Array.from(currentFilePaths).filter(path => !historicalFilePaths.has(path));
    const removedFiles = Array.from(historicalFilePaths).filter(path => !currentFilePaths.has(path));

    const currentTechs = new Set(
      (currentGraph.technologies || []).map((t: any) => t.name)
    );
    const historicalTechs = new Set(
      (historicalGraph.technologies || []).map((t: any) => t.name)
    );

    const addedTechs = Array.from(currentTechs).filter(tech => !historicalTechs.has(tech));
    const removedTechs = Array.from(historicalTechs).filter(tech => !currentTechs.has(tech));

    // Build comparison data
    const comparisonData = {
      addedFiles: addedFiles.slice(0, 50), // Limit for token safety
      removedFiles: removedFiles.slice(0, 50),
      addedTechnologies: Array.from(addedTechs),
      removedTechnologies: Array.from(removedTechs),
      currentFileCount: currentFilePaths.size,
      historicalFileCount: historicalFilePaths.size,
      currentTechCount: currentTechs.size,
      historicalTechCount: historicalTechs.size,
    };

    // Build system prompt
    const systemPrompt = `You are an architecture analyst specializing in code evolution. Analyze the differences between two architecture snapshots and explain why the architecture evolved.

CRITICAL RULES:
- Focus on structural changes, file movement, technology shifts, and refactoring intent
- Explain the "why" behind changes, not just "what" changed
- Identify patterns: refactoring, feature additions, dependency changes, architectural improvements
- Be concise but insightful
- Do not fabricate information not present in the comparison data`;

    // Build user prompt
    const userPrompt = `Explain why the architecture evolved between these two snapshots:

SNAPSHOT A (Historical):
- Files: ${comparisonData.historicalFileCount}
- Technologies: ${Array.from(historicalTechs).join(", ") || "None"}
- File paths: ${Array.from(historicalFilePaths).slice(0, 20).join(", ")}${historicalFilePaths.size > 20 ? "..." : ""}

SNAPSHOT B (Current):
- Files: ${comparisonData.currentFileCount}
- Technologies: ${Array.from(currentTechs).join(", ") || "None"}
- File paths: ${Array.from(currentFilePaths).slice(0, 20).join(", ")}${currentFilePaths.size > 20 ? "..." : ""}

CHANGES DETECTED:
${addedFiles.length > 0 ? `Added Files (${addedFiles.length}): ${addedFiles.slice(0, 10).join(", ")}${addedFiles.length > 10 ? "..." : ""}` : "No files added"}
${removedFiles.length > 0 ? `Removed Files (${removedFiles.length}): ${removedFiles.slice(0, 10).join(", ")}${removedFiles.length > 10 ? "..." : ""}` : "No files removed"}
${addedTechs.size > 0 ? `Added Technologies: ${Array.from(addedTechs).join(", ")}` : "No technologies added"}
${removedTechs.size > 0 ? `Removed Technologies: ${Array.from(removedTechs).join(", ")}` : "No technologies removed"}

Provide a clear explanation of why these architectural changes occurred.`;

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
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
        temperature: 0.3,
        max_tokens: 1000,
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
    const explanation = data.choices?.[0]?.message?.content || "No explanation generated.";

    return NextResponse.json({
      explanation,
      comparison: comparisonData,
    });
  } catch (error) {
    console.error("Error in /api/architecture/compare:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

