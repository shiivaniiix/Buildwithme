import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Footer from "@/components/Footer";

/**
 * Public User Profile Page
 * 
 * Displays public profile for a user by username.
 * Route: /user/[username]
 */
export default async function UserProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const username = params.username.toLowerCase();

  // Fetch user from database by username
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
    select: {
      id: true,
      username: true,
      name: true,
      imageUrl: true,
      createdAt: true,
      _count: {
        select: {
          projects: true,
          projectAnalyses: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const displayName = user.name || user.username || "User";
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <main className="min-h-screen code-pattern relative">
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        <div className="glass-strong rounded-2xl p-8 border border-gray-700">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full border-2 border-cyan-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{displayName}</h1>
              <p className="text-gray-400 mb-1">@{user.username}</p>
              <p className="text-sm text-gray-500">Joined {joinDate}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="glass rounded-xl p-4 border border-gray-700">
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {user._count.projects}
              </div>
              <div className="text-sm text-gray-400">Projects</div>
            </div>
            <div className="glass rounded-xl p-4 border border-gray-700">
              <div className="text-2xl font-bold text-cyan-400 mb-1">
                {user._count.projectAnalyses}
              </div>
              <div className="text-sm text-gray-400">Analyses</div>
            </div>
          </div>

          {/* Placeholder for future content */}
          <div className="border-t border-gray-700 pt-8">
            <h2 className="text-xl font-bold text-white mb-4">Public Projects</h2>
            <div className="text-gray-400 text-sm">
              Public projects will be displayed here in the future.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

