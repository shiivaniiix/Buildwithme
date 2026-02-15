"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getSortedProjects, addProject, updateProject, deleteProject, type Project } from "@/lib/projects";
import { deriveActivities, deriveSkills, formatTimeAgo, type Activity } from "@/lib/dashboardUtils";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  // Derive activities and skills from projects
  const activities = useMemo(() => deriveActivities(projects), [projects]);
  const skills = useMemo(() => deriveSkills(projects), [projects]);

  useEffect(() => {
    setProjects(getSortedProjects());
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName.trim(),
      description: projectDescription.trim() || undefined,
    };

    addProject(newProject);
    setProjects(getSortedProjects());
    setProjectName("");
    setProjectDescription("");
    setIsModalOpen(false);
  };

  const handleStartEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
    setEditingDescription(project.description || "");
  };

  const handleSaveEdit = (projectId: string) => {
    if (!editingName.trim()) return;
    
    updateProject(projectId, {
      name: editingName.trim(),
      description: editingDescription.trim() || undefined,
    });
    setProjects(getSortedProjects());
    setEditingProjectId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setEditingName("");
    setEditingDescription("");
  };

  const handleDeleteClick = (projectId: string) => {
    setDeleteProjectId(projectId);
  };

  const handleConfirmDelete = () => {
    if (deleteProjectId) {
      deleteProject(deleteProjectId);
      setProjects(getSortedProjects());
      setDeleteProjectId(null);
    }
  };

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "project_started":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case "project_updated":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case "project_opened":
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
    }
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Welcome to your workspace
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Section */}
          <section className="lg:col-span-2">
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Projects</h2>
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/share-project"
                    className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    Share
                  </Link>
                  <Link
                    href="/dashboard/import-project"
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity text-sm"
                  >
                    Import Project
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div className="glass rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-2 text-cyan-400">My Projects</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      Your projects will appear here
                    </p>
                    <div className="text-gray-500 text-sm">
                      No projects yet. Create your first project to get started.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <div
                        key={project.id}
                        className="glass rounded-xl p-6 border border-gray-700 hover:border-cyan-400 transition-colors"
                      >
                        {editingProjectId === project.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                              placeholder="Project name"
                            />
                            <textarea
                              value={editingDescription}
                              onChange={(e) => setEditingDescription(e.target.value)}
                              className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                              placeholder="Project description"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveEdit(project.id)}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-start justify-between mb-2">
                              <Link
                                href={`/dashboard/projects/${project.id}`}
                                className="flex-1 group"
                              >
                                <h3 className="text-lg font-semibold text-cyan-400 group-hover:text-cyan-300 transition-colors">
                                  {project.name}
                                </h3>
                              </Link>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleStartEdit(project)}
                                  className="p-2 text-gray-400 hover:text-cyan-400 transition-colors"
                                  title="Edit project"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(project.id)}
                                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                  title="Delete project"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            {project.description && (
                              <p className="text-gray-400 text-sm mb-2">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Last opened: {project.lastOpenedAt ? formatTimeAgo(project.lastOpenedAt) : "Never"}</span>
                              {project.updatedAt && (
                                <span>Updated: {formatTimeAgo(project.updatedAt)}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full px-4 py-3 glass rounded-xl border border-gray-600 text-cyan-400 hover:border-cyan-400 transition-colors text-center"
                >
                  + New Project
                </button>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Recent Activity */}
            <section>
              <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                <h2 className="text-2xl font-bold mb-6 text-white">Recent Activity</h2>
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No recent activity yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.slice(0, 10).map((activity, index) => (
                      <div key={activity.id} className="relative">
                        {index < Math.min(activities.length, 10) - 1 && (
                          <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-gray-700"></div>
                        )}
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            activity.type === "project_started" ? "bg-blue-500/20 text-blue-400" :
                            activity.type === "project_updated" ? "bg-cyan-500/20 text-cyan-400" :
                            "bg-purple-500/20 text-purple-400"
                          }`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white mb-1">{activity.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatTimeAgo(activity.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Skills Section */}
            <section>
              <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                <h2 className="text-2xl font-bold mb-6 text-white">Skills</h2>
                {skills.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">
                      No skills detected yet. Start coding to build your skill profile!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Skills are automatically detected from your projects and code
                    </p>
                  </>
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>

      <Footer />

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-6 text-white">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  id="project-description"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none"
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProjectName("");
                    setProjectDescription("");
                  }}
                  className="flex-1 px-4 py-2 glass rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl max-w-md w-full mx-4 border border-red-500/30">
            <h2 className="text-2xl font-bold mb-2 text-white">Delete Project</h2>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setDeleteProjectId(null)}
                className="flex-1 px-4 py-2 glass rounded-lg border border-gray-600 text-gray-300 hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
