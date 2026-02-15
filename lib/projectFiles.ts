export type CodeFile = {
  id: string;
  name: string;
  content: string;
  isEntry?: boolean;
  isFolder?: boolean; // Phase 3: Folder support
};

const storageKey = (projectId: string) =>
  `buildwithme-project-files-${projectId}`;

/**
 * Get all files for a project
 */
export function getProjectFiles(projectId: string): CodeFile[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(storageKey(projectId));
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save files for a project
 */
export function saveProjectFiles(projectId: string, files: CodeFile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(projectId), JSON.stringify(files));
}

/**
 * Get a specific file by name
 */
export function getProjectFile(projectId: string, fileName: string): CodeFile | undefined {
  const files = getProjectFiles(projectId);
  return files.find(f => f.name === fileName);
}

/**
 * Get file content by name
 */
export function getProjectFileContent(projectId: string, fileName: string): string {
  const file = getProjectFile(projectId, fileName);
  return file?.content || "";
}

/**
 * Update file content
 */
export function updateProjectFileContent(
  projectId: string,
  fileName: string,
  content: string
) {
  const files = getProjectFiles(projectId);
  const updated = files.map(f =>
    f.name === fileName ? { ...f, content } : f
  );
  saveProjectFiles(projectId, updated);
}

/**
 * Check if a filename already exists in the project
 */
export function fileNameExists(projectId: string, fileName: string): boolean {
  const files = getProjectFiles(projectId);
  return files.some(f => f.name === fileName);
}

/**
 * Add a new file to the project
 * Throws error if filename already exists
 */
export function addProjectFile(
  projectId: string,
  fileName: string,
  content: string = "",
  isFolder: boolean = false
): CodeFile {
  const files = getProjectFiles(projectId);
  
  // Validate filename is not empty
  if (!fileName || fileName.trim().length === 0) {
    throw new Error("Filename cannot be empty");
  }
  
  // Validate filename is unique
  if (fileNameExists(projectId, fileName.trim())) {
    throw new Error(`File "${fileName.trim()}" already exists`);
  }
  
  const newFile: CodeFile = {
    id: `${projectId}-file-${Date.now()}`,
    name: fileName.trim(),
    content: isFolder ? "" : content, // Folders have no content
    isEntry: files.length === 0 && !isFolder, // First file (not folder) is entry
    isFolder,
  };
  const updated = [...files, newFile];
  saveProjectFiles(projectId, updated);
  return newFile;
}

/**
 * Add a new folder to the project
 * Throws error if folder name already exists
 */
export function addProjectFolder(
  projectId: string,
  folderName: string
): CodeFile {
  // Ensure folder name doesn't have file extensions
  let cleanFolderName = folderName.trim();
  
  // Remove common file extensions if accidentally added
  const extensions = [".java", ".py", ".js", ".ts", ".html", ".css", ".json", ".c", ".cpp", ".sql"];
  for (const ext of extensions) {
    if (cleanFolderName.endsWith(ext)) {
      cleanFolderName = cleanFolderName.slice(0, -ext.length);
    }
  }
  
  // Validate folder name doesn't contain invalid characters
  if (cleanFolderName.includes(".") && !cleanFolderName.includes("/")) {
    // Single dot might be accidental extension, but allow dots in paths like "com.example"
    // Only warn if it's a simple name with a dot
    const parts = cleanFolderName.split(".");
    if (parts.length === 2 && parts[1].length <= 4) {
      // Likely accidental extension, remove it
      cleanFolderName = parts[0];
    }
  }
  
  return addProjectFile(projectId, cleanFolderName, "", true);
}

/**
 * Delete a file from the project
 */
export function deleteProjectFile(projectId: string, fileName: string) {
  const files = getProjectFiles(projectId);
  const updated = files.filter(f => f.name !== fileName);
  saveProjectFiles(projectId, updated);
}

/**
 * Rename a file
 * Throws error if new filename already exists
 */
export function renameProjectFile(
  projectId: string,
  oldName: string,
  newName: string
) {
  const files = getProjectFiles(projectId);
  
  // Validate new filename is not empty
  if (!newName || newName.trim().length === 0) {
    throw new Error("Filename cannot be empty");
  }
  
  const trimmedNewName = newName.trim();
  
  // Validate new filename is unique (unless it's the same file)
  const fileWithNewName = files.find(f => f.name === trimmedNewName);
  if (fileWithNewName && fileWithNewName.name !== oldName) {
    throw new Error(`File "${trimmedNewName}" already exists`);
  }
  
  const updated = files.map(f =>
    f.name === oldName ? { ...f, name: trimmedNewName } : f
  );
  saveProjectFiles(projectId, updated);
}

/**
 * Get file by ID
 */
export function getProjectFileById(projectId: string, fileId: string): CodeFile | undefined {
  const files = getProjectFiles(projectId);
  return files.find(f => f.id === fileId);
}

/**
 * Get expected entry file name(s) for a language
 */
export function getEntryFileNameForLanguage(language: string): string[] {
  switch (language) {
    case "python":
      return ["main.py", "app.py"];
    case "javascript":
      return ["index.js", "main.js"];
    case "typescript":
      return ["index.ts", "main.ts"];
    case "c":
      return ["main.c"];
    case "cpp":
    case "c++":
      return ["main.cpp"];
    case "java":
      return ["Main.java"];
    default:
      return [];
  }
}

/**
 * Detect entry file for a project using the following priority:
 * 1. If project has explicit `entryFile` stored, use it
 * 2. If language is specified, try expected entry file names for that language
 * 3. If exactly one file exists, auto-use it
 * 4. Return undefined if no entry file found
 */
export function detectEntryFile(
  projectId: string,
  project?: { entryFile?: string; language?: string }
): CodeFile | undefined {
  const files = getProjectFiles(projectId);
  
  if (files.length === 0) {
    return undefined;
  }
  
  // Priority 1: Use explicitly stored entryFile if available
  if (project?.entryFile) {
    const explicitEntry = files.find(f => f.name === project.entryFile);
    if (explicitEntry) {
      return explicitEntry;
    }
  }
  
  // Priority 2: Try language-based expected entry file names
  if (project?.language) {
    const expectedNames = getEntryFileNameForLanguage(project.language);
    for (const expectedName of expectedNames) {
      const entryFile = files.find(f => f.name === expectedName);
      if (entryFile) return entryFile;
    }
  }
  
  // Priority 3: If exactly one file exists, auto-use it
  if (files.length === 1) {
    return files[0];
  }
  
  // Priority 4: Fallback to file marked as entry
  const markedEntry = files.find(f => f.isEntry);
  if (markedEntry) {
    return markedEntry;
  }
  
  // No entry file found
  return undefined;
}

/**
 * Get entry file for a project based on language
 * @deprecated Use detectEntryFile instead for proper entry file detection
 */
export function getEntryFileForLanguage(projectId: string, language: string): CodeFile | undefined {
  const files = getProjectFiles(projectId);
  const expectedNames = getEntryFileNameForLanguage(language);
  
  // First, try to find a file that matches expected entry file names
  for (const expectedName of expectedNames) {
    const entryFile = files.find(f => f.name === expectedName);
    if (entryFile) return entryFile;
  }
  
  // Fallback: return file marked as entry, or first file
  return files.find(f => f.isEntry) || files[0];
}

/**
 * Get entry file (first file or file marked as entry)
 * @deprecated Use getEntryFileForLanguage instead for language-aware entry file resolution
 */
export function getEntryFile(projectId: string): CodeFile | undefined {
  const files = getProjectFiles(projectId);
  return files.find(f => f.isEntry) || files[0];
}

/**
 * Initialize project with default file if empty
 */
export function ensureProjectHasFile(
  projectId: string,
  language?: "python" | "javascript" | "typescript" | "html" | "css" | "json" | "java" | "c"
): CodeFile {
  const files = getProjectFiles(projectId);
  if (files.length === 0) {
    const defaultName = language === "python" ? "main.py" :
                       language === "javascript" ? "main.js" :
                       language === "typescript" ? "main.ts" :
                       language === "html" ? "index.html" :
                       language === "css" ? "style.css" :
                       language === "json" ? "data.json" :
                       language === "java" ? "Main.java" :
                       language === "c" ? "main.c" : "main.py";
    const defaultContent = language === "java" 
      ? `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
      : language === "c"
      ? `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`
      : "";
    return addProjectFile(projectId, defaultName, defaultContent);
  }
  return files[0];
}

