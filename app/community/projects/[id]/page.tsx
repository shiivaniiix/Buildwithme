"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getProjectById, type Project } from "@/lib/projects";
import { getSteps, type Step } from "@/lib/steps";
import { getProjectFiles, getProjectFileById, type CodeFile } from "@/lib/projectFiles";
import CommunityNav from "@/components/CommunityNav";
import CommunityHeader from "@/components/CommunityHeader";

export default function CommunityProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | undefined>(undefined);
  const [steps, setSteps] = useState<Step[]>([]);
  const [projectFiles, setProjectFiles] = useState<CodeFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    const loadedProject = getProjectById(params.id);
    if (!loadedProject) {
      // Project not found - could redirect or show error
      return;
    }

    // Verify project is public/shared
    if (!loadedProject.isPublic && !loadedProject.shared) {
      // Not a public project - could redirect or show error
      return;
    }

    setProject(loadedProject);
    const loadedSteps = getSteps(params.id);
    setSteps(loadedSteps);
    
    const files = getProjectFiles(params.id);
    setProjectFiles(files);
    
    if (files.length > 0) {
      const entryFile = files.find(f => f.isEntry) || files[0];
      setActiveFileId(entryFile.id);
      setCode(entryFile.content);
    }
  }, [params.id]);

  const handleFileClick = (fileId: string) => {
    const file = getProjectFileById(params.id, fileId);
    if (file) {
      setActiveFileId(fileId);
      setCode(file.content);
    }
  };

  if (!project) {
    return (
      <div className="min-h-screen">
        <CommunityHeader />
        <CommunityNav />
        <div className="ml-16 pt-14">
          <div className="px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-400">Project not found or not publicly available.</p>
              <Link href="/community" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
                ← Back to Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <CommunityHeader />
      <CommunityNav />
      <div className="ml-16 pt-14">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                <span className="px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Read-only
                </span>
              </div>
              {project.shareDescription && (
                <p className="text-gray-300 text-sm">{project.shareDescription}</p>
              )}
              {project.description && !project.shareDescription && (
                <p className="text-gray-300 text-sm">{project.description}</p>
              )}
            </div>

            <div className="grid grid-cols-12 gap-6">
              {/* Left Column: Overview & Steps */}
              <div className="col-span-4 space-y-6">
                {/* Overview */}
                <div className="glass rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Overview</h2>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-400">Language:</span>
                      <span className="text-white ml-2 capitalize">{project.language || "Not specified"}</span>
                    </div>
                    {project.entryFile && (
                      <div>
                        <span className="text-gray-400">Entry File:</span>
                        <span className="text-white ml-2">{project.entryFile}</span>
                      </div>
                    )}
                    {project.sharedAt && (
                      <div>
                        <span className="text-gray-400">Shared:</span>
                        <span className="text-white ml-2">
                          {new Date(project.sharedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div>
                        <span className="text-gray-400">Tags:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {project.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Steps */}
                <div className="glass rounded-xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Steps</h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto ide-scrollbar">
                    {steps.length === 0 ? (
                      <p className="text-gray-500 text-sm">No steps defined for this project.</p>
                    ) : (
                      steps.map((step) => (
                        <div
                          key={step.id}
                          className="p-3 rounded-lg border border-gray-700 bg-gray-800/30"
                        >
                          <div className="flex items-start gap-2">
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                              step.status === "done"
                                ? "bg-green-500"
                                : step.status === "blocked"
                                ? "bg-red-500"
                                : "bg-gray-500"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-white mb-1">{step.title}</h3>
                              {step.description && (
                                <p className="text-xs text-gray-400 mb-2">{step.description}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs">
                                <span className={`px-2 py-0.5 rounded ${
                                  step.status === "done"
                                    ? "bg-green-500/20 text-green-400"
                                    : step.status === "blocked"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-gray-500/20 text-gray-400"
                                }`}>
                                  {step.status}
                                </span>
                                {step.difficulty && (
                                  <span className="text-gray-500">
                                    {step.difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Code Workspace */}
              <div className="col-span-8">
                <div className="glass rounded-xl border border-gray-700 flex flex-col h-[calc(100vh-8rem)]">
                  {/* File List */}
                  <div className="border-b border-gray-700 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-sm font-semibold text-white">Files</h3>
                      <span className="text-xs text-gray-500">({projectFiles.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {projectFiles.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => handleFileClick(file.id)}
                          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                            activeFileId === file.id
                              ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                              : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          {file.name}
                          {file.isEntry && (
                            <span className="ml-1.5 text-cyan-400">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code Viewer (Read-only) */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {activeFileId ? (
                      <>
                        <div className="border-b border-gray-700 px-4 py-2 bg-gray-800/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-300">
                              {projectFiles.find(f => f.id === activeFileId)?.name || "Unknown"}
                            </span>
                            <span className="text-xs text-gray-500">Read-only</span>
                          </div>
                        </div>
                        <div className="flex-1 overflow-auto ide-scrollbar">
                          <textarea
                            readOnly
                            value={code}
                            className="w-full h-full p-4 bg-gray-900 text-gray-100 font-mono text-sm resize-none focus:outline-none"
                            style={{ minHeight: "100%" }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-gray-500">
                        <p>No file selected</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






