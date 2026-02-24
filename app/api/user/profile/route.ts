/**
 * User Profile API Routes
 * 
 * GET /api/user/profile - Get current user's profile
 * PATCH /api/user/profile - Update user's profile (username, name)
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/user/profile
 * 
 * Returns the current user's profile from database
 */
export async function GET(): Promise<Response> {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get full user from database
    const user = await prisma.user.findUnique({
      where: {
        id: dbUser.id,
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        name: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * 
 * Updates user's profile (username, name)
 * Validates username uniqueness and format
 */
export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const dbUser = await getCurrentUser();

    if (!dbUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, name } = body;

    // Validate username if provided
    if (username !== undefined) {
      if (!username || username.trim().length === 0) {
        return NextResponse.json(
          { error: "Username is required" },
          { status: 400 }
        );
      }

      const usernameLower = username.toLowerCase().trim();

      // Validate format: 3-20 characters, lowercase letters, numbers, underscores only
      const usernameRegex = /^[a-z0-9_]{3,20}$/;
      if (!usernameRegex.test(usernameLower)) {
        return NextResponse.json(
          { error: "Username must be 3-20 characters, lowercase letters, numbers, and underscores only" },
          { status: 400 }
        );
      }

      // Check if username is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: {
          username: usernameLower,
        },
      });

      if (existingUser && existingUser.id !== dbUser.id) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id: dbUser.id,
      },
      data: {
        ...(username !== undefined && { username: username.toLowerCase().trim() }),
        ...(name !== undefined && { name: name.trim() || null }),
      },
      select: {
        id: true,
        clerkId: true,
        email: true,
        username: true,
        name: true,
        imageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    
    // Handle Prisma unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

