"use client";

import { useState, useEffect, useRef } from "react";
import type { CodeGraph } from "@/lib/codegraph/graphTypes";
import { getSortedProjects, type Project } from "@/lib/projects";
import { getProjectFiles } from "@/lib/projectFiles";
import { getAnalysisByProjectId, saveAnalysis } from "@/lib/codegraph/analysisStore";
import type { ProjectAnalysis } from "@/lib/codegraph/analysisStore";
import { getSessionsByAnalysisId, createChatSession, getMessagesBySessionId, addMessage } from "@/lib/codegraph/chatStore";
import type { ChatSession } from "@/lib/codegraph/chatStore";

type SourceType = "internal" | "github" | "local";

export default function CodeGraphPage() {
  const [sourceType, setSourceType] = useState<SourceType>("internal");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [localFiles, setLocalFiles] = useState<FileList | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string>("");
  const [graph, setGraph] = useState<CodeGraph | null>(null);
  const [fileSummaries, setFileSummaries] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<string | null>(null);
  const [architectureExplanation, setArchitectureExplanation] = useState<string | null>(null);
  const [technologies, setTechnologies] = useState<Array<{ name: string; description: string; deepLink: string }>>([]);
  const [isExplaining, setIsExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{ id: string; role: "user" | "assistant"; content: string; createdAt: Date }>>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<ProjectAnalysis | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [analyses, setAnalyses] = useState<ProjectAnalysis[]>([]);
  const [forceReanalyze, setForceReanalyze] = useState(false);

  // Load projects and analyses on mount
  useEffect(() => {
    const loadedProjects = getSortedProjects();
    setProjects(loadedProjects);
    const loadedAnalyses = getAnalysisByProjectId ? (() => {
      const allAnalyses: ProjectAnalysis[] = [];
      loadedProjects.forEach(project => {
        const analysis = getAnalysisByProjectId(project.id);
        if (analysis) allAnalyses.push(analysis);
      });
      return allAnalyses;
    })() : [];
    setAnalyses(loadedAnalyses);
  }, []);

  const handleSourceChange = (source: SourceType) => {
    setSourceType(source);
    // Clear all state when changing source
    setSelectedProjectId("");
    setGithubUrl("");
    setLocalFiles(null);
    setCurrentProjectId("");
    setGraph(null);
    setFileSummaries({});
    setSummary(null);
    setArchitectureExplanation(null);
    setTechnologies([]);
    setMessages([]);
    setQuestion("");
    setAnalysisError(null);
    setExplainError(null);
    setAskError(null);
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    // Clear previous analysis when selecting new project
    setCurrentProjectId("");
    setGraph(null);
    setFileSummaries({});
    setSummary(null);
    setArchitectureExplanation(null);
    setTechnologies([]);
    setMessages([]);
    setQuestion("");
    setAnalysisError(null);
    setExplainError(null);
    setAskError(null);
    setCurrentAnalysis(null);
    setCurrentSession(null);
    setSessions([]);
    setForceReanalyze(false);

    // Check for existing analysis
    if (!forceReanalyze) {
      const existingAnalysis = getAnalysisByProjectId(projectId);
      if (existingAnalysis) {
        setCurrentAnalysis(existingAnalysis);
        setGraph(existingAnalysis.fileGraph);
        setFileSummaries(existingAnalysis.fileSummaries);
        setSummary(existingAnalysis.summaryText);
        setArchitectureExplanation(existingAnalysis.architectureExplanation);
        setTechnologies(existingAnalysis.technologies);
        setCurrentProjectId(projectId);
        
        // Load sessions for this analysis
        const analysisSessions = getSessionsByAnalysisId(existingAnalysis.id);
        setSessions(analysisSessions);
      }
    }
  };

  const handleLocalFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setLocalFiles(files);
    // Clear previous analysis
    setGraph(null);
    setSummary(null);
    setArchitectureExplanation(null);
    setTechnologies([]);
    setMessages([]);
    setAnalysisError(null);
  };

  const handleAnalyze = async () => {
    let filePaths: string[] = [];
    let projectIdForAnalysis = "";

    // Handle different source types
    if (sourceType === "internal") {
      if (!selectedProjectId.trim()) {
        setAnalysisError("Please select a project");
        return;
      }

      // Load project files
      const projectFiles = getProjectFiles(selectedProjectId);
      if (projectFiles.length === 0) {
        setAnalysisError("Selected project has no files");
        return;
      }

      // Extract file paths (just file names, not content)
      filePaths = projectFiles
        .filter(file => !file.isFolder) // Exclude folders
        .map(file => file.name);
      projectIdForAnalysis = selectedProjectId;
    } else if (sourceType === "github") {
      if (!githubUrl.trim()) {
        setAnalysisError("Please enter a GitHub repository URL");
        return;
      }

      setIsAnalyzing(true);
      setAnalysisError(null);
      setGraph(null);
      setSummary(null);
      setArchitectureExplanation(null);
      setTechnologies([]);
      setMessages([]);

      try {
        // Import from GitHub
        const importResponse = await fetch("/api/import/github", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: githubUrl.trim() }),
        });

        if (!importResponse.ok) {
          const error = await importResponse.json();
          throw new Error(error.error || "Failed to import from GitHub");
        }

        const importData = await importResponse.json();
        // Extract file paths from response
        filePaths = importData.filePaths || importData.project.files.map((file: { name: string; content: string }) => file.name);
        const fileSummaries = importData.fileSummaries || {};
        projectIdForAnalysis = `github-${Date.now()}`;
        
        // Send to analyze endpoint with file summaries
        const analyzeResponse = await fetch("/api/codegraph/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            projectId: projectIdForAnalysis, 
            files: filePaths,
            fileSummaries 
          }),
        });

        if (!analyzeResponse.ok) {
          const error = await analyzeResponse.json();
          throw new Error(error.error || "Failed to analyze project");
        }

        const analyzeData = await analyzeResponse.json();
        setGraph(analyzeData.graph);
        setCurrentProjectId(projectIdForAnalysis);
        setFileSummaries(fileSummaries);

        // Automatically fetch explanation with file summaries
        await handleExplain(analyzeData.graph, fileSummaries);
        
        // Save analysis after explanation (will be done in handleExplain completion)
        setIsAnalyzing(false);
        return;
      } catch (error) {
        setAnalysisError(error instanceof Error ? error.message : "Unknown error");
        setIsAnalyzing(false);
        return;
      }
    } else if (sourceType === "local") {
      if (!localFiles || localFiles.length === 0) {
        setAnalysisError("Please select a folder");
        return;
      }

      // Extract relative paths from FileList
      filePaths = Array.from(localFiles).map(file => {
        // Get relative path from webkitRelativePath
        const relativePath = (file as any).webkitRelativePath || file.name;
        return relativePath;
      });
      projectIdForAnalysis = `local-${Date.now()}`;
    }

    if (filePaths.length === 0) {
      setAnalysisError("No files found to analyze");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setGraph(null);
    setFileSummaries({});
    setSummary(null);
    setArchitectureExplanation(null);
    setTechnologies([]);
    setMessages([]);
    setQuestion("");

    try {
      // Check for existing analysis (only for internal projects, not if force reanalyze)
      if (sourceType === "internal" && !forceReanalyze) {
        const existingAnalysis = getAnalysisByProjectId(projectIdForAnalysis);
        if (existingAnalysis) {
          setCurrentAnalysis(existingAnalysis);
          setGraph(existingAnalysis.fileGraph);
          setFileSummaries(existingAnalysis.fileSummaries);
          setSummary(existingAnalysis.summaryText);
          setArchitectureExplanation(existingAnalysis.architectureExplanation);
          setTechnologies(existingAnalysis.technologies);
          setCurrentProjectId(projectIdForAnalysis);
          
          // Load sessions
          const analysisSessions = getSessionsByAnalysisId(existingAnalysis.id);
          setSessions(analysisSessions);
          
          setIsAnalyzing(false);
          return;
        }
      }

      // Run new analysis
      const response = await fetch("/api/codegraph/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projectIdForAnalysis, files: filePaths }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze project");
      }

      const data = await response.json();
      setGraph(data.graph);
      setCurrentProjectId(projectIdForAnalysis);
      setFileSummaries(data.fileSummaries || {});

      // Automatically fetch explanation
      await handleExplain(data.graph, data.fileSummaries);
      
      // Save analysis after explanation is complete
      if (summary && architectureExplanation && technologies.length > 0) {
        const savedAnalysis = saveAnalysis({
          projectId: projectIdForAnalysis,
          fileGraph: data.graph,
          fileSummaries: data.fileSummaries || {},
          technologies,
          summaryText: summary,
          architectureExplanation,
        });
        setCurrentAnalysis(savedAnalysis);
        
        // Load sessions
        const analysisSessions = getSessionsByAnalysisId(savedAnalysis.id);
        setSessions(analysisSessions);
      }
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExplain = async (graphToExplain?: CodeGraph, fileSummaries?: Record<string, string>) => {
    const graphToUse = graphToExplain || graph;
    if (!graphToUse || !currentProjectId) return;

    setIsExplaining(true);
    setExplainError(null);

    try {
      const response = await fetch("/api/codegraph/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          projectId: currentProjectId, 
          graph: graphToUse,
          fileSummaries: fileSummaries || {}
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to explain graph");
      }

      const data = await response.json();
      setSummary(data.summary);
      setArchitectureExplanation(data.architectureExplanation);
      setTechnologies(data.technologies || []);
      
      // Save analysis if we have all data
      if (currentProjectId && graph && data.summary && data.architectureExplanation) {
        const savedAnalysis = saveAnalysis({
          projectId: currentProjectId,
          fileGraph: graph,
          fileSummaries: fileSummaries || {},
          technologies: data.technologies || [],
          summaryText: data.summary,
          architectureExplanation: data.architectureExplanation,
        });
        setCurrentAnalysis(savedAnalysis);
        
        // Load sessions
        const analysisSessions = getSessionsByAnalysisId(savedAnalysis.id);
        setSessions(analysisSessions);
      }
    } catch (error) {
      setExplainError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsExplaining(false);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAsk = async () => {
    if (!question.trim()) {
      setAskError("Question is required");
      return;
    }

    if (!graph || !currentProjectId || !currentAnalysis) {
      setAskError("Please analyze a project first");
      return;
    }

    // Ensure we have a session
    let session = currentSession;
    if (!session) {
      session = createChatSession(currentAnalysis.id);
      setCurrentSession(session);
      setSessions(prev => [...prev, session!]);
    }

    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user" as const,
      content: question.trim(),
      createdAt: new Date(),
    };

    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Save user message to store
    addMessage(session.id, "user", userMessage.content);
    
    setQuestion("");
    setIsAsking(true);
    setAskError(null);

    try {
      const response = await fetch("/api/codegraph/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          projectId: currentProjectId,
          graph,
          fileSummaries: fileSummaries,
          messages: messages.map(m => ({ role: m.role, content: m.content })), // Convert to simple format
          newQuestion: userMessage.content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to get answer");
      }

      const data = await response.json();
      const assistantMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant" as const,
        content: data.reply,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message to store
      addMessage(session.id, "assistant", assistantMessage.content);
    } catch (error) {
      setAskError(error instanceof Error ? error.message : "Unknown error");
      // Remove user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsAsking(false);
    }
  };

  const handleNewChat = () => {
    if (!currentAnalysis) return;
    const newSession = createChatSession(currentAnalysis.id);
    setCurrentSession(newSession);
    setSessions(prev => [...prev, newSession]);
    setMessages([]);
    setQuestion("");
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      const sessionMessages = getMessagesBySessionId(sessionId, 20);
      setMessages(sessionMessages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: new Date(m.createdAt),
      })));
    }
  };

  const handleReanalyze = () => {
    setForceReanalyze(true);
    if (selectedProjectId) {
      handleAnalyze();
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
      <div className="relative z-10 flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden border-r border-gray-800 bg-gray-900/50`}>
          <div className="h-screen overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Projects</h2>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white"
              >
                {sidebarOpen ? "←" : "→"}
              </button>
            </div>
            
            {analyses.length === 0 ? (
              <p className="text-gray-500 text-sm">No analyzed projects yet</p>
            ) : (
              <div className="space-y-2">
                {analyses.map(analysis => {
                  const project = projects.find(p => p.id === analysis.projectId);
                  const projectSessions = sessions.filter(s => s.projectAnalysisId === analysis.id);
                  return (
                    <div key={analysis.id} className="glass rounded-lg p-3 border border-gray-700">
                      <div className="font-semibold text-white text-sm mb-2">{project?.name || analysis.projectId}</div>
                      <button
                        onClick={() => {
                          if (project) handleProjectSelect(project.id);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 mb-2 block"
                      >
                        Load Analysis
                      </button>
                      <button
                        onClick={handleReanalyze}
                        className="text-xs text-yellow-400 hover:text-yellow-300 mb-2 block"
                      >
                        Re-analyze
                      </button>
                      {projectSessions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {projectSessions.map(session => (
                            <button
                              key={session.id}
                              onClick={() => handleSelectSession(session.id)}
                              className={`text-xs block w-full text-left px-2 py-1 rounded ${
                                currentSession?.id === session.id
                                  ? "bg-cyan-500/20 text-cyan-300"
                                  : "text-gray-400 hover:text-gray-300"
                              }`}
                            >
                              {session.title}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={handleNewChat}
                        className="text-xs text-green-400 hover:text-green-300 mt-2 block"
                      >
                        + New Chat
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto px-6 py-32">
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
                {/* Source Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Source</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value="internal"
                        checked={sourceType === "internal"}
                        onChange={(e) => handleSourceChange(e.target.value as SourceType)}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-2"
                      />
                      <span className="text-gray-300">Internal Project</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value="github"
                        checked={sourceType === "github"}
                        onChange={(e) => handleSourceChange(e.target.value as SourceType)}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-2"
                      />
                      <span className="text-gray-300">GitHub Repository</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value="local"
                        checked={sourceType === "local"}
                        onChange={(e) => handleSourceChange(e.target.value as SourceType)}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 focus:ring-2"
                      />
                      <span className="text-gray-300">Local Folder</span>
                    </label>
                  </div>
                </div>

                {/* Internal Project Mode */}
                {sourceType === "internal" && (
                  <div>
                    <label htmlFor="project-select" className="block text-sm font-medium text-gray-300 mb-2">Select Project</label>
                    <select
                      id="project-select"
                      value={selectedProjectId}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white bg-gray-900/50 focus:border-cyan-400 focus:outline-none"
                    >
                      <option value="" className="text-white bg-gray-900">-- Select a project --</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id} className="text-white bg-gray-900">{project.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* GitHub Mode */}
                {sourceType === "github" && (
                  <div>
                    <label htmlFor="github-url" className="block text-sm font-medium text-gray-300 mb-2">GitHub Repository URL</label>
                    <input
                      id="github-url"
                      type="text"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                      placeholder="https://github.com/user/repo"
                    />
                  </div>
                )}

                {/* Local Folder Mode */}
                {sourceType === "local" && (
                  <div>
                    <label htmlFor="local-folder" className="block text-sm font-medium text-gray-300 mb-2">Select Folder</label>
                    <input
                      id="local-folder"
                      type="file"
                      {...({ webkitdirectory: "" } as any)}
                      multiple
                      onChange={handleLocalFolderSelect}
                      className="w-full px-4 py-2 glass rounded-lg border border-gray-600 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-white hover:file:bg-cyan-600 focus:border-cyan-400 focus:outline-none"
                    />
                    {localFiles && localFiles.length > 0 && (
                      <p className="mt-2 text-sm text-gray-400">{localFiles.length} file(s) selected</p>
                    )}
                  </div>
                )}

                {analysisError && <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{analysisError}</div>}

                <button
                  onClick={handleAnalyze}
                  disabled={
                    isAnalyzing ||
                    (sourceType === "internal" && !selectedProjectId) ||
                    (sourceType === "github" && !githubUrl.trim()) ||
                    (sourceType === "local" && (!localFiles || localFiles.length === 0))
                  }
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

              {/* Chat Section */}
              <section className="lg:col-span-2">
                <div className="glass-strong rounded-2xl p-8 shadow-soft-xl">
                  <h2 className="text-2xl font-bold mb-6 text-white">Chat About This Project</h2>
                  
                  <div className="space-y-4">
                    {/* Chat Messages */}
                    <div className="glass rounded-lg border border-gray-700 h-96 overflow-y-auto ide-scrollbar p-4 space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-gray-500 text-sm text-center py-8">
                          Start a conversation about this project...
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === "user"
                                  ? "bg-cyan-500/20 border border-cyan-500/30 text-white"
                                  : "bg-gray-700/50 border border-gray-600 text-gray-200"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                      {isAsking && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3">
                            <p className="text-sm text-gray-400">Thinking...</p>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {askError && <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">{askError}</div>}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                        className="flex-1 px-4 py-2 glass rounded-lg border border-gray-600 text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none"
                        placeholder="Ask a question about the project..."
                        disabled={isAsking}
                      />
                      <button
                        onClick={handleAsk}
                        disabled={isAsking || !question.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAsking ? "..." : "Send"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
