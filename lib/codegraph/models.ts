/**
 * CodeGraph Database Models
 * 
 * These models represent the persistent storage structure.
 * Currently using localStorage, but structured for easy database migration.
 */

import type { CodeGraph } from "./graphTypes";

/**
 * ProjectAnalysis - AI snapshot of a project
 */
export interface ProjectAnalysis {
  id: string;
  projectId: string;
  userId: string;
  displayName: string; // User-friendly project name
  sourceType: "github" | "local" | "internal"; // Source of the project
  fileGraph: CodeGraph; // Full graph structure
  fileSummaries: Record<string, string>; // File path -> content summary
  technologies: Array<{ name: string; description: string; deepLink: string }>;
  summaryText: string; // AI-generated summary
  architectureExplanation: string; // AI-generated architecture explanation
  createdAt: number;
  updatedAt: number;
}

/**
 * ChatSession - Conversation session tied to a ProjectAnalysis
 */
export interface ChatSession {
  id: string;
  projectAnalysisId: string;
  userId: string;
  title: string; // Auto-generated from first message or user-set
  createdAt: number;
  updatedAt: number;
}

/**
 * ChatMessage - Individual message in a chat session
 */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

