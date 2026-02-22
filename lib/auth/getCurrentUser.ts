/**
 * Get Current User (Server Helper)
 * 
 * This is the primary helper function for all protected API routes and server components.
 * It:
 * 1. Gets the authenticated Clerk user
 * 2. Syncs user to database (creates if not exists)
 * 3. Returns the database user object
 * 
 * Usage in API routes:
 * ```typescript
 * import { getCurrentUser } from "@/lib/auth/getCurrentUser";
 * 
 * export async function GET() {
 *   const user = await getCurrentUser();
 *   if (!user) {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 *   // Use user.id for database operations
 * }
 * ```
 */

import { getOrCreateUser } from "./getOrCreateUser";

export interface CurrentUser {
  id: string;
  clerkId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get current authenticated user from database
 * 
 * This function should be used in all protected API routes and server components.
 * It automatically creates the user in the database if they don't exist.
 * 
 * @returns Current user object or null if not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const result = await getOrCreateUser();

  if (result.error || !result.user) {
    return null;
  }

  return result.user;
}

