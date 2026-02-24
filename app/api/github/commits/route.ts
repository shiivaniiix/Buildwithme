export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/github/commits?owner=xxx&repo=yyy
 * 
 * Fetches commit history from GitHub repository.
 */
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "owner and repo are required" },
        { status: 400 }
      );
    }

    // Fetch commits from GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "Buildwithme-Import",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Repository not found or is private" },
          { status: 404 }
        );
      }
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GitHub API error: ${response.status}`, details: errorData },
        { status: response.status }
      );
    }

    type GitHubCommit = {
      sha: string;
      commit: {
        author: { date: string; name: string };
        message: string;
      };
      [key: string]: unknown;
    };

    const commits = await response.json() as GitHubCommit[];

    // Transform to our format
    const formattedCommits = commits.map((commit: GitHubCommit) => ({
      sha: commit.sha,
      date: commit.commit.author.date,
      message: commit.commit.message.split("\n")[0], // First line only
      author: commit.commit.author.name,
    }));

    return NextResponse.json({
      commits: formattedCommits,
    });
  } catch (error) {
    console.error("Error fetching GitHub commits:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

