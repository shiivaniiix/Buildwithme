/**
 * Test API Route - Verify User Creation
 * 
 * This is a temporary endpoint to test user creation from Clerk.
 * Call this after signing in to verify the user is created in the database.
 * 
 * GET /api/auth/test-user
 * 
 * Returns the current user from database (creates if not exists)
 */

import { NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth/getOrCreateUser";

export async function GET() {
  try {
    const result = await getOrCreateUser();

    if (result.error) {
      return NextResponse.json(
        { 
          error: result.error,
          message: "User not authenticated or error occurred"
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.user ? "User found/created successfully" : "User not found",
      user: result.user,
    });
  } catch (error) {
    console.error("Error in test-user route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

