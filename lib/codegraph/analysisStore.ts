/**
 * ProjectAnalysis Store
 * 
 * Manages persistent storage of project analyses.
 * Uses localStorage with database-ready structure.
 */

import type { ProjectAnalysis } from "./models";

export type { ProjectAnalysis };

const STORAGE_KEY = "buildwithme-codegraph-analyses";

/**
 * Get current user ID (matches existing pattern from projects.ts)
 */
function getCurrentUserId(): string {
  return "user_default"; // TODO: Integrate with auth system
}

/**
 * Get all analyses for current user
 */
export function getAnalyses(): ProjectAnalysis[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  const allAnalyses: ProjectAnalysis[] = JSON.parse(stored);
  const userId = getCurrentUserId();
  return allAnalyses.filter(a => a.userId === userId);
}

/**
 * Get analysis by projectId for current user
 */
export function getAnalysisByProjectId(projectId: string): ProjectAnalysis | undefined {
  const analyses = getAnalyses();
  return analyses.find(a => a.projectId === projectId);
}

/**
 * Get analysis by ID (with userId validation)
 */
export function getAnalysisById(analysisId: string): ProjectAnalysis | undefined {
  const analyses = getAnalyses();
  const userId = getCurrentUserId();
  const analysis = analyses.find(a => a.id === analysisId);
  if (analysis && analysis.userId === userId) {
    return analysis;
  }
  return undefined;
}

/**
 * Save or update analysis
 */
export function saveAnalysis(analysis: Omit<ProjectAnalysis, "id" | "userId" | "createdAt" | "updatedAt">): ProjectAnalysis {
  // Ensure displayName and sourceType are provided (backward compatibility)
  const analysisWithDefaults = {
    ...analysis,
    displayName: analysis.displayName || analysis.projectId,
    sourceType: analysis.sourceType || "internal",
  };
  if (typeof window === "undefined") {
    throw new Error("Cannot save analysis on server side");
  }

  const userId = getCurrentUserId();
  const stored = localStorage.getItem(STORAGE_KEY);
  const allAnalyses: ProjectAnalysis[] = stored ? JSON.parse(stored) : [];

  // Check if analysis exists for this project and user
  const existingIndex = allAnalyses.findIndex(
    a => a.projectId === analysis.projectId && a.userId === userId
  );

  const now = Date.now();
  let savedAnalysis: ProjectAnalysis;

  if (existingIndex >= 0) {
    // Update existing
    savedAnalysis = {
      ...allAnalyses[existingIndex],
      ...analysisWithDefaults,
      userId,
      updatedAt: now,
    };
    allAnalyses[existingIndex] = savedAnalysis;
  } else {
    // Create new
    savedAnalysis = {
      id: `analysis-${now}`,
      ...analysisWithDefaults,
      userId,
      createdAt: now,
      updatedAt: now,
    };
    allAnalyses.push(savedAnalysis);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(allAnalyses));
  return savedAnalysis;
}

/**
 * Delete analysis (with userId validation)
 */
export function deleteAnalysis(analysisId: string): boolean {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return false;

  const allAnalyses: ProjectAnalysis[] = JSON.parse(stored);
  const userId = getCurrentUserId();
  const filtered = allAnalyses.filter(a => !(a.id === analysisId && a.userId === userId));

  if (filtered.length < allAnalyses.length) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
  return false;
}

