import { type Project } from "./projects";
import { getProjectFiles } from "./projectFiles";

export type ActivityType = "project_started" | "project_updated" | "project_opened";

export interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: number;
  metadata?: {
    projectName?: string;
    projectId?: string;
  };
}

/**
 * Derive recent activities from project metadata
 */
export function deriveActivities(projects: Project[]): Activity[] {
  const activities: Activity[] = [];

  projects.forEach((project) => {
    // Project created
    if (project.createdAt) {
      activities.push({
        id: `created-${project.id}`,
        type: "project_started",
        description: `Started new project "${project.name}"`,
        timestamp: project.createdAt,
        metadata: {
          projectName: project.name,
          projectId: project.id,
        },
      });
    }

    // Project updated (only if different from created)
    if (project.updatedAt && project.updatedAt !== project.createdAt) {
      activities.push({
        id: `updated-${project.id}-${project.updatedAt}`,
        type: "project_updated",
        description: `Updated project "${project.name}"`,
        timestamp: project.updatedAt,
        metadata: {
          projectName: project.name,
          projectId: project.id,
        },
      });
    }

    // Project opened (only if different from created and updated)
    if (
      project.lastOpenedAt &&
      project.lastOpenedAt !== project.createdAt &&
      project.lastOpenedAt !== project.updatedAt
    ) {
      activities.push({
        id: `opened-${project.id}-${project.lastOpenedAt}`,
        type: "project_opened",
        description: `Opened project "${project.name}"`,
        timestamp: project.lastOpenedAt,
        metadata: {
          projectName: project.name,
          projectId: project.id,
        },
      });
    }
  });

  // Sort by timestamp descending
  return activities.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Derive skills from projects and code content
 */
export function deriveSkills(projects: Project[]): string[] {
  const skills = new Set<string>();

  // Language keywords mapping
  const languageMap: Record<string, string> = {
    python: "Python",
    javascript: "JavaScript",
    typescript: "TypeScript",
    html: "HTML",
    css: "CSS",
    json: "JSON",
  };

  // Code keywords to detect
  const codeKeywords: Record<string, string> = {
    jwt: "JWT",
    "rest api": "REST API",
    oauth: "OAuth",
    docker: "Docker",
    sql: "SQL",
    graphql: "GraphQL",
    react: "React",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    postgresql: "PostgreSQL",
    mongodb: "MongoDB",
    aws: "AWS",
    git: "Git",
    express: "Express",
    flask: "Flask",
    django: "Django",
    fastapi: "FastAPI",
    nextjs: "Next.js",
    "next.js": "Next.js",
    vue: "Vue",
    angular: "Angular",
    redis: "Redis",
    mysql: "MySQL",
    typescript: "TypeScript",
    tailwind: "Tailwind CSS",
    bootstrap: "Bootstrap",
  };

  projects.forEach((project) => {
    // Add language skill
    if (project.language && languageMap[project.language]) {
      skills.add(languageMap[project.language]);
    }

    // Scan project files for keywords
    try {
      const files = getProjectFiles(project.id);
      const allContent = files.map((f) => f.content.toLowerCase()).join(" ");

      // Check for keywords in code
      Object.entries(codeKeywords).forEach(([keyword, skillName]) => {
        if (allContent.includes(keyword.toLowerCase())) {
          skills.add(skillName);
        }
      });

      // Additional pattern detection
      if (allContent.includes("import react") || allContent.includes("from react")) {
        skills.add("React");
      }
      if (allContent.includes("require('express") || allContent.includes("from express")) {
        skills.add("Express");
      }
      if (allContent.includes("from flask") || allContent.includes("import flask")) {
        skills.add("Flask");
      }
      if (allContent.includes("from django") || allContent.includes("import django")) {
        skills.add("Django");
      }
      if (allContent.includes("from fastapi") || allContent.includes("import fastapi")) {
        skills.add("FastAPI");
      }
      if (allContent.includes("postgres") || allContent.includes("psycopg")) {
        skills.add("PostgreSQL");
      }
      if (allContent.includes("mongodb") || allContent.includes("pymongo")) {
        skills.add("MongoDB");
      }
      if (allContent.includes("redis") || allContent.includes("import redis")) {
        skills.add("Redis");
      }
    } catch (error) {
      // Silently skip if files can't be read
    }
  });

  return Array.from(skills).sort();
}

/**
 * Format timestamp as "time ago" string
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(timestamp).toLocaleDateString();
}






