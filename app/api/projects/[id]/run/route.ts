/**
 * Project Code Execution API
 * 
 * POST /api/projects/[id]/run
 * 
 * Fetches project files from database and executes them via runner service
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

const RUNNER_SERVICE_URL = process.env.RUNNER_SERVICE_URL || "http://localhost:3001";

type ExecutionFile = {
  path: string;
  content: string;
};

type ProjectWithFiles = {
  id: string;
  userId: string;
  name: string;
  sourceType: string;
  githubOwner: string | null;
  githubRepo: string | null;
  createdAt: Date;
  updatedAt: Date;
  files: Array<{
    id: string;
    projectId: string;
    name: string;
    path: string;
    content: string;
    isFolder: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id: projectId } = context.params;

  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        userId: true,
        name: true,
        sourceType: true,
        githubOwner: true,
        githubRepo: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Fetch project files separately
    // @ts-ignore - Prisma client needs regeneration after File model was added
    const projectFiles = await prisma.file.findMany({
      where: {
        projectId: projectId,
        isFolder: false,
      },
      select: {
        id: true,
        name: true,
        path: true,
        content: true,
        isFolder: true,
      },
    });

    // Get language and files from request body
    const body = await request.json().catch(() => ({}));
    const language = body.language || project.sourceType || "python";
    const entryFileName = body.entryFileName;

    // Prepare files for execution
    // If request includes files (for multi-file languages like Java, C), use those
    // Otherwise, use files from database
    let files: ExecutionFile[] = [];

    if (body.files && Array.isArray(body.files) && body.files.length > 0) {
      // Use files from request (for multi-file support)
      files = body.files.map((file: { name: string; content: string }) => ({
        path: file.name,
        content: file.content,
      }));
    } else if (body.code && entryFileName) {
      // Single file execution (legacy format)
      files = [{
        path: entryFileName,
        content: body.code,
      }];
    } else {
      // Use files from database (already filtered to exclude folders)
      files = projectFiles.map((file: { path: string; name: string; content: string }) => ({
        path: file.path || file.name,
        content: file.content,
      }));
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          state: "failed",
          stdout: "",
          stderr: "No files to execute",
          exitCode: 1,
          error: "No files to execute",
          success: false,
        },
        { status: 400 }
      );
    }

    // Send to runner service
    const runnerResponse = await fetch(`${RUNNER_SERVICE_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        files,
      }),
    });

    if (!runnerResponse.ok) {
      const errorData = await runnerResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          state: "failed",
          stdout: "",
          stderr: errorData.error || "Runner service error",
          exitCode: 1,
          error: errorData.error || "Runner service error",
          success: false,
        },
        { status: runnerResponse.status }
      );
    }

    const runnerResult: {
      success?: boolean;
      output?: string;
      error?: string;
      exitCode?: number;
    } = await runnerResponse.json();

    // Map runner service response to ExecutionResult format expected by frontend
    const result = {
      state: runnerResult.success ? "completed" : "failed",
      stdout: runnerResult.output || "",
      stderr: runnerResult.error || "",
      exitCode: runnerResult.exitCode ?? (runnerResult.success ? 0 : 1),
      success: runnerResult.success,
      executedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error executing project code:", error);
    return NextResponse.json(
      {
        state: "failed",
        stdout: "",
        stderr: error instanceof Error ? error.message : "Internal server error",
        exitCode: 1,
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}
