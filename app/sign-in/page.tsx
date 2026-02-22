"use client";

import { useState, useEffect } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Footer from "@/components/Footer";

/**
 * Custom Sign-In Page
 * 
 * Fully custom styled login UI using Clerk hooks.
 * Matches Buildwithme design system.
 */
export default function SignInPage() {
  const { isSignedIn, isLoaded: userLoaded } = useUser();
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated - must check isLoaded to avoid premature redirect
  useEffect(() => {
    if (userLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isSignedIn, userLoaded, router]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);

    try {
      // Create sign-in attempt
      const result = await signIn.create({
        identifier: email,
        password: password,
        strategy: "password",
      });

      // Complete the sign-in process
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        // Redirect to dashboard using replace to avoid back button issues
        router.replace("/dashboard");
      } else {
        // Handle additional verification steps if needed
        setError("Please check your email for verification.");
      }
    } catch (err: any) {
      // Handle errors
      if (err.errors) {
        const errorMessage = err.errors[0]?.message || "Invalid credentials. Please try again.";
        setError(errorMessage);
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Sign-in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/dashboard",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  // Show loading state while checking authentication
  if (!userLoaded) {
    return (
      <main className="min-h-screen code-pattern relative">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </main>
    );
  }

  // Don't render form if already signed in (redirect will happen via useEffect)
  if (isSignedIn) {
    return (
      <main className="min-h-screen code-pattern relative">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Redirecting...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen code-pattern relative">
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-32">
        <div className="w-full max-w-md">
          {/* Sign-In Card */}
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-gray-400">
                Sign in to continue to Buildwithme
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Sign-In Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading || !isLoaded}
                  className="w-full px-4 py-3 glass rounded-xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading || !isLoaded}
                  className="w-full px-4 py-3 glass rounded-xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || !isLoaded}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-soft-lg hover:shadow-glow-blue transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Or continue with</span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !isLoaded}
              className="w-full px-6 py-3 glass rounded-xl border border-gray-600 bg-gray-900/50 text-white font-semibold hover:border-cyan-400/50 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-400">
                Don't have an account?{" "}
                <Link 
                  href="/sign-up" 
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}

