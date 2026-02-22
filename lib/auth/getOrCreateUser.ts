/**
 * Get or Create User from Clerk
 * 
 * This utility function:
 * 1. Gets the current authenticated Clerk user
 * 2. Checks if user exists in database
 * 3. Creates user in database if not exists
 * 4. Returns Prisma user object
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export interface GetOrCreateUserResult {
  user: {
    id: string;
    clerkId: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  error: string | null;
}

/**
 * Get or create user from Clerk authentication
 * 
 * @returns User object from database or error
 */
export async function getOrCreateUser(): Promise<GetOrCreateUserResult> {
  try {
    // Get Clerk authentication state
    const { userId } = await auth();

    if (!userId) {
      return {
        user: null,
        error: "User not authenticated",
      };
    }

    // Get full Clerk user object
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return {
        user: null,
        error: "Failed to fetch Clerk user",
      };
    }

    // Get email from Clerk user (primary email address)
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return {
        user: null,
        error: "User email not found in Clerk",
      };
    }

    // Check if user exists in database
    let user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // Create user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          clerkId: userId, // Same as id, kept for clarity
          email: email,
        },
      });
    }

    return {
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in getOrCreateUser:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get current user ID from Clerk (server-side)
 * 
 * @returns Clerk user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error("Error getting current user ID:", error);
    return null;
  }
}

