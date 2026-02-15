import { NextRequest, NextResponse } from "next/server";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";

/**
 * Technology deep link mappings
 */
const TECHNOLOGY_DEEP_LINKS: Record<string, string> = {
  "React": "https://react.dev",
  "Next.js": "https://nextjs.org",
  "Python": "https://python.org",
  "Docker": "https://docker.com",
  "Node.js": "https://nodejs.org",
  "TypeScript": "https://www.typescriptlang.org",
  "JavaScript": "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "Java": "https://www.java.com",
  "Maven": "https://maven.apache.org",
};

/**
 * Get deep link for a technology
 */
function getTechnologyDeepLink(technologyName: string): string {
  const normalized = technologyName.trim();
  if (TECHNOLOGY_DEEP_LINKS[normalized]) {
    return TECHNOLOGY_DEEP_LINKS[normalized];
  }
  // Fallback to Google search
  return `https://www.google.com/search?q=${encodeURIComponent(normalized)}`;
}

/**
 * POST /api/codegraph/explain
 * 
 * Generates AI-powered architecture explanation from code graph.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, graph } = body;

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

    if (!graph.technologies || !Array.isArray(graph.technologies)) {
      return NextResponse.json(
        { error: "graph.technologies is required and must be an array" },
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
    const systemPrompt = `You are an architecture analyst. You must ONLY analyze the provided graph JSON. Do not assume unseen files or structure.

Rules:
- Analyze ONLY the graph structure provided
- Do not invent or assume files that are not in the graph
- Do not reference code content (you don't have access to it)
- Focus on structure, organization, and technology stack
- Provide clear, concise explanations
- Identify architectural patterns from the graph structure

Output format (JSON):
{
  "summary": "Brief overview of the project structure",
  "architectureExplanation": "Detailed explanation of the architecture and organization",
  "technologies": [
    {
      "name": "Technology name",
      "description": "How this technology is used in the project"
    }
  ]
}`;

    // Build user prompt with graph data
    const userPrompt = `Analyze this code graph and provide an architecture explanation.

Project ID: ${projectId}
Generated at: ${new Date(graph.generatedAt).toISOString()}

Graph Structure:
${JSON.stringify(graph, null, 2)}

Provide a comprehensive analysis of:
1. Project structure and organization
2. Technology stack and how technologies are used
3. Architectural patterns visible in the graph
4. File organization and hierarchy`;

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
        max_tokens: 2000,
        response_format: { type: "json_object" },
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
    const rawContent = data.choices?.[0]?.message?.content || "{}";

    // Parse JSON response
    try {
      let jsonContent = rawContent.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith("```json")) {
        jsonContent = jsonContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      const parsed = JSON.parse(jsonContent);
      
      // Validate structure
      if (
        typeof parsed.summary === "string" &&
        typeof parsed.architectureExplanation === "string" &&
        Array.isArray(parsed.technologies)
      ) {
        // Add deep links to technologies
        const technologiesWithLinks = parsed.technologies.map((tech: any) => ({
          name: tech.name || "",
          description: tech.description || "",
          deepLink: getTechnologyDeepLink(tech.name || ""),
        }));

        return NextResponse.json({
          summary: parsed.summary,
          architectureExplanation: parsed.architectureExplanation,
          technologies: technologiesWithLinks,
        });
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in /api/codegraph/explain:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

