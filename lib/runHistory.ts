/**
 * Run History Store
 * 
 * Stores execution history for projects.
 * Uses file-based storage for persistence across server restarts.
 * TODO: Replace with database (e.g., PostgreSQL, MongoDB) for production persistence.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export type RunStatus = "success" | "failed";

export interface RunHistory {
  id: string;
  projectId: string;
  language: string;
  entryFile: string;
  status: RunStatus;
  executionTimeMs: number;
  stdout: string;
  stderr: string | null;
  executedAt: number; // Unix timestamp in milliseconds
}

// In-memory cache: projectId -> RunHistory[]
// Synced with file storage
const runHistoryCache = new Map<string, RunHistory[]>();

// Storage file path
const STORAGE_DIR = path.join(os.tmpdir(), "buildwithme-run-history");
const STORAGE_FILE = path.join(STORAGE_DIR, "runs.json");

// Maximum runs to keep per project
const MAX_RUNS_PER_PROJECT = 20;

/**
 * Ensure storage directory exists
 */
function ensureStorageDir(): void {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

/**
 * Load all run history from file
 */
function loadFromFile(): Map<string, RunHistory[]> {
  try {
    ensureStorageDir();
    if (!fs.existsSync(STORAGE_FILE)) {
      return new Map();
    }
    const data = fs.readFileSync(STORAGE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    // Convert array format to Map
    const map = new Map<string, RunHistory[]>();
    if (Array.isArray(parsed)) {
      // Legacy format: array of runs
      const runsByProject = new Map<string, RunHistory[]>();
      for (const run of parsed) {
        if (!runsByProject.has(run.projectId)) {
          runsByProject.set(run.projectId, []);
        }
        runsByProject.get(run.projectId)!.push(run);
      }
      return runsByProject;
    } else if (typeof parsed === "object") {
      // New format: object with projectId keys
      for (const [projectId, runs] of Object.entries(parsed)) {
        if (Array.isArray(runs)) {
          map.set(projectId, runs);
        }
      }
    }
    return map;
  } catch (error) {
    console.warn("Failed to load run history from file:", error);
    return new Map();
  }
}

/**
 * Save all run history to file
 */
function saveToFile(store: Map<string, RunHistory[]>): void {
  try {
    ensureStorageDir();
    // Convert Map to object for JSON serialization
    const obj: Record<string, RunHistory[]> = {};
    for (const [projectId, runs] of store.entries()) {
      obj[projectId] = runs;
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(obj, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to save run history to file:", error);
  }
}

/**
 * Get cached history or load from file
 */
function getCachedHistory(projectId: string): RunHistory[] {
  if (!runHistoryCache.has(projectId)) {
    // Load from file and populate cache
    const fileStore = loadFromFile();
    for (const [pid, runs] of fileStore.entries()) {
      runHistoryCache.set(pid, runs);
    }
    // If still not in cache, initialize empty array
    if (!runHistoryCache.has(projectId)) {
      runHistoryCache.set(projectId, []);
    }
  }
  return runHistoryCache.get(projectId) || [];
}

/**
 * Save a new run history entry
 */
export function saveRunHistory(run: Omit<RunHistory, "id">): RunHistory {
  const history = getCachedHistory(run.projectId);
  
  const newRun: RunHistory = {
    ...run,
    id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  };
  
  // Add to beginning (latest first)
  const updatedHistory = [newRun, ...history];
  
  // Keep only last MAX_RUNS_PER_PROJECT runs
  const trimmedHistory = updatedHistory.slice(0, MAX_RUNS_PER_PROJECT);
  
  // Update cache
  runHistoryCache.set(run.projectId, trimmedHistory);
  
  // Persist to file
  saveToFile(runHistoryCache);
  
  return newRun;
}

/**
 * Get all run history for a project (latest first)
 */
export function getRunHistory(projectId: string): RunHistory[] {
  return getCachedHistory(projectId);
}

/**
 * Get a specific run by ID
 */
export function getRunById(projectId: string, runId: string): RunHistory | undefined {
  const history = getCachedHistory(projectId);
  return history.find(run => run.id === runId);
}

/**
 * Clear all run history for a project (for testing/cleanup)
 */
export function clearRunHistory(projectId: string): void {
  runHistoryCache.delete(projectId);
  // Update file storage
  saveToFile(runHistoryCache);
}

