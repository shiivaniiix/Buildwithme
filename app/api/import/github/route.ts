import { NextRequest, NextResponse } from "next/server";
import { detectProjectLanguage } from "@/lib/languageDetection";

/**
 * Recursively fetch files from GitHub repository using Contents API
 */
async function fetchGitHubFiles(
  owner: string,
  repo: string,
  branch: string,
  path: string = "",
  ignoredDirs: string[],
  maxFiles: number,
  maxFileSize: number
): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];
  
  if (files.length >= maxFiles) {
    return files;
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
  
  console.log("GitHub API URL:", apiUrl);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Buildwithme-Import",
      },
    });

    console.log("Status:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Path ${path} not found (404)`);
        return files; // Path doesn't exist, return empty
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const items = await response.json();
    console.log("Response JSON:", JSON.stringify(items, null, 2));
    
    // Handle single file response
    if (items.type === "file") {
      // Check if should be ignored
      const pathParts = path.split("/");
      const shouldIgnore = pathParts.some(part => 
        ignoredDirs.some(ignored => part === ignored || part.startsWith(ignored))
      );
      if (shouldIgnore) return files;

      // Check file size
      if (items.size > maxFileSize) {
        return files; // Skip large files
      }

      // Fetch file content
      if (items.encoding === "base64" && items.content) {
        try {
          const content = Buffer.from(items.content, "base64").toString("utf-8");
          files.push({
            name: path,
            content,
          });
        } catch (error) {
          // Skip binary files
          console.warn(`Skipping file ${path}:`, error);
        }
      }
      return files;
    }

    // Handle directory response
    if (Array.isArray(items)) {
      console.log(`Processing directory with ${items.length} items`);
      for (const item of items) {
        if (files.length >= maxFiles) break;

        // Check if directory should be ignored
        const shouldIgnore = ignoredDirs.some(ignored => 
          item.name === ignored || item.name.startsWith(ignored)
        );
        if (shouldIgnore) {
          console.log(`Ignoring item: ${item.name} (matches ignored dirs)`);
          continue;
        }

        if (item.type === "file") {
          // Check file size
          if (item.size > maxFileSize) {
            console.log(`Skipping file ${item.name}: size ${item.size} exceeds max ${maxFileSize}`);
            continue;
          }

          // Fetch file content using download_url
          const filePath = path ? `${path}/${item.name}` : item.name;
          
          console.log(`Processing file: ${filePath} (type: ${item.type}, size: ${item.size})`);
          
          if (!item.download_url) {
            console.warn(`No download URL for file ${filePath}`);
            continue;
          }

          try {
            const fileResponse = await fetch(item.download_url, {
              headers: {
                "User-Agent": "Buildwithme-Import",
              },
            });

            if (fileResponse.ok) {
              const content = await fileResponse.text();
              files.push({
                name: filePath,
                content,
              });
              console.log(`Successfully fetched file: ${filePath} (${content.length} chars)`);
            } else {
              console.warn(`Failed to fetch file ${filePath}: ${fileResponse.status}`);
            }
          } catch (error) {
            // Skip files that can't be fetched or are binary
            console.warn(`Skipping file ${filePath}:`, error);
          }
        } else if (item.type === "dir") {
          // Recursively fetch directory contents
          const dirPath = path ? `${path}/${item.name}` : item.name;
          console.log(`Recursively fetching directory: ${dirPath}`);
          const dirFiles = await fetchGitHubFiles(
            owner,
            repo,
            branch,
            dirPath,
            ignoredDirs,
            maxFiles,
            maxFileSize
          );
          console.log(`Found ${dirFiles.length} files in directory ${dirPath}`);
          files.push(...dirFiles);
        }
      }
    }

    return files;
  } catch (error) {
    console.error(`Error fetching path ${path}:`, error);
    return files;
  }
}

/**
 * GitHub Import API Route
 * 
 * Imports a public GitHub repository as a project.
 * Only public repositories are allowed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repoUrl, branch = "main" } = body;

    if (!repoUrl || typeof repoUrl !== "string") {
      return NextResponse.json(
        { error: "GitHub repository URL is required" },
        { status: 400 }
      );
    }

    // Normalize URL: remove trailing .git, trailing /, and handle http/https
    let normalizedUrl = repoUrl.trim();
    // Remove trailing .git
    normalizedUrl = normalizedUrl.replace(/\.git$/, "");
    // Remove trailing /
    normalizedUrl = normalizedUrl.replace(/\/$/, "");
    // Normalize http to https (optional, but cleaner)
    normalizedUrl = normalizedUrl.replace(/^http:\/\//, "https://");

    // Validate GitHub URL format and extract owner/repo
    const githubUrlRegex = /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/;
    const match = normalizedUrl.match(githubUrlRegex);
    
    if (!match) {
      return NextResponse.json(
        { error: "Invalid GitHub URL format. Expected: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const [, owner, repo] = match;
    const repoName = repo; // Already normalized, no .git suffix
    
    console.log("Owner:", owner);
    console.log("Repo:", repoName);

    // Fetch repository metadata to verify it's public
    const repoInfoUrl = `https://api.github.com/repos/${owner}/${repoName}`;
    let repoInfo;
    try {
      const repoResponse = await fetch(repoInfoUrl, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Buildwithme-Import",
        },
      });

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return NextResponse.json(
            { error: "Repository not found or is private. Only public repositories can be imported." },
            { status: 404 }
          );
        }
        throw new Error(`GitHub API error: ${repoResponse.status}`);
      }

      repoInfo = await repoResponse.json();
      
      // Verify repository is public
      if (repoInfo.private) {
        return NextResponse.json(
          { error: "Private repositories cannot be imported. Only public repositories are allowed." },
          { status: 403 }
        );
      }
    } catch (error) {
      console.error("Error fetching repository info:", error);
      return NextResponse.json(
        { error: "Failed to verify repository. Please check the URL and try again." },
        { status: 500 }
      );
    }

    // Fetch files from repository
    const ignoredDirs = [".git", "node_modules", "dist", "build", ".next", ".vscode", ".idea"];
    const maxFileSize = 5 * 1024 * 1024; // 5MB per file
    const maxFiles = 500; // Maximum number of files

    const files = await fetchGitHubFiles(
      owner,
      repoName,
      branch,
      "",
      ignoredDirs,
      maxFiles,
      maxFileSize
    );

    console.log("Extracted file paths:", files.map(f => f.name));
    console.log("Total files found:", files.length);

    if (files.length === 0) {
      console.log("Filtered valid files: [] (no files found)");
      return NextResponse.json(
        { error: "No valid files found in repository. Make sure the repository contains code files." },
        { status: 400 }
      );
    }

    console.log("Filtered valid files:", files.map(f => ({ name: f.name, size: f.content.length })));

    // Detect project language from file extensions
    const detectedLanguage = detectProjectLanguage(files);

    // Return project data (client will create the project)
    return NextResponse.json({
      success: true,
      project: {
        name: repoName,
        description: `Imported from GitHub: ${owner}/${repoName}`,
        language: detectedLanguage,
        files,
      },
    });
  } catch (error) {
    console.error("GitHub import error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during import. Please try again." },
      { status: 500 }
    );
  }
}

