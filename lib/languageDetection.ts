/**
 * Language Detection Utilities
 * 
 * Detects project language from file extensions.
 */

export type ProjectLanguage = "python" | "javascript" | "typescript" | "html" | "css" | "json" | undefined;

interface FileInfo {
  name: string;
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string | null {
  const parts = fileName.split(".");
  if (parts.length < 2) return null;
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Map file extension to project language
 */
function extensionToLanguage(ext: string): "python" | "javascript" | "typescript" | "html" | "css" | "json" | null {
  const extMap: Record<string, "python" | "javascript" | "typescript" | "html" | "css" | "json"> = {
    // Python
    py: "python",
    pyw: "python",
    // JavaScript
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    // TypeScript
    ts: "typescript",
    tsx: "typescript",
    // HTML
    html: "html",
    htm: "html",
    // CSS
    css: "css",
    // JSON
    json: "json",
  };
  return extMap[ext] || null;
}

/**
 * Detect project language from a list of files
 * 
 * Returns the most common language found in the files.
 * If multiple languages are found, returns the one with the most files.
 * Returns "unknown" if no recognized language files are found.
 */
export function detectProjectLanguage(files: FileInfo[]): "python" | "javascript" | "typescript" | "html" | "css" | "json" | undefined {
  if (!files || files.length === 0) {
    return undefined;
  }

  // Count files by language
  const languageCounts: Record<string, number> = {
    python: 0,
    javascript: 0,
    typescript: 0,
    html: 0,
    css: 0,
    json: 0,
  };

  for (const file of files) {
    const ext = getFileExtension(file.name);
    if (!ext) continue;

    const language = extensionToLanguage(ext);
    if (language && language !== "unknown") {
      languageCounts[language]++;
    }
  }

  // Find the language with the most files
  let maxCount = 0;
  let detectedLanguage: "python" | "javascript" | "typescript" | "html" | "css" | "json" | undefined = undefined;

  for (const [language, count] of Object.entries(languageCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedLanguage = language as "python" | "javascript" | "typescript" | "html" | "css" | "json";
    }
  }

  // If no recognized language files found, return undefined
  if (maxCount === 0) {
    return undefined;
  }

  return detectedLanguage;
}

