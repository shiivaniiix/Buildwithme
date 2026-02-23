/**
 * Project Files API
 * 
 * POST /api/projects/[id]/files - Create a new file
 * GET /api/projects/[id]/files - List all files in a project
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/projects/[id]/files
 * Create a new file in a project
 * Body: { name, path, content, isFolder? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
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

    const body = await request.json();
    const { name, path, content, isFolder } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 }
      );
    }

    // Use name as path if path not provided
    const filePath = path && typeof path === "string" && path.trim().length > 0 
      ? path.trim() 
      : name.trim();

    // Create file - let Prisma auto-generate UUID
    const file = await prisma.file.create({
      data: {
        projectId: projectId,
        name: name.trim(),
        path: filePath,
        content: content || "",
        isFolder: isFolder || false,
      },
    });

    // Return file in format compatible with frontend CodeFile type
    return NextResponse.json({
      id: file.id,
      name: file.name,
      path: file.path,
      content: file.content,
      isFolder: file.isFolder,
    });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/files
 * List all files in a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const projectId = params.id;

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
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

    // Fetch all files for the project
    const files = await prisma.file.findMany({
      where: {
        projectId: projectId,
      },
      orderBy: {
        path: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      files: files.map((file) => ({
        id: file.id,
        projectId: file.projectId,
        name: file.name,
        path: file.path,
        content: file.content,
        isFolder: file.isFolder,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

