"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProjects, getProjectById, addProject, addCommunityPost, getCurrentUserId, type Project } from "@/lib/projects";
import { getProjectFiles, type CodeFile } from "@/lib/projectFiles";

/**
 * Create Post Page
 * 
 * Project-aware community post creation.
 * Supports both project-specific and general posts.
 */
export default function CreatePostPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectIdFromUrl = searchParams.get("projectId");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectDescription, setShowProjectDescription] = useState(false);
  const [language, setLanguage] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Selective sharing state
  const [shareType, setShareType] = useState<"full_project" | "specific_file" | "code_snippet" | "text_only">("text_only");
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [snippetStartLine, setSnippetStartLine] = useState<string>("");
  const [snippetEndLine, setSnippetEndLine] = useState<string>("");
  const [selectedSnippetFile, setSelectedSnippetFile] = useState<string>("");

  // Load projects and handle URL projectId
  useEffect(() => {
    const loadedProjects = getProjects();
    setProjects(loadedProjects);

    if (projectIdFromUrl) {
      const project = getProjectById(projectIdFromUrl);
      if (project) {
        setSelectedProjectId(projectIdFromUrl);
        setSelectedProject(project);
        setShowProjectDescription(true);
        if (project.language) {
          setLanguage(project.language);
        }
      }
    }
  }, [projectIdFromUrl]);

  // Update selected project when selection changes
  useEffect(() => {
    if (selectedProjectId) {
      const project = getProjectById(selectedProjectId);
      setSelectedProject(project || null);
      setShowProjectDescription(!!project);
      if (project?.language) {
        setLanguage(project.language);
      }
      // Load project files for file picker
      const files = getProjectFiles(selectedProjectId);
      setProjectFiles(files);
      // Auto-select "full_project" if project is selected and currently text_only
      setShareType((prev) => prev === "text_only" ? "full_project" : prev);
    } else {
      setSelectedProject(null);
      setShowProjectDescription(false);
      setProjectFiles([]);
      setShareType("text_only");
    }
  }, [selectedProjectId]);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setScreenshot(null);
    setScreenshotPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Validate sharing selection
    if (selectedProjectId && shareType === "specific_file" && !selectedFileName) {
      alert("Please select a file to share.");
      return;
    }
    if (selectedProjectId && shareType === "code_snippet") {
      if (!selectedSnippetFile) {
        alert("Please select a file for the code snippet.");
        return;
      }
      // Either pasted snippet OR line range must be provided
      if (!codeSnippet.trim() && (!snippetStartLine || !snippetEndLine)) {
        alert("Please either paste a code snippet or specify line range.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const currentUserId = getCurrentUserId();
      
      // Prepare attachment data if screenshot exists
      // screenshotPreview should already be a data URL from FileReader
      const attachments = screenshot && screenshotPreview ? [{
        id: `att_${Date.now()}`,
        name: screenshot.name,
        url: screenshotPreview, // This is already a data URL from FileReader
        type: screenshot.type,
        size: screenshot.size,
      }] : [];
      
      // Prepare sharing-specific data
      let sharedFileContent: string | undefined;
      let sharedSnippetContent: string | undefined;
      let sharedSnippetLines: { start: number; end: number } | undefined;
      
      if (selectedProjectId && shareType === "specific_file" && selectedFileName) {
        const file = getProjectFiles(selectedProjectId).find(f => f.name === selectedFileName);
        sharedFileContent = file?.content;
      }
      
      if (selectedProjectId && shareType === "code_snippet" && selectedSnippetFile) {
        // If code snippet is pasted, use that; otherwise extract from file
        if (codeSnippet.trim()) {
          // Use pasted snippet
          sharedSnippetContent = codeSnippet.trim();
          // Try to extract line range if provided
          if (snippetStartLine && snippetEndLine) {
            const start = parseInt(snippetStartLine);
            const end = parseInt(snippetEndLine);
            if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
              sharedSnippetLines = { start, end };
            }
          }
        } else if (snippetStartLine && snippetEndLine) {
          // Extract from file using line range
          const file = getProjectFiles(selectedProjectId).find(f => f.name === selectedSnippetFile);
          if (file) {
            const start = parseInt(snippetStartLine);
            const end = parseInt(snippetEndLine);
            if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
              const lines = file.content.split('\n');
              sharedSnippetContent = lines.slice(start - 1, end).join('\n');
              sharedSnippetLines = { start, end };
            }
          }
        }
      }
      
      // If a project is selected AND not text_only, share that project as a question post
      if (selectedProjectId && selectedProject && shareType !== "text_only") {
        // Update the existing project to be a question post
        const projects = getProjects();
        const updatedProjects = projects.map(p => {
          if (p.id === selectedProjectId) {
            return {
              ...p,
              isPublic: true,
              shared: true,
              sharedAt: Date.now(),
              sharedBy: currentUserId,
              shareDescription: question.trim(),
              postType: "question" as const,
              ownerId: p.ownerId || currentUserId,
              updatedAt: Date.now(),
              shareType: shareType,
              sharedFileName: shareType === "specific_file" ? selectedFileName : undefined,
              sharedFileContent: shareType === "specific_file" ? sharedFileContent : undefined,
              sharedSnippetFile: shareType === "code_snippet" ? selectedSnippetFile : undefined,
              sharedSnippetLines: shareType === "code_snippet" ? sharedSnippetLines : undefined,
              sharedSnippetContent: shareType === "code_snippet" ? sharedSnippetContent : undefined,
              attachments: attachments.length > 0 ? attachments : undefined,
            };
          }
          return p;
        });
        localStorage.setItem("buildwithme-projects", JSON.stringify(updatedProjects));
      } else {
        // Create a new question post (not tied to a project)
        // This is a standalone community post, NOT a dashboard project
        const newPost: Project = {
          id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: question.trim().substring(0, 50) + (question.trim().length > 50 ? "..." : ""),
          description: codeSnippet.trim() || undefined,
          language: language || undefined,
          isPublic: true,
          shared: true,
          sharedAt: Date.now(),
          sharedBy: currentUserId,
          shareDescription: question.trim(),
          postType: "question",
          ownerId: currentUserId,
          likesCount: 0,
          commentsCount: 0,
          downloadsCount: 0,
          comments: [],
          shareType: shareType,
          attachments: attachments.length > 0 ? attachments : undefined,
        };
        
        // Save to community posts storage, NOT projects storage
        // This prevents it from appearing in /dashboard
        addCommunityPost(newPost);
      }

      // Reset form
      setQuestion("");
      setCodeSnippet("");
      setScreenshot(null);
      setScreenshotPreview(null);
      setShareType("text_only");
      setSelectedFileName("");
      setSnippetStartLine("");
      setSnippetEndLine("");
      setSelectedSnippetFile("");
      if (!projectIdFromUrl) {
        setSelectedProjectId(null);
        setSelectedProject(null);
        setLanguage("");
      }

      // Navigate to profile to see the new post
      router.push("/community/profile");
    } catch (error) {
      console.error("Failed to create post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = question.trim().length > 0;

  return (
    <div className="min-h-screen">
      <div className="px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Create Post</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selector */}
            <div className="glass rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-white mb-2">
                Project <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <select
                value={selectedProjectId || ""}
                onChange={(e) => setSelectedProjectId(e.target.value || null)}
                disabled={!!projectIdFromUrl}
                className={`w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm ${
                  projectIdFromUrl ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <option value="">No project (General question)</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projectIdFromUrl && (
                <p className="mt-2 text-xs text-gray-500">
                  Project is pre-selected from URL. You can change it if needed.
                </p>
              )}
            </div>

            {/* Project Description (Collapsible) */}
            {selectedProject && (
              <div className="glass rounded-xl p-6 border border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowProjectDescription(!showProjectDescription)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <h3 className="text-sm font-medium text-white mb-1">
                      Project: {selectedProject.name}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {showProjectDescription ? "Hide description" : "Show description"}
                    </p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showProjectDescription ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showProjectDescription && selectedProject.description && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">
                      {selectedProject.description}
                    </p>
                  </div>
                )}
                {showProjectDescription && !selectedProject.description && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-500 italic">No description available</p>
                  </div>
                )}
              </div>
            )}

            {/* What do you want to share? (Only show if project is selected) */}
            {selectedProject && (
              <div className="glass rounded-xl p-6 border border-gray-700">
                <label className="block text-sm font-medium text-white mb-3">
                  What do you want to share? <span className="text-red-400">*</span>
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="full_project"
                      checked={shareType === "full_project"}
                      onChange={(e) => setShareType(e.target.value as typeof shareType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Full project</div>
                      <div className="text-xs text-gray-400 mt-1">Entire codebase will be read-only and public</div>
                      {shareType === "full_project" && (
                        <div className="mt-2 text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1 inline-block">
                          ⚠️ Full code will be read-only and public
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="specific_file"
                      checked={shareType === "specific_file"}
                      onChange={(e) => setShareType(e.target.value as typeof shareType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Specific file</div>
                      <div className="text-xs text-gray-400 mt-1">Share only one file from the project</div>
                      {shareType === "specific_file" && projectFiles.length > 0 && (
                        <select
                          value={selectedFileName}
                          onChange={(e) => setSelectedFileName(e.target.value)}
                          className="mt-2 w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                          required={shareType === "specific_file"}
                        >
                          <option value="">Select a file...</option>
                          {projectFiles.map((file) => (
                            <option key={file.id} value={file.name}>
                              {file.name}
                            </option>
                          ))}
                        </select>
                      )}
                      {shareType === "specific_file" && projectFiles.length === 0 && (
                        <div className="mt-2 text-xs text-gray-500">No files available in this project</div>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="code_snippet"
                      checked={shareType === "code_snippet"}
                      onChange={(e) => setShareType(e.target.value as typeof shareType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Code snippet</div>
                      <div className="text-xs text-gray-400 mt-1">Share specific lines from a file OR paste a snippet</div>
                      {shareType === "code_snippet" && projectFiles.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <select
                            value={selectedSnippetFile}
                            onChange={(e) => setSelectedSnippetFile(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                            required={shareType === "code_snippet"}
                          >
                            <option value="">Select a file...</option>
                            {projectFiles.map((file) => (
                              <option key={file.id} value={file.name}>
                                {file.name}
                              </option>
                            ))}
                          </select>
                          <div className="text-xs text-gray-500 mt-1">OR paste snippet in the "Code Snippet" field below</div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={snippetStartLine}
                              onChange={(e) => setSnippetStartLine(e.target.value)}
                              placeholder="Start line (optional)"
                              min="1"
                              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                            />
                            <span className="text-gray-400">to</span>
                            <input
                              type="number"
                              value={snippetEndLine}
                              onChange={(e) => setSnippetEndLine(e.target.value)}
                              placeholder="End line (optional)"
                              min="1"
                              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400"
                            />
                          </div>
                          <div className="text-xs text-gray-500">(Leave empty if pasting snippet below)</div>
                        </div>
                      )}
                      {shareType === "code_snippet" && projectFiles.length === 0 && (
                        <div className="mt-2 text-xs text-gray-500">No files available in this project. You can paste a snippet in the "Code Snippet" field below.</div>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-700 hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="text_only"
                      checked={shareType === "text_only"}
                      onChange={(e) => setShareType(e.target.value as typeof shareType)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">Text only</div>
                      <div className="text-xs text-gray-400 mt-1">No code or project linked, just description and attachments</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Programming Language */}
            <div className="glass rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-white mb-2">
                Programming Language <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
              >
                <option value="">Select language</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Question Input (Required) */}
            <div className="glass rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-white mb-2">
                Question <span className="text-red-400">*</span>
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your question or doubt?"
                rows={6}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none text-sm"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                {question.length} characters
              </p>
            </div>

            {/* Code Snippet (Optional, or required for code_snippet shareType) */}
            <div className="glass rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-white mb-2">
                Code Snippet{" "}
                {shareType === "code_snippet" && !snippetStartLine && !snippetEndLine ? (
                  <span className="text-red-400 text-xs">*</span>
                ) : (
                  <span className="text-gray-500 text-xs">(Optional)</span>
                )}
              </label>
              <textarea
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder={
                  shareType === "code_snippet" && !snippetStartLine && !snippetEndLine
                    ? "Paste your code snippet here (required if not using line range)..."
                    : "Paste your code here..."
                }
                rows={8}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none text-sm font-mono"
                required={shareType === "code_snippet" && !snippetStartLine && !snippetEndLine}
              />
              {shareType === "code_snippet" && (
                <p className="mt-2 text-xs text-gray-500">
                  Paste your snippet here, or specify line range above to extract from the selected file.
                </p>
              )}
            </div>

            {/* Screenshot Upload (Optional) */}
            <div className="glass rounded-xl p-6 border border-gray-700">
              <label className="block text-sm font-medium text-white mb-2">
                Screenshot <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              {!screenshotPreview ? (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-400/50 transition-colors">
                    <svg
                      className="w-12 h-12 text-gray-500 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-sm text-gray-400">Click to upload screenshot</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Screenshot preview"
                    className="w-full rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveScreenshot}
                    className="absolute top-2 right-2 px-3 py-1 bg-red-500/80 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
