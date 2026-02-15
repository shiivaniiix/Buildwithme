import type { CodeGraph, GraphNode, GraphEdge } from "./graphTypes";
import { detectLanguageFromExtension, detectTechnologies } from "./techDetector";

/**
 * Project Analyzer
 * 
 * Builds a hierarchical graph from project file structure.
 */

/**
 * Analyze project and generate code graph
 */
export function analyzeProject(
  projectId: string,
  files: string[]
): CodeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, GraphNode>();

  // Build folder hierarchy
  const folderPaths = new Set<string>();
  
  files.forEach(filePath => {
    // Extract all parent folder paths
    const parts = filePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      const folderPath = parts.slice(0, i).join("/");
      folderPaths.add(folderPath);
    }
  });

  // Create folder nodes
  folderPaths.forEach(folderPath => {
    const parts = folderPath.split("/");
    const folderName = parts[parts.length - 1];
    const folderId = `folder_${folderPath.replace(/\//g, "_")}`;
    
    const folderNode: GraphNode = {
      id: folderId,
      type: "folder",
      name: folderName,
      path: folderPath,
    };
    
    nodes.push(folderNode);
    nodeMap.set(folderPath, folderNode);
  });

  // Create file nodes
  files.forEach(filePath => {
    const parts = filePath.split("/");
    const fileName = parts[parts.length - 1];
    const fileId = `file_${filePath.replace(/\//g, "_")}`;
    const language = detectLanguageFromExtension(fileName);
    
    const fileNode: GraphNode = {
      id: fileId,
      type: "file",
      name: fileName,
      path: filePath,
      language,
    };
    
    nodes.push(fileNode);
    nodeMap.set(filePath, fileNode);
  });

  // Create "contains" edges
  files.forEach(filePath => {
    const fileNode = nodeMap.get(filePath);
    if (!fileNode) return;

    const parts = filePath.split("/");
    
    if (parts.length > 1) {
      // File is in a folder - create edge from parent folder to file
      const parentFolderPath = parts.slice(0, parts.length - 1).join("/");
      const parentFolderNode = nodeMap.get(parentFolderPath);
      
      if (parentFolderNode) {
        edges.push({
          from: parentFolderNode.id,
          to: fileNode.id,
          type: "contains",
        });
      }
    } else {
      // File is at root - create edge from root if needed
      // For root files, we might want to skip or handle differently
      // For now, we'll create a root folder node if it doesn't exist
      const rootFolderId = "folder_root";
      if (!nodeMap.has("root")) {
        const rootNode: GraphNode = {
          id: rootFolderId,
          type: "folder",
          name: "root",
          path: "",
        };
        nodes.push(rootNode);
        nodeMap.set("root", rootNode);
      }
      
      const rootNode = nodeMap.get("root");
      if (rootNode) {
        edges.push({
          from: rootNode.id,
          to: fileNode.id,
          type: "contains",
        });
      }
    }
  });

  // Create folder-to-folder edges (parent contains child)
  folderPaths.forEach(folderPath => {
    const parts = folderPath.split("/");
    if (parts.length > 1) {
      const parentFolderPath = parts.slice(0, parts.length - 1).join("/");
      const parentFolderNode = nodeMap.get(parentFolderPath);
      const childFolderNode = nodeMap.get(folderPath);
      
      if (parentFolderNode && childFolderNode) {
        edges.push({
          from: parentFolderNode.id,
          to: childFolderNode.id,
          type: "contains",
        });
      }
    } else {
      // Root-level folder - connect to root
      const rootFolderId = "folder_root";
      if (!nodeMap.has("root")) {
        const rootNode: GraphNode = {
          id: rootFolderId,
          type: "folder",
          name: "root",
          path: "",
        };
        nodes.push(rootNode);
        nodeMap.set("root", rootNode);
      }
      
      const rootNode = nodeMap.get("root");
      const childFolderNode = nodeMap.get(folderPath);
      
      if (rootNode && childFolderNode) {
        edges.push({
          from: rootNode.id,
          to: childFolderNode.id,
          type: "contains",
        });
      }
    }
  });

  // Detect technologies
  const technologies = detectTechnologies(files);

  return {
    projectId,
    generatedAt: Date.now(),
    nodes,
    edges,
    technologies,
  };
}

