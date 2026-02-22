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
    username: string | null;
    name: string | null;
    imageUrl: string | null;
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

    // Get name and image from Clerk
    const firstName = clerkUser.firstName || null;
    const lastName = clerkUser.lastName || null;
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;
    const imageUrl = clerkUser.imageUrl || null;
    const clerkUsername = clerkUser.username || null;

    // Check if user exists in database using clerkId
    let user = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    // Create or update user
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: userId, // Use Clerk user ID as primary key
          clerkId: userId, // Store Clerk user ID
          email: email,
          name: fullName,
          imageUrl: imageUrl,
          username: clerkUsername, // May be null initially
        },
      });
    } else {
      // Update existing user with latest Clerk data (but preserve username if already set)
      user = await prisma.user.update({
        where: {
          clerkId: userId,
        },
        data: {
          email: email,
          name: fullName,
          imageUrl: imageUrl,
          // Only update username from Clerk if user doesn't have one set
          username: user.username || clerkUsername,
        },
      });
    }

    return {
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        username: user.username,
        name: user.name,
        imageUrl: user.imageUrl,
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

