"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * Dashboard Layout
 * 
 * Handles username requirement check for all dashboard pages.
 * Uses client-side check to avoid Edge runtime issues with Prisma.
 * 
 * Note: This is a client component to avoid Prisma in server components
 * that might run in Edge runtime. The username check is done via API call.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    // Only check if user is loaded and signed in
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Skip check on complete-profile page (it handles its own redirect)
    if (pathname?.includes("/dashboard/complete-profile")) {
      return;
    }

    // Check username via API
    async function checkUsername() {
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          // Redirect to complete-profile if no username
          if (data.user && !data.user.username) {
            router.replace("/dashboard/complete-profile");
          }
        }
      } catch (error) {
        console.error("Error checking username in dashboard layout:", error);
        // Continue if check fails (don't block access)
      }
    }

    checkUsername();
  }, [isLoaded, isSignedIn, pathname, router]);

  return <>{children}</>;
}

