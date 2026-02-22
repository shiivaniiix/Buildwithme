import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/CodeGraph(.*)",
]);

// Routes that don't require username (profile completion)
const skipUsernameCheck = createRouteMatcher([
  "/dashboard/complete-profile",
  "/sign-in",
  "/sign-up",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect();
    
    // Check if user has username (unless on complete-profile page)
    if (!skipUsernameCheck(req)) {
      try {
        const { userId } = await auth();
        if (userId) {
          const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { username: true },
          });
          
          // Redirect to complete-profile if no username
          if (!user?.username) {
            return NextResponse.redirect(new URL("/dashboard/complete-profile", req.url));
          }
        }
      } catch (error) {
        console.error("Error checking username in middleware:", error);
        // Continue if check fails (don't block access)
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
