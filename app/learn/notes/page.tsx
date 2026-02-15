"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getAllNotes, getNotesByType, getNotesByTopic, getNotesByProject, deleteNote, type Note, type NoteType } from "@/lib/notes";
import { getProjects } from "@/lib/projects";

const topics = ["Python", "C++", "Java", "MySQL"];

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(getAllNotes());
  const [filterType, setFilterType] = useState<NoteType | "all">("all");
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterProject, setFilterProject] = useState<string>("all");

  const projects = getProjects();

  const filteredNotes = useMemo(() => {
    let filtered = notes;

    if (filterType !== "all") {
      filtered = getNotesByType(filterType);
    }

    if (filterTopic !== "all") {
      filtered = filtered.filter((note) => note.topic === filterTopic);
    }

    if (filterProject !== "all") {
      filtered = filtered.filter((note) => note.projectId === filterProject);
    }

    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, filterType, filterTopic, filterProject]);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote(id);
      setNotes(getAllNotes());
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTypeLabel = (type: NoteType) => {
    switch (type) {
      case "manual":
        return "Manual";
      case "ai-learn":
        return "AI (Learn)";
      case "ai-project":
        return "AI (Project)";
      default:
        return type;
    }
  };

  const getTypeColor = (type: NoteType) => {
    switch (type) {
      case "manual":
        return "bg-blue-500/20 text-blue-400";
      case "ai-learn":
        return "bg-purple-500/20 text-purple-400";
      case "ai-project":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        {/* Header */}
        <header className="mb-8">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Learn</span>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                My Notes
              </h1>
              <p className="text-gray-400 text-lg">
                All your saved notes in one place
              </p>
            </div>
            <Link
              href="/learn/take_notes"
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Note
            </Link>
          </div>
        </header>

        {/* Filters */}
        <div className="glass-strong rounded-2xl p-6 shadow-soft-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-white font-medium mb-2 text-sm">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NoteType | "all")}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
              >
                <option value="all">All Types</option>
                <option value="manual">Manual</option>
                <option value="ai-learn">AI (Learn)</option>
                <option value="ai-project">AI (Project)</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Filter by Topic</label>
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
              >
                <option value="all">All Topics</option>
                {topics.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-white font-medium mb-2 text-sm">Filter by Project</label>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 text-sm"
              >
                <option value="all">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="glass-strong rounded-2xl p-12 shadow-soft-xl text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-white mb-2">No notes found</h2>
            <p className="text-gray-400 mb-6">
              {notes.length === 0
                ? "Create your first note to get started"
                : "Try adjusting your filters"}
            </p>
            {notes.length === 0 && (
              <Link
                href="/learn/take_notes"
                className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Note
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotes.map((note) => {
              const project = note.projectId
                ? projects.find((p) => p.id === note.projectId)
                : null;

              return (
                <div
                  key={note.id}
                  className="glass-strong rounded-2xl p-6 shadow-soft-xl border border-gray-700 hover:border-cyan-400 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(note.type)}`}
                        >
                          {getTypeLabel(note.type)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(note.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete note"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-2 mb-4">
                    {note.topic && (
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Topic:</span> {note.topic}
                      </div>
                    )}
                    {project && (
                      <div className="text-sm text-gray-400">
                        <span className="font-medium">Project:</span> {project.name}
                      </div>
                    )}
                    <div className="text-sm text-gray-400">
                      {formatDate(note.createdAt)}
                    </div>
                  </div>

                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-gray-400 text-sm line-clamp-3">
                    {note.content.substring(0, 150)}
                    {note.content.length > 150 && "..."}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

