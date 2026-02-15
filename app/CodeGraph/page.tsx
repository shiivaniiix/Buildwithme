"use client";

import { useState } from "react";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";

export default function CodeGraphPage() {
  const [projectId, setProjectId] = useState("");
  const [filePaths, setFilePaths] = useState("");
  const [graph, setGraph] = useState<CodeGraph | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [architectureExplanation, setArchitectureExplanation] = useState<string | null>(null);
  const [technologies, setTechnologies] = useState<Array<{ name: string; description: string; deepLink: string }>>([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!projectId.trim()) {
      setAnalysisError("Project ID is required");
      return;
    }

    const files = filePaths
      .split("\n")
      .map(f => f.trim())
      .filter(f => f.length > 0);

    if (files.length === 0) {
      setAnalysisError("At least one file path is required");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setGraph(null);
    setSummary(null);
    setArchitectureExplanation(null);
    setTechnologies([]);
    setAnswer(null);

    try {
      const response = await fetch("/api/codegraph/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectId.trim(), files }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze project");
      }

      const data = await response.json();
      setGraph(data.graph);

      // Automatically fetch explanation
      await handleExplain(data.graph);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExplain = async (graphToExplain?: CodeGraph) => {
    const graphToUse = graphToExplain || graph;
    if (!graphToUse || !projectId.trim()) return;

    setIsExplaining(true);
    setExplainError(null);

    try {
      const response = await fetch("/api/codegraph/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectId.trim(), graph: graphToUse }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to explain graph");
      }

      const data = await response.json();
      setSummary(data.summary);
      setArchitectureExplanation(data.architectureExplanation);
      setTechnologies(data.technologies || []);
    } catch (error) {
      setExplainError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsExplaining(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setAskError("Question is required");
      return;
    }

    if (!graph || !projectId.trim()) {
      setAskError("Please analyze a project first");
      return;
    }

    setIsAsking(true);
    setAskError(null);

    try {
      const response = await fetch("/api/codegraph/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: projectId.trim(),
          graph,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get answer");
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (error) {
      setAskError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsAsking(false);
    }
  };

  // Build structure tree from graph
  const buildStructureTree = () => {
    if (!graph) return null;
    const folderMap = new Map<string, { name: string; files: string[]; folders: string[] }>();
    const rootFiles: string[] = [];
    graph.nodes.forEach(node => {
      if (node.type === "folder") folderMap.set(node.path, { name: node.name, files: [], folders: [] });
    });
    graph.edges.forEach(edge => {
      const fromNode = graph.nodes.find(n => n.id === edge.from);
      const toNode = graph.nodes.find(n => n.id === edge.to);
      if (fromNode && toNode && edge.type === "contains") {
        if (toNode.type === "file") {
          const folder = folderMap.get(fromNode.path);
          if (folder) folder.files.push(toNode.name);
          else if (fromNode.path === "" || fromNode.name === "root") rootFiles.push(toNode.name);
        } else if (toNode.type === "folder") {
          const parentFolder = folderMap.get(fromNode.path);
          if (parentFolder) parentFolder.folders.push(toNode.path);
        }
      }
    });
    const renderFolder = (folderPath: string, level: number = 0): JSX.Element => {
      const folder = folderMap.get(folderPath);
      if (!folder) return <></>;
      return (
        <div key={folderPath} style={{ marginLeft: `${level * 20}px` }}>
          <div className="text-cyan-400 font-medium mb-1">📁 {folder.name}</div>
          {folder.folders.map(subFolder => renderFolder(subFolder, level + 1))}
          {folder.files.map(file => (
            <div key={file} style={{ marginLeft: `${(level + 1) * 20}px` }} className="text-gray-300 text-sm mb-1">
              📄 {file}
            </div>
          ))}
        </div>
      );
    };
    const rootFolders = Array.from(folderMap.keys()).filter(path => {
      const node = graph.nodes.find(n => n.path === path && n.type === "folder");
      if (!node) return false;
      return !graph.edges.some(e => {
        const fromNode = graph.nodes.find(n => n.id === e.from);
        return fromNode && fromNode.path !== "" && fromNode.name !== "root" && e.to === node.id;
      });
    });
    return (
      <div className="space-y-2">
        {rootFiles.length > 0 && rootFiles.map(file => (
          <div key={file} className="text-gray-300 text-sm mb-1">📄 {file}</div>
        ))}
        {rootFolders.map(folderPath => renderFolder(folderPath, 0))}
      </div>
    );
  };

  return (
    <main className="min-h-screen code-pattern relative">
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">CodeGraph</h1>
          <p className="text-gray-400 text-lg">Analyze project structure and get AI-powered insights</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <section className="lg:col-span-2">
            <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
              <h2 className="text-2xl font-bold mb-6 text-white">Analyze Project</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="project-id" className="block text-sm font-medium text-gray-300 mb-2">Project ID</label>
                  <input id="project-id" type="text" value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none" placeholder="Enter project ID" />
                </div>
                <div>
                  <label htmlFor="file-paths" className="block text-sm font-medium text-gray-300 mb-2">File Paths (one per line)</label>
                  <textarea id="file-paths" value={filePaths} onChange={(e) => setFilePaths(e.target.value)} className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none resize-none" placeholder="src/index.js&#10;src/components/App.jsx&#10;package.json" rows={8} />
                </div>

                {analysisError && <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{analysisError}</div>}

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Project"}
                </button>
              </div>
            </div>
          </section>

          {/* Display Section */}
          {graph && (
            <>
              <section>
                <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                  <h2 className="text-2xl font-bold mb-6 text-white">Project Summary</h2>
                  
                  {isExplaining ? (
                    <div className="text-gray-400 text-sm">Generating explanation...</div>
                  ) : explainError ? (
                    <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{explainError}</div>
                  ) : summary ? (
                    <div className="space-y-4">
                      <div><h3 className="text-lg font-semibold text-cyan-400 mb-2">Summary</h3><p className="text-gray-300 text-sm leading-relaxed">{summary}</p></div>
                      <div><h3 className="text-lg font-semibold text-cyan-400 mb-2">Architecture</h3><p className="text-gray-300 text-sm leading-relaxed">{architectureExplanation}</p></div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No explanation available</div>
                  )}
                </div>
              </section>

              <section>
                <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                  <h2 className="text-2xl font-bold mb-6 text-white">Technologies</h2>
                  
                  {technologies.length > 0 ? (
                    <div className="space-y-3">
                      {technologies.map((tech, idx) => (
                        <div key={idx} className="glass rounded-lg p-4 border border-gray-700">
                          <a href={tech.deepLink} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 font-semibold mb-1 block transition-colors">{tech.name} →</a>
                          <p className="text-gray-400 text-sm">{tech.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No technologies detected</div>
                  )}
                </div>
              </section>

              <section className="lg:col-span-2">
                <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                  <h2 className="text-2xl font-bold mb-6 text-white">Project Structure</h2>
                  <div className="glass rounded-lg p-4 border border-gray-700 max-h-96 overflow-y-auto ide-scrollbar">
                    {buildStructureTree() || <div className="text-gray-500 text-sm">No structure data</div>}
                  </div>
                </div>
              </section>

              {/* Q&A Section */}
              <section className="lg:col-span-2">
                <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                  <h2 className="text-2xl font-bold mb-6 text-white">Ask About This Project</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAsk()} className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none" placeholder="Ask a question about the project structure..." />
                    </div>

                    {askError && <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{askError}</div>}

                    <button
                      onClick={handleAsk}
                      disabled={isAsking || !question.trim()}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAsking ? "Asking..." : "Ask AI"}
                    </button>

                    {answer && (
                      <div className="glass rounded-lg p-4 border border-gray-700">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">Answer</h3>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
