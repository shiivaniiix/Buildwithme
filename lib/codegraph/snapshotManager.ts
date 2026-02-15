import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import type { CodeGraph } from "./graphTypes";

/**
 * Snapshot Manager
 * 
 * Stores and retrieves code graph snapshots on disk.
 */

const SNAPSHOT_BASE_DIR = path.join(os.tmpdir(), "buildwithme-codegraph");

/**
 * Ensure snapshot directory exists for a project
 */
function ensureProjectDir(projectId: string): string {
  const projectDir = path.join(SNAPSHOT_BASE_DIR, projectId);
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }
  return projectDir;
}

/**
 * Save a code graph snapshot
 */
export function saveSnapshot(projectId: string, graph: CodeGraph): void {
  const projectDir = ensureProjectDir(projectId);
  const timestamp = graph.generatedAt;
  const filename = `snapshot_${timestamp}.json`;
  const filePath = path.join(projectDir, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2), "utf-8");
}

/**
 * Get all snapshots for a project (sorted by timestamp, newest first)
 */
export function getSnapshots(projectId: string): CodeGraph[] {
  const projectDir = path.join(SNAPSHOT_BASE_DIR, projectId);
  
  if (!fs.existsSync(projectDir)) {
    return [];
  }

  try {
    const files = fs.readdirSync(projectDir);
    const snapshotFiles = files
      .filter(f => f.startsWith("snapshot_") && f.endsWith(".json"))
      .map(f => {
        const filePath = path.join(projectDir, f);
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          return JSON.parse(content) as CodeGraph;
        } catch (error) {
          console.warn(`Failed to parse snapshot file ${f}:`, error);
          return null;
        }
      })
      .filter((graph): graph is CodeGraph => graph !== null)
      .sort((a, b) => b.generatedAt - a.generatedAt); // Newest first

    return snapshotFiles;
  } catch (error) {
    console.warn(`Failed to read snapshots for project ${projectId}:`, error);
    return [];
  }
}

