"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  getSortedProjects,
  getProjectById, 
  shareProject, 
  unshareProject,
  updateProjectSharing,
  isProjectOwner,
  getCurrentUserId,
  type Project 
} from "@/lib/projects";

export default function ShareProjectPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [shareDescription, setShareDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Attachments state
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [demoLink, setDemoLink] = useState("");
  const [docsLink, setDocsLink] = useState("");

  useEffect(() => {
    // Use the same method as dashboard to fetch projects
    const allProjects = getSortedProjects();
    // For now, show all projects (matching dashboard behavior)
    // If ownerId is not set on existing projects, they're treated as user's projects
    setProjects(allProjects);
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const project = getProjectById(selectedProjectId);
      if (project) {
        // Allow sharing if project exists (matching dashboard behavior)
        // Owner check is optional since existing projects may not have ownerId
        setSelectedProject(project);
        setShareDescription(project.shareDescription || project.description || "");
        setTags(project.tags || []);
        setIsPublic(project.isPublic === true || project.shared === true);
      } else {
        setSelectedProject(null);
        setShareDescription("");
        setTags([]);
        setIsPublic(false);
      }
    } else {
      setSelectedProject(null);
      setShareDescription("");
      setTags([]);
      setIsPublic(false);
    }
    setConsentChecked(false);
    setShowWarning(false);
  }, [selectedProjectId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProjectId(e.target.value);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setShareDescription(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim() && tags.length < 5) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput("");
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePublicToggle = (checked: boolean) => {
    if (checked && !isPublic) {
      // Show warning when enabling public
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
    setIsPublic(checked);
    if (!checked) {
      setConsentChecked(false);
    }
  };

  const handleShare = async () => {
    if (!selectedProjectId || !consentChecked) return;

    setIsSaving(true);
    try {
      if (isPublic) {
        // Share project
        shareProject(selectedProjectId, {
          shareDescription: shareDescription.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        });
        alert("Project shared successfully! It's now visible to the community.");
      } else {
        // Unshare project
        unshareProject(selectedProjectId);
        alert("Project is now private.");
      }
      
      // Refresh project list (same as dashboard)
      setProjects(getSortedProjects());
      
      // Update selected project state
      const updatedProject = getProjectById(selectedProjectId);
      if (updatedProject) {
        setSelectedProject(updatedProject);
        setIsPublic(updatedProject.isPublic === true || updatedProject.shared === true);
      }
    } catch (error) {
      console.error("Failed to share project:", error);
      alert("Failed to share project. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSharing = async () => {
    if (!selectedProjectId || !isPublic) return;

    setIsSaving(true);
    try {
      updateProjectSharing(selectedProjectId, {
        shareDescription: shareDescription.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });
      alert("Sharing settings updated successfully!");
      
      // Refresh project
      const updatedProject = getProjectById(selectedProjectId);
      if (updatedProject) {
        setSelectedProject(updatedProject);
      }
    } catch (error) {
      console.error("Failed to update sharing:", error);
      alert("Failed to update sharing settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getTechStack = (project: Project): string => {
    if (project.language) {
      return project.language.charAt(0).toUpperCase() + project.language.slice(1);
    }
    return "Not specified";
  };

  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Share Project to Community
          </h1>
          <p className="text-gray-400 text-lg">
            Make your project visible to the community. Others can view and learn, but cannot edit.
          </p>
        </header>

        {/* Form */}
        <div className="space-y-6">
          {/* Project List - Scrollable */}
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <label className="block text-white font-medium mb-4">
              Select a project <span className="text-red-400">*</span>
            </label>
            {projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No projects found.</p>
                <Link
                  href="/dashboard"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Create a project first
                </Link>
              </div>
            ) : (
              <div className="ide-scrollbar max-h-96 overflow-y-auto border border-gray-700 rounded-lg">
                <div className="divide-y divide-gray-700">
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`w-full text-left p-4 hover:bg-gray-800/50 transition-colors ${
                        selectedProjectId === project.id
                          ? "bg-cyan-500/10 border-l-4 border-cyan-400"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold mb-1 truncate">
                            {project.name}
                          </h3>
                          {project.description && (
                            <p className="text-gray-400 text-sm line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          {!project.description && (
                            <p className="text-gray-500 text-sm italic">
                              No description
                            </p>
                          )}
                        </div>
                        {selectedProjectId === project.id && (
                          <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Project Summary Card */}
          {selectedProject && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <h2 className="text-2xl font-bold mb-6 text-white">Project Summary</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Project Name</label>
                  <p className="text-white font-semibold text-lg">{selectedProject.name}</p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Tech Stack</label>
                  <p className="text-white">{getTechStack(selectedProject)}</p>
                </div>
                
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Last Updated</label>
                  <p className="text-white">{formatDate(selectedProject.updatedAt || selectedProject.createdAt)}</p>
                </div>

                {selectedProject.isPublic && selectedProject.sharedAt && (
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Shared On</label>
                    <p className="text-white">{formatDate(selectedProject.sharedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visibility Toggle */}
          {selectedProject && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Visibility</h2>
                  <p className="text-gray-400 text-sm">
                    Control who can view your project
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => handlePublicToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
                  <span className="ml-3 text-sm font-medium text-white">
                    {isPublic ? "Public" : "Private"}
                  </span>
                </label>
              </div>

              {/* Warning Message */}
              {showWarning && !isPublic && (
                <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-yellow-400 font-medium mb-1">Making Project Public</p>
                      <p className="text-yellow-300 text-sm">
                        This will make your project visible to everyone. Others can view and download your code, but cannot edit it.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isPublic && (
                <div className="mt-4 p-4 bg-cyan-500/20 border border-cyan-500/50 rounded-lg">
                  <p className="text-cyan-300 text-sm">
                    ✓ Your project is currently public and visible to the community.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Project Description Input */}
          {selectedProject && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <label htmlFor="share-description" className="block text-white font-medium mb-2">
                Description <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <p className="text-gray-400 text-sm mb-3">
                Describe your project for the community. This helps others understand what you built and learned.
              </p>
              <textarea
                id="share-description"
                value={shareDescription}
                onChange={handleDescriptionChange}
                rows={6}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                placeholder="Describe your project, what you learned, or what makes it interesting..."
              />
            </div>
          )}

          {/* Attachments Section */}
          {selectedProject && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <label className="block text-white font-medium mb-2">
                Add references <span className="text-gray-500 text-sm">(optional)</span>
              </label>
              <p className="text-gray-400 text-sm mb-4">
                Add screenshots or links to help others understand your project better.
              </p>

              {/* Screenshot Upload */}
              <div className="mb-6">
                <label className="block text-gray-300 text-sm mb-2">Screenshots</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors">
                  <input
                    type="file"
                    id="screenshot-upload"
                    accept="image/jpeg,image/png,image/jpg"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setScreenshots(files);
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="screenshot-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg
                      className="w-12 h-12 mx-auto mb-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-gray-400 text-sm mb-2">
                      {screenshots.length > 0
                        ? `${screenshots.length} file(s) selected`
                        : "Click to upload screenshots (JPG/PNG)"}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">
                        JPG
                      </span>
                      <span className="px-3 py-1 bg-gray-800 text-gray-400 rounded-full text-xs">
                        PNG
                      </span>
                    </div>
                  </label>
                  {screenshots.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {screenshots.map((file, idx) => (
                        <div
                          key={idx}
                          className="relative inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                        >
                          <span>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setScreenshots(screenshots.filter((_, i) => i !== idx));
                            }}
                            className="hover:text-cyan-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="demo-link" className="block text-gray-300 text-sm mb-2">
                    Demo Link <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    id="demo-link"
                    type="url"
                    value={demoLink}
                    onChange={(e) => setDemoLink(e.target.value)}
                    placeholder="https://example.com/demo"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label htmlFor="docs-link" className="block text-gray-300 text-sm mb-2">
                    Documentation Link <span className="text-gray-500 text-xs">(optional)</span>
                  </label>
                  <input
                    id="docs-link"
                    type="url"
                    value={docsLink}
                    onChange={(e) => setDocsLink(e.target.value)}
                    placeholder="https://example.com/docs"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {selectedProject && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <label htmlFor="tags-input" className="block text-white font-medium mb-2">
                Tags <span className="text-gray-500 text-sm">(optional, max 5)</span>
              </label>
              <p className="text-gray-400 text-sm mb-3">
                Add tags to help others discover your project (e.g., frontend, python, beginner, ai, web)
              </p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-cyan-300 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>

              {tags.length < 5 && (
                <input
                  id="tags-input"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Type a tag and press Enter..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                />
              )}
              {tags.length >= 5 && (
                <p className="text-gray-500 text-sm">Maximum of 5 tags reached</p>
              )}
            </div>
          )}

          {/* Consent Checkbox and Share Button */}
          {selectedProject && isPublic && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 w-5 h-5 text-cyan-500 bg-gray-800 border-gray-700 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <span className="text-gray-300 text-sm">
                    I understand this project will be public and view-only. Others can view and download my code, but cannot edit it.
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={!consentChecked || isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Share to Community"}
                </button>
                
                {selectedProject.isPublic && (
                  <button
                    type="button"
                    onClick={handleUpdateSharing}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Updating..." : "Update Settings"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Unshare Option */}
          {selectedProject && isPublic && (
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-red-500/30">
              <h3 className="text-lg font-semibold text-white mb-2">Make Project Private</h3>
              <p className="text-gray-400 text-sm mb-4">
                Hide your project from the community. It will no longer be publicly visible.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Are you sure you want to make this project private? It will no longer be visible to the community.")) {
                    setIsPublic(false);
                    setConsentChecked(true);
                    handleShare();
                  }
                }}
                disabled={isSaving}
                className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Make Private
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
