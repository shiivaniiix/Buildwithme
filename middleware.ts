import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/CodeGraph(.*)",
]);

// Define public routes that should be accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/login", // Legacy route - redirects to /sign-in
  "/signup",
  "/community(.*)",
  "/learn(.*)",
  "/docs(.*)",
  "/support(.*)",
]);

export default clerkMiddleware((auth, request: NextRequest) => {
  const { userId } = auth();
  const { pathname } = request.nextUrl;

  // Protect routes that require authentication
  if (isProtectedRoute(request) && !userId) {
    // Redirect to sign-in page if not authenticated
    // ClerkProvider handles redirect to /dashboard after successful login
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Allow public routes
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // For all other routes, continue normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
