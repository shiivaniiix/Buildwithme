"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Footer from "@/components/Footer";

/**
 * Complete Profile Page
 * 
 * Required step for new users to set their username.
 * Redirects to dashboard after completion.
 */
export default function CompleteProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user already has username
  useEffect(() => {
    async function checkUsername() {
      if (!clerkLoaded || !clerkUser) {
        return;
      }

      try {
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.user?.username) {
            // User already has username, redirect to dashboard
            router.replace("/dashboard");
          } else {
            setIsChecking(false);
          }
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setIsChecking(false);
      }
    }

    checkUsername();
  }, [clerkLoaded, clerkUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    const usernameLower = username.toLowerCase().trim();

    if (!usernameRegex.test(usernameLower)) {
      setError("Username must be 3-20 characters, lowercase letters, numbers, and underscores only");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: usernameLower,
        }),
      });

      if (response.ok) {
        // Username set successfully, redirect to dashboard
        router.replace("/dashboard");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to set username");
      }
    } catch (error) {
      console.error("Error setting username:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking || !clerkLoaded) {
    return (
      <main className="min-h-screen code-pattern relative">
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen code-pattern relative">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-32">
        <div className="w-full max-w-md">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Complete Your Profile
              </h1>
              <p className="text-gray-400">
                Choose a unique username to get started
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                    setError(null);
                  }}
                  placeholder="username"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 glass rounded-xl border border-gray-600 bg-gray-900/50 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-2 text-xs text-gray-500">
                  3-20 characters, lowercase letters, numbers, and underscores only
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !username.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-soft-lg hover:shadow-glow-blue transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? "Setting up..." : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

