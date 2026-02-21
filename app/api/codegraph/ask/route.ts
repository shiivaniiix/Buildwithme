import { NextRequest, NextResponse } from "next/server";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";

/**
 * POST /api/codegraph/ask
 * 
 * Answers questions about the code graph using AI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, graph, question, fileSummaries } = body;

    // Validate required fields
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!graph || typeof graph !== "object") {
      return NextResponse.json(
        { error: "graph is required and must be an object" },
        { status: 400 }
      );
    }

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "question is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate graph structure
    if (!graph.nodes || !Array.isArray(graph.nodes)) {
      return NextResponse.json(
        { error: "graph.nodes is required and must be an array" },
        { status: 400 }
      );
    }

    if (!graph.edges || !Array.isArray(graph.edges)) {
      return NextResponse.json(
        { error: "graph.edges is required and must be an array" },
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

    // Build system prompt
    const systemPrompt = `You are an architecture analyst. You have access to the project structure and key file content summaries.

CRITICAL RULES:
- Answer questions using the graph data and file content summaries provided
- Do NOT fabricate or assume missing code, files, or structure
- Use file content summaries to understand actual functionality when available
- If information is not in the graph or file summaries, explicitly state that it's not available
- Focus on structure, organization, file paths, technology stack, and actual code functionality
- Be precise and honest about what you can and cannot determine from the available information

When answering:
- Reference specific nodes (files/folders) from the graph
- Mention detected technologies
- Explain relationships visible in the edges
- Use file content summaries to explain actual functionality and code behavior
- Combine structure analysis with code content understanding`;

    // Build user prompt with graph data, file summaries, and question
    let userPrompt = `Question: ${question.trim()}

Project ID: ${projectId}
Generated at: ${new Date(graph.generatedAt).toISOString()}

Code Graph Structure:
${JSON.stringify(graph, null, 2)}`;

    // Add file summaries if available
    if (fileSummaries && typeof fileSummaries === "object" && Object.keys(fileSummaries).length > 0) {
      userPrompt += `\n\nKey File Content Summaries:\n`;
      for (const [filePath, content] of Object.entries(fileSummaries)) {
        // Limit content length to keep token usage reasonable (max 2000 chars per file)
        const limitedContent = typeof content === "string" && content.length > 2000 
          ? content.substring(0, 2000) + "\n... (truncated)"
          : content;
        userPrompt += `\n--- ${filePath} ---\n${limitedContent}\n`;
      }
    }

    userPrompt += `\n\nAnswer the question using the graph structure and file content summaries above. Reference specific files and code when explaining functionality.`;

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
        temperature: 0.2,
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
    const answer = data.choices?.[0]?.message?.content || "No response from AI.";

    return NextResponse.json({
      answer,
    });
  } catch (error) {
    console.error("Error in /api/codegraph/ask:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}


