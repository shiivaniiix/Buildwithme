export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { analyzeProject } from "@/lib/codegraph/analyzer";

/**
 * GET /api/github/snapshot?owner=xxx&repo=yyy&commitSha=zzz
 * 
 * Fetches project structure at a specific commit and generates architecture snapshot.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const commitSha = searchParams.get("commitSha");

    if (!owner || !repo || !commitSha) {
      return NextResponse.json(
        { error: "owner, repo, and commitSha are required" },
        { status: 400 }
      );
    }

    // Fetch tree at specific commit using GitHub Trees API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Buildwithme-Import",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Commit or repository not found" },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    const treeData = await response.json();

    // Extract file paths only (filter out directories and ignored files)
    const ignoredDirs = [".git", "node_modules", "dist", "build", ".next", ".vscode", ".idea"];
    const validExtensions = [
      ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp",
      ".html", ".css", ".json", ".xml", ".yml", ".yaml", ".md", ".txt",
      ".scala", ".kt", ".kts", ".rs", ".go", ".php", ".swift", ".rb", ".m", ".cs", ".fs", ".gradle"
    ];

    const filePaths: string[] = [];
    
    type GitHubTreeItem = {
      type: string;
      path?: string;
      [key: string]: unknown;
    };

    if (treeData.tree && Array.isArray(treeData.tree)) {
      const treeItems = treeData.tree as GitHubTreeItem[];
      for (const item of treeItems) {
        // Only include files (type === "blob")
        if (item.type === "blob" && item.path) {
          // Check if path should be ignored
          const shouldIgnore = ignoredDirs.some((ignored: string) => 
            item.path!.includes(`/${ignored}/`) || item.path!.startsWith(`${ignored}/`)
          );
          
          if (shouldIgnore) continue;

          // Check if file has valid extension
          const hasValidExtension = validExtensions.some((ext: string) => 
            item.path!.toLowerCase().endsWith(ext)
          );

          if (hasValidExtension || item.path.includes(".")) {
            filePaths.push(item.path);
          }
        }
      }
    }

    if (filePaths.length === 0) {
      return NextResponse.json(
        { error: "No valid files found in this commit" },
        { status: 400 }
      );
    }

    // Generate project ID for this snapshot
    const projectId = `github-${owner}-${repo}-${commitSha.substring(0, 7)}`;

    // Reuse existing architecture extraction logic
    const snapshotGraph = analyzeProject(projectId, filePaths);

    return NextResponse.json({
      snapshotGraph,
      filePaths,
      commitSha,
      commitDate: treeData.sha ? new Date().toISOString() : undefined, // Tree API doesn't return date, would need commit API
    });
  } catch (error) {
    console.error("Error fetching GitHub snapshot:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

