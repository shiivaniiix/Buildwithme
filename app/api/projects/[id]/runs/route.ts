import { NextRequest, NextResponse } from "next/server";
import { getRunHistory, saveRunHistory, type RunHistory } from "@/lib/runHistory";

/**
 * GET /api/projects/[id]/runs
 * Returns run history for a project (latest first)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const history = getRunHistory(params.id);
    
    return NextResponse.json({
      runs: history,
    });
  } catch (error) {
    return NextResponse.json(
      {
        runs: [],
        error: error instanceof Error ? error.message : "Failed to fetch run history",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/runs
 * Saves a new run history entry (for browser/client-side execution)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { language, entryFile, status, executionTimeMs, stdout, stderr } = body;

    // Validate required fields
    if (!language || !entryFile || !status || executionTimeMs === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: language, entryFile, status, executionTimeMs" },
        { status: 400 }
      );
    }

    // Validate status
    if (status !== "success" && status !== "failed") {
      return NextResponse.json(
        { error: "Invalid status. Must be 'success' or 'failed'" },
        { status: 400 }
      );
    }

    // Save run history
    const newRun = saveRunHistory({
      projectId: params.id,
      language,
      entryFile,
      status: status as "success" | "failed",
      executionTimeMs: Number(executionTimeMs),
      stdout: stdout || "",
      stderr: stderr || null,
      executedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      run: newRun,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save run history",
      },
      { status: 500 }
    );
  }
}


