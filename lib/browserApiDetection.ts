/**
 * Browser API Detection Utility
 * 
 * Lightweight static analysis to detect browser-only APIs in JavaScript code.
 * This helps users understand when their code is written for browser environments
 * but is being executed in Node.js.
 * 
 * This is a SAFETY LAYER - it does NOT modify code, only provides analysis.
 */

export interface BrowserApiDetection {
  /** Whether browser APIs were detected */
  detected: boolean;
  /** List of detected browser APIs */
  detectedApis: string[];
  /** Detailed information about each detected API */
  apiDetails: Array<{
    api: string;
    description: string;
    nodeAlternative?: string;
  }>;
}

/**
 * Browser-only APIs that don't exist in Node.js
 */
const BROWSER_APIS = {
  localStorage: {
    description: "Browser storage API for persistent key-value storage",
    nodeAlternative: "fs module, database, or in-memory storage",
  },
  sessionStorage: {
    description: "Browser storage API for session-based key-value storage",
    nodeAlternative: "in-memory storage or environment variables",
  },
  window: {
    description: "Global browser window object",
    nodeAlternative: "global object (different API)",
  },
  document: {
    description: "DOM document object for HTML manipulation",
    nodeAlternative: "jsdom library (if DOM needed) or server-side rendering",
  },
  navigator: {
    description: "Browser navigator object with device/browser info",
    nodeAlternative: "os module or process.env for system info",
  },
  location: {
    description: "Browser location object for URL manipulation",
    nodeAlternative: "url module for URL parsing",
  },
  history: {
    description: "Browser history API for navigation",
    nodeAlternative: "Not applicable in Node.js",
  },
  fetch: {
    description: "Note: fetch IS available in Node.js 18+, but usage pattern may indicate browser intent",
    nodeAlternative: "fetch works in Node.js 18+, or use node-fetch for older versions",
  },
} as const;

/**
 * Detects browser-only APIs in JavaScript code using simple pattern matching.
 * 
 * This is a lightweight static analysis - it doesn't parse AST, just looks for
 * common patterns that indicate browser API usage.
 * 
 * @param code - JavaScript code to analyze
 * @returns Detection results with found APIs and explanations
 */
export function detectBrowserApis(code: string): BrowserApiDetection {
  if (!code || typeof code !== "string") {
    return {
      detected: false,
      detectedApis: [],
      apiDetails: [],
    };
  }

  const detectedApis: string[] = [];
  const apiDetails: BrowserApiDetection["apiDetails"] = [];

  // Check for each browser API
  for (const [api, info] of Object.entries(BROWSER_APIS)) {
    // Create regex patterns to detect API usage
    // Matches: localStorage, window.localStorage, this.localStorage, etc.
    const patterns = [
      // Direct usage: localStorage.getItem
      new RegExp(`\\b${api}\\s*\\.`, "i"),
      // Assignment: const x = localStorage
      new RegExp(`\\b${api}\\b`, "i"),
      // Method calls: localStorage.getItem(...)
      new RegExp(`\\b${api}\\s*\\(`, "i"),
      // Property access: window.localStorage
      new RegExp(`\\.${api}\\b`, "i"),
    ];

    // Check if any pattern matches
    const isDetected = patterns.some((pattern) => pattern.test(code));

    if (isDetected) {
      detectedApis.push(api);
      apiDetails.push({
        api,
        description: info.description,
        nodeAlternative: info.nodeAlternative,
      });
    }
  }

  return {
    detected: detectedApis.length > 0,
    detectedApis,
    apiDetails,
  };
}

/**
 * Generates a user-friendly explanation message when browser APIs are detected.
 * 
 * @param detection - Browser API detection results
 * @returns Formatted explanation message
 */
export function generateBrowserApiExplanation(detection: BrowserApiDetection): string {
  if (!detection.detected) {
    return "";
  }

  const apiList = detection.detectedApis.join(", ");
  
  return `⚠️ Browser API Detected: Your code uses browser-only APIs (${apiList}) that are not available in Node.js.

📝 Why this happens:
Your code is written for a browser environment, but it's being executed in Node.js (server-side). Browser APIs like localStorage, window, and document don't exist in Node.js.

✅ Your code is not wrong - it's just written for a different environment!

💡 Next steps:
• To run in browser: Use a browser-based execution environment
• To adapt for Node.js: Replace browser APIs with Node.js equivalents:
${detection.apiDetails.map(detail => `  - ${detail.api}: ${detail.nodeAlternative || "No direct equivalent"}`).join("\n")}

🔧 Current execution environment: Node.js (Server-side)`;
}





