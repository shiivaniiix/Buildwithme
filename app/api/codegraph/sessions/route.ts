import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/codegraph/sessions?analysisId=xxx
 * 
 * Returns chat sessions for a project analysis.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get("analysisId");

    if (!analysisId) {
      return NextResponse.json(
        { error: "analysisId is required" },
        { status: 400 }
      );
    }

    // For now, return empty (client-side will check localStorage)
    // In a real DB implementation, this would query the database
    return NextResponse.json({
      sessions: [],
    });
  } catch (error) {
    console.error("Error in /api/codegraph/sessions GET:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

