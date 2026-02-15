"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { createNote, type NoteType } from "@/lib/notes";
import { getProjects } from "@/lib/projects";

type NoteMode = "select" | "manual" | "ai-learn" | "ai-project";

const topics = ["Python", "C++", "Java", "MySQL"];
const difficultyLevels = ["Beginner", "Intermediate", "Advanced"];

export default function TakeNotesPage() {
  const router = useRouter();
  const [mode, setMode] = useState<NoteMode>("select");
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // AI Learn states
  const [selectedTopic, setSelectedTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");

  // AI Project states
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [question, setQuestion] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load projects for dropdown
    const allProjects = getProjects();
    setProjects(allProjects.map((p) => ({ id: p.id, name: p.name })));
  }, []);

  const handleSelectMode = (selectedMode: NoteMode) => {
    if (selectedMode !== "select") {
      setMode(selectedMode);
      // Reset form states
      setTitle("");
      setContent("");
      setTags([]);
      setTagInput("");
      setSelectedTopic("");
      setSubTopic("");
      setDifficulty("Beginner");
      setSelectedProjectId("");
      setQuestion("");
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    
    // Mock AI generation (replace with real API later)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let generatedContent = "";
    
    if (mode === "ai-learn") {
      generatedContent = `# ${selectedTopic}${subTopic ? ` - ${subTopic}` : ""}\n\n**Difficulty:** ${difficulty}\n\n## Overview\n\nThis is a generated note about ${selectedTopic}${subTopic ? ` focusing on ${subTopic}` : ""}.\n\n## Key Concepts\n\n- Concept 1\n- Concept 2\n- Concept 3\n\n## Examples\n\n\`\`\`\n// Example code here\n\`\`\`\n\n## Summary\n\nGenerated content for learning ${selectedTopic} at ${difficulty} level.`;
    } else if (mode === "ai-project") {
      const projectName = projects.find((p) => p.id === selectedProjectId)?.name || "the project";
      generatedContent = `# Notes: ${question || "Understanding the project"}\n\n**Project:** ${projectName}\n\n## Context\n\nThis note was generated based on your question about ${projectName}.\n\n## Explanation\n\nBased on the project context, here's what you need to understand:\n\n- Point 1\n- Point 2\n- Point 3\n\n## Code Insights\n\n\`\`\`\n// Relevant code snippets\n\`\`\`\n\n## Next Steps\n\nConsider exploring these areas further.`;
    }
    
    setContent(generatedContent);
    if (!title) {
      setTitle(mode === "ai-learn" 
        ? `${selectedTopic}${subTopic ? ` - ${subTopic}` : ""} Notes`
        : `Project Notes: ${question || "Understanding the project"}`);
    }
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in title and content");
      return;
    }

    setIsSaving(true);

    try {
      let noteType: NoteType;
      let topic: string | undefined;
      let projectId: string | undefined;

      if (mode === "manual") {
        noteType = "manual";
      } else if (mode === "ai-learn") {
        noteType = "ai-learn";
        topic = selectedTopic;
      } else {
        noteType = "ai-project";
        projectId = selectedProjectId || undefined;
      }

      createNote({
        userId: "user_default", // Should come from auth context
        title: title.trim(),
        content: content.trim(),
        type: noteType,
        topic,
        projectId,
        tags,
      });

      router.push("/learn/notes");
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <Navbar />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        {/* Header with Back Button */}
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Take Notes
          </h1>
        </header>

        {/* Mode Selection */}
        {mode === "select" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => handleSelectMode("manual")}
              className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-gray-700 hover:border-cyan-400 transition-colors text-left group"
            >
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Write manually
              </h3>
              <p className="text-gray-400 text-sm">
                Create notes by writing everything yourself
              </p>
            </button>

            <button
              onClick={() => handleSelectMode("ai-learn")}
              className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-gray-700 hover:border-cyan-400 transition-colors text-left group"
            >
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Generate using AI (from Learn topic)
              </h3>
              <p className="text-gray-400 text-sm">
                AI creates notes based on a learning topic
              </p>
            </button>

            <button
              onClick={() => handleSelectMode("ai-project")}
              className="glass-strong rounded-2xl p-8 shadow-soft-xl border border-gray-700 hover:border-cyan-400 transition-colors text-left group"
            >
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                Generate using AI (from Project)
              </h3>
              <p className="text-gray-400 text-sm">
                AI creates notes from your project context
              </p>
            </button>
          </div>
        )}

        {/* Manual Note Form */}
        {mode === "manual" && (
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Manual Note</h2>
              <button
                onClick={() => setMode("select")}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Enter note title"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Content <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  placeholder="Write your note content here (markdown supported)"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Tags (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Note"}
                </button>
                <button
                  onClick={() => setMode("select")}
                  className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Learn Form */}
        {mode === "ai-learn" && (
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">AI Note from Learn Topic</h2>
              <button
                onClick={() => setMode("select")}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Topic <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">Select a topic</option>
                  {topics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Sub-topic (optional)</label>
                <input
                  type="text"
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  placeholder="e.g., Functions, Classes, Loops"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  {difficultyLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Tags (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !selectedTopic}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Note"}
              </button>

              {content && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Generated Content (editable)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !title.trim() || !content.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Note"}
                    </button>
                    <button
                      onClick={() => setMode("select")}
                      className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Project Form */}
        {mode === "ai-project" && (
          <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">AI Note from Project</h2>
              <button
                onClick={() => setMode("select")}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Project (optional)</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="">No project selected (general question)</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  What do you want to understand?
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                  placeholder="Describe what you'd like to learn or understand..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Tags (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                    placeholder="Add a tag and press Enter"
                  />
                  <button
                    onClick={handleAddTag}
                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm flex items-center gap-2"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "Generating..." : "Generate Note"}
              </button>

              {content && (
                <div>
                  <label className="block text-white font-medium mb-2">
                    Generated Content (editable)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-400 font-mono text-sm"
                  />
                  <div className="mt-4 flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !title.trim() || !content.trim()}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Saving..." : "Save Note"}
                    </button>
                    <button
                      onClick={() => setMode("select")}
                      className="px-6 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
