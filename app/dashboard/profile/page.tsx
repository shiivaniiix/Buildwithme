"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";

type ProfileSection = "profile" | "account" | "security" | "preferences" | "danger";

interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  username: string | null;
  name: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfilePage() {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ProfileSection>("profile");
  const [dbUser, setDbUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile state
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data from database
  useEffect(() => {
    async function fetchUserData() {
      if (!clerkLoaded || !clerkUser) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/user/profile");
        if (response.ok) {
          const data = await response.json();
          setDbUser(data.user);
          setUsername(data.user.username || "");
          setName(data.user.name || "");
        } else {
          console.error("Failed to fetch user profile");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserData();
  }, [clerkLoaded, clerkUser]);

  // Redirect if no username (needs profile completion)
  useEffect(() => {
    if (dbUser && !dbUser.username && !isLoading) {
      router.push("/dashboard/complete-profile");
    }
  }, [dbUser, isLoading, router]);

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(username.toLowerCase())) {
      setError("Username must be 3-20 characters, lowercase letters, numbers, and underscores only");
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.toLowerCase().trim(),
          name: name.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDbUser(data.user);
        setSuccess("Profile updated successfully!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("An error occurred while updating your profile");
    } finally {
      setIsSaving(false);
    }
  };

  const sidebarItems: Array<{ id: ProfileSection; label: string; icon: React.ReactNode }> = [
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "account",
      label: "Account",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: "danger",
      label: "Danger Zone",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  if (isLoading || !clerkLoaded || !clerkUser) {
    return (
      <main className="min-h-screen code-pattern relative">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
          <div className="text-center text-gray-400">Loading profile...</div>
        </div>
      </main>
    );
  }

  const displayName = dbUser?.name || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || "User";
  const displayEmail = clerkUser.emailAddresses[0]?.emailAddress || "";
  const displayImage = dbUser?.imageUrl || clerkUser.imageUrl || "";

  return (
    <main className="min-h-screen code-pattern relative">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <aside className="lg:col-span-3">
            <div className="glass rounded-xl p-4 border border-gray-700 sticky top-24">
              <nav className="space-y-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeSection === item.id
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Right Content Panel */}
          <div className="lg:col-span-9">
            <div className="glass rounded-xl p-8 border border-gray-700">
              {/* Profile Section */}
              {activeSection === "profile" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Profile</h2>
                    <p className="text-gray-400 text-sm">Manage your public profile information</p>
                  </div>

                  {/* Profile Image */}
                  <div className="flex items-center gap-6">
                    {displayImage && (
                      <img
                        src={displayImage}
                        alt={displayName}
                        className="w-20 h-20 rounded-full border-2 border-cyan-500/30"
                      />
                    )}
                    <div>
                      <p className="text-sm text-gray-400">Profile image is managed in your Clerk account settings</p>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {success && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-green-400 text-sm">{success}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Username <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
                          setError(null);
                        }}
                        placeholder="username"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                      <p className="mt-1 text-xs text-gray-500">3-20 characters, lowercase letters, numbers, and underscores only</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving..." : "Save Profile"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Section */}
              {activeSection === "account" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Account</h2>
                    <p className="text-gray-400 text-sm">Manage your account settings</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Account Created
                      </label>
                      <div className="px-4 py-2 bg-gray-800/30 border border-gray-700 rounded-lg text-gray-400 text-sm">
                        {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString() : "N/A"}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Email
                      </label>
                      <div className="px-4 py-2 bg-gray-800/30 border border-gray-700 rounded-lg text-gray-400 text-sm">
                        {displayEmail}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Email is managed in your Clerk account settings</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Section */}
              {activeSection === "security" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Security</h2>
                    <p className="text-gray-400 text-sm">Password and security settings are managed in your Clerk account</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      Use the UserButton in the navbar to access your Clerk account settings for password changes and security options.
                    </p>
                  </div>
                </div>
              )}

              {/* Preferences Section */}
              {activeSection === "preferences" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Preferences</h2>
                    <p className="text-gray-400 text-sm">Customize your experience</p>
                  </div>
                  <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                    <p className="text-gray-400 text-sm">Preferences coming soon</p>
                  </div>
                </div>
              )}

              {/* Danger Zone Section */}
              {activeSection === "danger" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Danger Zone</h2>
                    <p className="text-gray-400 text-sm">Irreversible and destructive actions</p>
                  </div>
                  <div className="border border-red-500/30 rounded-lg p-6 bg-red-500/10">
                    <h3 className="text-lg font-semibold text-white mb-2">Delete Account</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Account deletion is managed through your Clerk account settings. Use the UserButton to access account management.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
