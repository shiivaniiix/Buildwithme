"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { addProject, type Project } from "@/lib/projects";
import { saveProjectFiles, type CodeFile } from "@/lib/projectFiles";

export default function ImportProjectPage() {
  const router = useRouter();
  const [githubUrl, setGithubUrl] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [isImportingGitHub, setIsImportingGitHub] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  
  const [localFiles, setLocalFiles] = useState<FileList | null>(null);
  const [isImportingLocal, setIsImportingLocal] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [totalSize, setTotalSize] = useState(0);

  const handleGitHubImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setGithubError("Please enter a GitHub repository URL");
      return;
    }

    setIsImportingGitHub(true);
    setGithubError(null);

    try {
      const response = await fetch("/api/import/github", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repoUrl: githubUrl.trim(),
          branch: githubBranch.trim() || "main",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import from GitHub");
      }

      if (!data.success || !data.project) {
        throw new Error("Invalid response from server");
      }

      // Create project via API (uses Prisma auto-generated UUID)
      const createProjectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.project.name,
          sourceType: data.project.language || "python",
          githubOwner: data.project.githubOwner,
          githubRepo: data.project.githubRepo,
        }),
      });

      if (!createProjectResponse.ok) {
        const error = await createProjectResponse.json();
        throw new Error(error.error || "Failed to create project");
      }

      const projectData = await createProjectResponse.json();
      const projectId = projectData.project.id;

      // Save files to database via API
      for (const file of data.project.files) {
        await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            path: file.name,
            content: file.content,
            isFolder: false,
          }),
        });
      }

      // Also add to localStorage for backward compatibility
      const newProject: Project = {
        id: projectId,
        name: data.project.name,
        description: data.project.description,
        language: data.project.language,
        createdAt: new Date(projectData.project.createdAt).getTime(),
        updatedAt: new Date(projectData.project.updatedAt).getTime(),
      };
      addProject(newProject);

      // Redirect to project page
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("GitHub import error:", error);
      setGithubError(error instanceof Error ? error.message : "Failed to import from GitHub");
      setIsImportingGitHub(false);
    }
  };

  const handleLocalFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      setLocalFiles(null);
      setFileCount(0);
      setTotalSize(0);
      return;
    }

    setLocalFiles(files);
    setFileCount(files.length);
    
    let size = 0;
    for (let i = 0; i < files.length; i++) {
      size += files[i].size;
    }
    setTotalSize(size);
    setLocalError(null);
  };

  const handleLocalImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localFiles || localFiles.length === 0) {
      setLocalError("Please select a folder to import");
      return;
    }

    setIsImportingLocal(true);
    setLocalError(null);

    try {
      const formData = new FormData();
      for (let i = 0; i < localFiles.length; i++) {
        formData.append("files", localFiles[i]);
      }

      const response = await fetch("/api/import/local", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to import local folder");
      }

      if (!data.success || !data.project) {
        throw new Error("Invalid response from server");
      }

      // Create project via API (uses Prisma auto-generated UUID)
      const createProjectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.project.name,
          sourceType: data.project.language || "python",
        }),
      });

      if (!createProjectResponse.ok) {
        const error = await createProjectResponse.json();
        throw new Error(error.error || "Failed to create project");
      }

      const projectData = await createProjectResponse.json();
      const projectId = projectData.project.id;

      // Save files to database via API
      for (const file of data.project.files) {
        await fetch(`/api/projects/${projectId}/files`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            path: file.name,
            content: file.content,
            isFolder: false,
          }),
        });
      }

      // Also add to localStorage for backward compatibility
      const newProject: Project = {
        id: projectId,
        name: data.project.name,
        description: data.project.description,
        language: data.project.language,
        createdAt: new Date(projectData.project.createdAt).getTime(),
        updatedAt: new Date(projectData.project.updatedAt).getTime(),
      };
      addProject(newProject);

      // Redirect to project page
      router.push(`/dashboard/projects/${projectId}`);
    } catch (error) {
      console.error("Local import error:", error);
      setLocalError(error instanceof Error ? error.message : "Failed to import local folder");
      setIsImportingLocal(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        {/* Header with Back Button */}
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
            Import Project
          </h1>
          <p className="text-gray-400 text-lg">
            Import an existing project into Buildwithme from GitHub or your local folder.
          </p>
        </header>

        {/* Import Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import from GitHub */}
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Import from GitHub</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Import a public GitHub repository. Only public repositories are supported.
            </p>
            
            <form onSubmit={handleGitHubImport} className="space-y-4">
              <div>
                <label htmlFor="github-url" className="block text-sm font-medium text-gray-300 mb-2">
                  Repository URL
                </label>
                <input
                  id="github-url"
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  required
                  disabled={isImportingGitHub}
                />
              </div>
              
              <div>
                <label htmlFor="github-branch" className="block text-sm font-medium text-gray-300 mb-2">
                  Branch <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  id="github-branch"
                  type="text"
                  value={githubBranch}
                  onChange={(e) => setGithubBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                  disabled={isImportingGitHub}
                />
              </div>

              {githubError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {githubError}
                </div>
              )}

              <button
                type="submit"
                disabled={isImportingGitHub}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImportingGitHub ? "Importing..." : "Import from GitHub"}
              </button>
            </form>
          </div>

          {/* Import from Local Folder */}
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Import from Local Folder</h2>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Upload a local project folder from your system.
            </p>
            
            <form onSubmit={handleLocalImport} className="space-y-4">
              <div>
                <label htmlFor="local-folder" className="block text-sm font-medium text-gray-300 mb-2">
                  Select Folder
                </label>
                <input
                  id="local-folder"
                  type="file"
                  webkitdirectory=""
                  directory=""
                  onChange={handleLocalFolderChange}
                  className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-400 file:cursor-pointer"
                  disabled={isImportingLocal}
                />
                {fileCount > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    {fileCount} files selected • {formatFileSize(totalSize)}
                  </div>
                )}
              </div>

              {localError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                  {localError}
                </div>
              )}

              <button
                type="submit"
                disabled={isImportingLocal || !localFiles || localFiles.length === 0}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImportingLocal ? "Importing..." : "Import from Local Folder"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
