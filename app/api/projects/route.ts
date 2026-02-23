/**
 * Projects API
 * 
 * POST /api/projects - Create a new project
 * GET /api/projects - List user's projects
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/projects
 * Create a new project
 * Body: { name, sourceType?, githubOwner?, githubRepo? }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, sourceType, githubOwner, githubRepo } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Create project - let Prisma auto-generate UUID
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: name.trim(),
        sourceType: sourceType || "python",
        githubOwner: githubOwner || null,
        githubRepo: githubRepo || null,
      },
      include: {
        files: true,
      },
    });

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        userId: project.userId,
        name: project.name,
        sourceType: project.sourceType,
        githubOwner: project.githubOwner,
        githubRepo: project.githubRepo,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        files: project.files,
      },
    });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects
 * List all projects for the current user
 */
export async function GET() {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch all projects for the user
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
      include: {
        files: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map((project) => ({
        id: project.id,
        userId: project.userId,
        name: project.name,
        sourceType: project.sourceType,
        githubOwner: project.githubOwner,
        githubRepo: project.githubRepo,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        files: project.files,
      })),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

