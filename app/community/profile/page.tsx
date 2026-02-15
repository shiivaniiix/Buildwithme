"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicProjects, unshareProject, deleteCommunityPost, getCurrentUserId, type Project } from "@/lib/projects";

// Helper function to format relative time
function formatRelativeTime(timestamp: string | number): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Helper function to get file type icon
function getFileTypeIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  if (type.includes("zip") || type.includes("archive")) return "📦";
  if (type.includes("text") || type.includes("code") || type.includes("javascript") || type.includes("python")) return "📝";
  return "📎";
}

// Helper function to format file size
function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CommunityProfilePage() {
  const [myPosts, setMyPosts] = useState<Project[]>([]);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [commentsModalOpen, setCommentsModalOpen] = useState<string | null>(null); // Project ID for which comments are open
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set()); // Track which descriptions are expanded

  const loadMyPosts = () => {
    const currentUserId = getCurrentUserId();
    // Filter posts shared by current user (fallback to ownerId if sharedBy is missing)
    const posts = getPublicProjects().filter(
      (p) => p.sharedBy === currentUserId || (!p.sharedBy && p.ownerId === currentUserId)
    );
    setMyPosts(posts);
  };

  useEffect(() => {
    loadMyPosts();
    
    // Refresh posts when page becomes visible (e.g., after creating a post)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadMyPosts();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleRemove = (projectId: string) => {
    if (!confirm("Remove this post from community?")) {
      return;
    }
    setIsRemoving(projectId);
    try {
      // Check if this is a standalone post (stored in community posts) or a linked project
      const post = getPublicProjects().find(p => p.id === projectId);
      if (post && post.id.startsWith("post_")) {
        // Standalone community post - delete it completely
        deleteCommunityPost(projectId);
      } else {
        // Post linked to a project - just unshare it
        unshareProject(projectId);
      }
      loadMyPosts();
      setToast("Post removed from community");
      setTimeout(() => setToast(null), 2500);
    } catch (error) {
      console.error("Failed to remove from community:", error);
      alert("Failed to remove post. Please try again.");
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xl">
                👤
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Profile</h1>
                <p className="text-gray-400 text-sm">Your community posts and profile</p>
              </div>
            </div>
            <Link
              href="/community"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Community</span>
            </Link>
          </div>

          {/* Toast */}
          {toast && (
            <div className="mb-4 px-4 py-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-300 text-sm">
              {toast}
            </div>
          )}

          <div className="glass rounded-2xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">My Community Posts</h2>
              <Link
                href="/dashboard/share-project"
                className="text-cyan-400 hover:text-cyan-300 text-sm"
              >
                Share a project →
              </Link>
            </div>

            {myPosts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">You haven't shared any projects yet.</p>
                <p className="text-gray-500 text-sm mt-2">Share a project to see it here.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto ide-scrollbar pr-2">
                {myPosts.map((project) => (
                  <div
                    key={project.id}
                    className="glass rounded-xl p-5 border border-gray-700 hover:border-cyan-400/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1 truncate">
                          {project.name}
                        </h3>
                        
                        {/* Description with Show More/Less */}
                        {(() => {
                          const description = project.shareDescription || project.description || "No description provided.";
                          const isExpanded = expandedDescriptions.has(project.id);
                          const shouldTruncate = description.length > 200;
                          const displayText = shouldTruncate && !isExpanded 
                            ? description.substring(0, 200) + "..."
                            : description;
                          
                          return (
                            <div className="mb-2">
                              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {displayText}
                              </p>
                              {shouldTruncate && (
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedDescriptions);
                                    if (isExpanded) {
                                      newExpanded.delete(project.id);
                                    } else {
                                      newExpanded.add(project.id);
                                    }
                                    setExpandedDescriptions(newExpanded);
                                  }}
                                  className="text-xs text-cyan-400 hover:text-cyan-300 mt-1 transition-colors"
                                >
                                  {isExpanded ? "Show less" : "Show more"}
                                </button>
                              )}
                            </div>
                          );
                        })()}
                        {/* Post Type Badge */}
                        {project.postType === "question" && (
                          <div className="mb-2">
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Question
                            </span>
                          </div>
                        )}
                        {/* Engagement Metrics */}
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <span>❤️</span>
                            <span className="text-gray-300">{project.likesCount ?? 0}</span>
                          </span>
                          <button
                            onClick={() => setCommentsModalOpen(project.id)}
                            className="flex items-center gap-1 hover:text-cyan-400 transition-colors cursor-pointer"
                            title="View comments"
                          >
                            <span>💬</span>
                            <span className="text-gray-300">{project.commentsCount ?? 0}</span>
                          </button>
                          <span className="flex items-center gap-1">
                            <span>⬇️</span>
                            <span className="text-gray-300">{project.downloadsCount ?? 0}</span>
                          </span>
                        </div>
                        {/* Privacy/Sharing Indicator */}
                        {(() => {
                          const shareType = project.shareType || (project.id.startsWith("post_") ? "text_only" : "full_project");
                          const hasAttachments = project.attachments && project.attachments.length > 0;
                          
                          let sharedLabel = "";
                          if (shareType === "full_project") {
                            sharedLabel = "Full project";
                          } else if (shareType === "specific_file") {
                            sharedLabel = project.sharedFileName ? `File – ${project.sharedFileName}` : "Specific file";
                          } else if (shareType === "code_snippet") {
                            if (project.sharedSnippetLines && project.sharedSnippetFile) {
                              sharedLabel = `Code snippet (${project.sharedSnippetFile}, lines ${project.sharedSnippetLines.start}–${project.sharedSnippetLines.end})`;
                            } else {
                              sharedLabel = "Code snippet";
                            }
                          } else {
                            sharedLabel = "Text only";
                          }
                          
                          return (
                            <div className="mb-2 flex flex-col gap-1">
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Shared:</span>
                                <span className="text-gray-400 font-medium">{sharedLabel}</span>
                              </div>
                              {shareType === "full_project" && (
                                <div className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1 inline-block w-fit">
                                  ⚠️ Full code will be read-only and public
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Display shared content based on shareType */}
                        {(() => {
                          const shareType = project.shareType || (project.id.startsWith("post_") ? "text_only" : "full_project");
                          
                          if (shareType === "specific_file" && project.sharedFileContent) {
                            return (
                              <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                                  Shared File: {project.sharedFileName}
                                </h4>
                                <pre className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                  <code>{project.sharedFileContent}</code>
                                </pre>
                              </div>
                            );
                          }
                          
                          if (shareType === "code_snippet" && project.sharedSnippetContent) {
                            return (
                              <div className="mt-3 pt-3 border-t border-gray-700/50">
                                <h4 className="text-xs font-semibold text-gray-400 mb-2 uppercase">
                                  Code Snippet {project.sharedSnippetFile && `(${project.sharedSnippetFile})`}
                                  {project.sharedSnippetLines && ` - Lines ${project.sharedSnippetLines.start}–${project.sharedSnippetLines.end}`}
                                </h4>
                                <pre className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 overflow-x-auto text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                  <code>{project.sharedSnippetContent}</code>
                                </pre>
                              </div>
                            );
                          }
                          
                          return null;
                        })()}
                        
                        {/* Attachments Section */}
                        {project.attachments && Array.isArray(project.attachments) && project.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase">Attachments</h4>
                            {/* Image thumbnails preview (show first for images) */}
                            {project.attachments.some(a => a && a.type && a.type.startsWith("image/")) && (
                              <div className="mb-3 grid grid-cols-2 gap-2">
                                {project.attachments
                                  .filter(a => a && a.type && a.type.startsWith("image/") && a.url)
                                  .map((attachment) => (
                                    <a
                                      key={attachment.id || attachment.name}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="relative group"
                                    >
                                      <img
                                        src={attachment.url}
                                        alt={attachment.name || "Attachment"}
                                        className="w-full h-32 object-cover rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors"
                                        onError={(e) => {
                                          // Hide broken images
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                                          Click to view
                                        </span>
                                      </div>
                                    </a>
                                  ))}
                              </div>
                            )}
                            {/* All attachments list */}
                            <div className="flex flex-wrap gap-2">
                              {project.attachments
                                .filter(a => a && a.url) // Only show attachments with valid URLs
                                .map((attachment) => {
                                  const isImage = attachment.type && attachment.type.startsWith("image/");
                                  return (
                                    <div
                                      key={attachment.id || attachment.name}
                                      className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-cyan-500/50 transition-colors"
                                    >
                                      <span className="text-sm">{getFileTypeIcon(attachment.type || "")}</span>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-300 truncate max-w-[200px]" title={attachment.name || "Attachment"}>
                                            {attachment.name || "Unnamed file"}
                                          </span>
                                          {attachment.size && (
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                              ({formatFileSize(attachment.size)})
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
                                        title={isImage ? "View image" : "Download file"}
                                      >
                                        {isImage ? "View" : "Download"}
                                      </a>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {project.sharedAt && (
                            <span>Shared: {new Date(project.sharedAt).toLocaleDateString()}</span>
                          )}
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-400">Read-only</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {/* Only show "View Project" for full project shares */}
                        {(() => {
                          const shareType = project.shareType || (project.id.startsWith("post_") ? "text_only" : "full_project");
                          if (shareType === "full_project") {
                            return (
                              <Link
                                href={`/community/projects/${project.id}`}
                                className="px-3 py-2 bg-gray-800 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-medium hover:bg-gray-700 transition-colors text-center"
                              >
                                View Project
                              </Link>
                            );
                          }
                          return null;
                        })()}
                        <button
                          onClick={() => handleRemove(project.id)}
                          disabled={isRemoving === project.id}
                          className="px-3 py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRemoving === project.id ? "Removing..." : "Remove from Community"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {commentsModalOpen && (() => {
        const project = myPosts.find(p => p.id === commentsModalOpen);
        if (!project) return null;
        const comments = project.comments || [];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setCommentsModalOpen(null)}
          >
            <div
              className="glass rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white">Comments</h2>
                  <p className="text-sm text-gray-400 mt-1">{project.name}</p>
                </div>
                <button
                  onClick={() => setCommentsModalOpen(null)}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-6 ide-scrollbar">
                {comments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-400">No comments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="glass rounded-lg p-4 border border-gray-700/50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-400 text-xs">
                              {comment.author.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-white">
                                {comment.author || "User"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

