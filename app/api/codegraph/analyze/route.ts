import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/codegraph/analyzer";
import { saveSnapshot } from "@/lib/codegraph/snapshotManager";

/**
 * POST /api/codegraph/analyze
 * 
 * Analyzes project structure and generates code graph.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, files } = body;

    // Validate required fields
    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "projectId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: "files is required and must be an array" },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "files array cannot be empty" },
        { status: 400 }
      );
    }

    // Validate file paths are strings
    if (!files.every(f => typeof f === "string")) {
      return NextResponse.json(
        { error: "All file paths must be strings" },
        { status: 400 }
      );
    }

    // Analyze project
    const graph = analyzeProject(projectId, files);

    // Save snapshot
    saveSnapshot(projectId, graph);

    // Return graph
    return NextResponse.json({
      success: true,
      graph,
    });
  } catch (error) {
    console.error("Error analyzing project:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

