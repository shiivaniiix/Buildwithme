import type { DetectedTechnology } from "./graphTypes";

/**
 * Technology Detection Utilities
 * 
 * Simple heuristic-based detection.
 * No AI, deterministic heuristics only.
 */

/**
 * Detect language from file extension
 */
export function detectLanguageFromExtension(fileName: string): string | undefined {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (!ext) return undefined;

  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    ts: "typescript",
    tsx: "typescript",
    // Python
    py: "python",
    pyw: "python",
    // Java
    java: "java",
    // C/C++
    c: "c",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    h: "c",
    hpp: "cpp",
    // HTML/CSS
    html: "html",
    htm: "html",
    css: "css",
    // JSON
    json: "json",
    // SQL
    sql: "sql",
    // Shell
    sh: "shell",
    bash: "shell",
    zsh: "shell",
  };

  return languageMap[ext];
}

/**
 * Detect technologies from project files
 */
export function detectTechnologies(files: string[]): DetectedTechnology[] {
  const technologies: DetectedTechnology[] = [];
  const detected = new Set<string>();

  // Language detection from file extensions
  const languages = new Set<string>();
  files.forEach(file => {
    const lang = detectLanguageFromExtension(file);
    if (lang && !languages.has(lang)) {
      languages.add(lang);
      technologies.push({
        name: lang.charAt(0).toUpperCase() + lang.slice(1),
        category: "language",
      });
      detected.add(lang);
    }
  });

  // Framework and tooling detection
  const fileNames = files.map(f => f.split("/").pop()?.toLowerCase() || "");

  // React detection
  if (fileNames.includes("package.json")) {
    // Check if React is likely (heuristic: presence of .jsx/.tsx files or react in package.json would be ideal, but we don't read content)
    const hasReactFiles = files.some(f => f.endsWith(".jsx") || f.endsWith(".tsx"));
    if (hasReactFiles && !detected.has("react")) {
      technologies.push({
        name: "React",
        category: "framework",
      });
      detected.add("react");
    }
  }

  // Next.js detection
  if (fileNames.includes("next.config.js") || fileNames.includes("next.config.ts")) {
    if (!detected.has("nextjs")) {
      technologies.push({
        name: "Next.js",
        category: "framework",
      });
      detected.add("nextjs");
    }
  }

  // Node.js detection (if package.json exists)
  if (fileNames.includes("package.json")) {
    const hasJsFiles = files.some(f => f.endsWith(".js") || f.endsWith(".mjs"));
    if (hasJsFiles && !detected.has("nodejs")) {
      technologies.push({
        name: "Node.js",
        category: "runtime",
      });
      detected.add("nodejs");
    }
  }

  // Python frameworks
  if (files.some(f => f.includes("requirements.txt") || f.includes("setup.py"))) {
    if (languages.has("python") && !detected.has("python-ecosystem")) {
      technologies.push({
        name: "Python Ecosystem",
        category: "tooling",
      });
      detected.add("python-ecosystem");
    }
  }

  // Java + Maven
  if (fileNames.includes("pom.xml")) {
    if (!detected.has("maven")) {
      technologies.push({
        name: "Maven",
        category: "tooling",
      });
      detected.add("maven");
    }
  }

  // Docker
  if (fileNames.includes("dockerfile") || fileNames.includes("docker-compose.yml") || fileNames.includes("docker-compose.yaml")) {
    if (!detected.has("docker")) {
      technologies.push({
        name: "Docker",
        category: "tooling",
      });
      detected.add("docker");
    }
  }

  // TypeScript (if .ts files exist)
  if (languages.has("typescript") && !detected.has("typescript")) {
    technologies.push({
      name: "TypeScript",
      category: "language",
    });
    detected.add("typescript");
  }

  return technologies;
}

