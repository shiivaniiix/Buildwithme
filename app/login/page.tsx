import { redirect } from "next/navigation";

/**
 * Legacy Login Route Redirect
 * 
 * Redirects /login to /sign-in (Clerk authentication)
 * This ensures backward compatibility while standardizing on Clerk.
 */
export default function LoginRedirect() {
  redirect("/sign-in");
}
