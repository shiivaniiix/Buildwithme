"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicProjects, type Project } from "@/lib/projects";

/**
 * Community Main Page
 * 
 * Main community hub for browsing posts.
 */
export default function CommunityPage() {
  const [posts, setPosts] = useState<Project[]>([]);

  useEffect(() => {
    // Load all public projects to show in community feed
    const publicProjects = getPublicProjects();
    setPosts(publicProjects);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Top Bar - Search */}
      <div className="fixed top-14 left-16 right-0 z-30 glass border-b border-gray-800 h-16 flex items-center px-6">
        <div className="w-full max-w-2xl">
          <input
            type="text"
            placeholder="Search users by username"
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 text-sm"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-6">Community</h1>
          
          {/* Posts */}
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="glass rounded-xl p-6 border border-gray-700 text-center">
                <p className="text-gray-400 text-sm mb-2">No community posts yet.</p>
                <p className="text-gray-500 text-xs">Share a project to see it here.</p>
              </div>
            ) : (
              posts.map((project) => (
                <div
                  key={project.id}
                  className="glass rounded-xl p-6 border border-gray-700 hover:border-cyan-400/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-400 text-sm">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{project.name}</span>
                        {project.sharedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(project.sharedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-3">
                        {project.shareDescription || project.description || "No description provided."}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <Link
                          href={`/community/projects/${project.id}`}
                          className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                        >
                          View Project
                        </Link>
                        <span className="text-gray-600 text-sm">•</span>
                        <span className="text-gray-400 text-sm">Read-only</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

