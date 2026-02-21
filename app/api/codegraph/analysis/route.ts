import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/codegraph/analyzer";
import { saveSnapshot } from "@/lib/codegraph/snapshotManager";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";

/**
 * GET /api/codegraph/analysis?projectId=xxx
 * 
 * Returns saved analysis for a project.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // For now, return empty (client-side will check localStorage)
    // In a real DB implementation, this would query the database
    return NextResponse.json({
      exists: false,
      analysis: null,
    });
  } catch (error) {
    console.error("Error in /api/codegraph/analysis GET:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/codegraph/analysis
 * 
 * Triggers new analysis and saves it.
 * Body: { projectId, files, fileSummaries?, forceReanalyze? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, files, fileSummaries, forceReanalyze } = body;

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

    // Analyze project
    const graph = analyzeProject(projectId, files);

    // Save snapshot
    saveSnapshot(projectId, graph);

    // Return graph with optional file summaries
    return NextResponse.json({
      success: true,
      graph,
      fileSummaries: fileSummaries || {},
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

