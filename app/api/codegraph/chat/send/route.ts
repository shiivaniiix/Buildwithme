export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import type { CodeGraph, DetectedTechnology } from "@/lib/codegraph/graphTypes";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";

/**
 * POST /api/codegraph/chat/send
 * 
 * Sends a message in a chat session and returns AI reply.
 * Body: { sessionId, projectId, graph, fileSummaries, messages, newQuestion }
 * 
 * Protected route: Requires authentication via Clerk
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get current authenticated user
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to continue." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, projectId, graph, fileSummaries, messages, newQuestion } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      );
    }

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

    if (!newQuestion || typeof newQuestion !== "string" || !newQuestion.trim()) {
      return NextResponse.json(
        { error: "newQuestion is required and must be a non-empty string" },
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

    // Build system prompt with project context
    const systemPrompt = `You are an architecture analyst in a conversational chat about a code project. You have access to the project structure and key file content summaries.

CRITICAL RULES:
- Answer questions using the graph data and file content summaries provided
- Do NOT fabricate or assume missing code, files, or structure
- Use file content summaries to understand actual functionality when available
- If information is not in the graph or file summaries, explicitly state that it's not available
- Focus on structure, organization, file paths, technology stack, and actual code functionality
- Be precise and honest about what you can and cannot determine from the available information
- Maintain conversational context from previous messages
- Reference previous conversation when relevant

When answering:
- Reference specific nodes (files/folders) from the graph
- Mention detected technologies
- Explain relationships visible in the edges
- Use file content summaries to explain actual functionality and code behavior
- Combine structure analysis with code content understanding
- Keep responses conversational and natural`;

    // Build project context
    let projectContext = `Project ID: ${projectId}
Generated at: ${new Date(graph.generatedAt).toISOString()}

Technologies Detected: ${graph.technologies?.map((t: DetectedTechnology) => t.name).join(", ") || "None"}

Code Graph Structure:
${JSON.stringify({ nodes: graph.nodes.length, edges: graph.edges.length, technologies: graph.technologies }, null, 2)}`;

    // Add file summaries if available (trimmed for token safety)
    if (fileSummaries && typeof fileSummaries === "object" && Object.keys(fileSummaries).length > 0) {
      projectContext += `\n\nKey File Content Summaries:\n`;
      for (const [filePath, content] of Object.entries(fileSummaries)) {
        const limitedContent = typeof content === "string" && content.length > 1500 
          ? content.substring(0, 1500) + "\n... (truncated)"
          : content;
        projectContext += `\n--- ${filePath} ---\n${limitedContent}\n`;
      }
    }

    // Build conversation history (limit to last 10 messages for token safety)
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (messages && Array.isArray(messages)) {
      const recentMessages = messages.slice(-10);
      for (const msg of recentMessages) {
        if (msg.role === "user" || msg.role === "assistant") {
          conversationHistory.push({
            role: msg.role,
            content: typeof msg.content === "string" ? msg.content : String(msg.content),
          });
        }
      }
    }

    // Build messages array for OpenAI API
    const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemPrompt + "\n\n" + projectContext,
      },
    ];

    // Add conversation history
    for (const msg of conversationHistory) {
      openaiMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // Add new user question
    openaiMessages.push({
      role: "user",
      content: newQuestion.trim(),
    });

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: openaiMessages,
        temperature: 0.2,
        max_tokens: 1500,
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
    const reply = data.choices?.[0]?.message?.content || "No response from AI.";

    return NextResponse.json({
      reply,
    });
  } catch (error) {
    console.error("Error in /api/codegraph/chat/send:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

