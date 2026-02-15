export type Project = {
  id: string;
  name: string;
  description?: string;
  language?: "python" | "javascript" | "typescript" | "html" | "css" | "json" | "c" | "cpp" | "java" | "mysql";
  entryFile?: string; // Explicitly stored entry file name
  lastOpenedAt?: number;
  updatedAt?: number;
  createdAt?: number;
  shared?: boolean; // Legacy field - use isPublic instead
  ownerId?: string;
  // Public sharing fields
  isPublic?: boolean; // Default: false - project is private unless explicitly shared
  sharedAt?: number; // Timestamp when project was shared
  sharedBy?: string; // User ID who shared the project
  shareDescription?: string; // Description for sharing (can differ from project description)
  tags?: string[]; // Tags for discovery (max 5)
  // Engagement metrics (for community posts)
  likesCount?: number; // Number of likes on this post
  commentsCount?: number; // Number of comments on this post
  downloadsCount?: number; // Number of downloads/opens/forks
  postType?: "project" | "question"; // Type of post (default: "project")
  comments?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string | number; // ISO string or timestamp
  }>; // Comments on this post
  attachments?: Array<{
    id: string;
    name: string;
    url: string; // URL or data URL for the attachment
    type: string; // MIME type (e.g., "image/png", "application/pdf")
    size?: number; // File size in bytes
  }>; // Attachments (files, images, etc.) for this post
  // Selective sharing fields
  shareType?: "full_project" | "specific_file" | "code_snippet" | "text_only"; // What type of content is shared
  sharedFileName?: string; // Name of the specific file being shared (if shareType === "specific_file")
  sharedFileContent?: string; // Content of the specific file being shared
  sharedSnippetFile?: string; // File name for code snippet (if shareType === "code_snippet")
  sharedSnippetLines?: { start: number; end: number }; // Line range for code snippet
  sharedSnippetContent?: string; // Actual code snippet content
};

const STORAGE_KEY = "buildwithme-projects";
const POSTS_STORAGE_KEY = "buildwithme-community-posts";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addProject(project: Project) {
  const projects = getProjects();
  const projectWithMetadata = {
    ...project,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastOpenedAt: Date.now(),
  };
  const updated = [...projects, projectWithMetadata];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getProjectById(id: string): Project | undefined {
  // First check projects storage
  const project = getProjects().find(p => p.id === id);
  if (project) return project;
  // Then check community posts storage
  const post = getCommunityPosts().find(p => p.id === id);
  return post;
}

export function updateProjectLanguage(projectId: string, language: Project["language"]) {
  const projects = getProjects();
  const updated = projects.map(p => 
    p.id === projectId ? { ...p, language, updatedAt: Date.now() } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateProject(projectId: string, updates: Partial<Pick<Project, "name" | "description">>) {
  const projects = getProjects();
  const updated = projects.map(p => 
    p.id === projectId ? { ...p, ...updates, updatedAt: Date.now() } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateProjectEntryFile(projectId: string, entryFile: string | undefined) {
  const projects = getProjects();
  const updated = projects.map(p => 
    p.id === projectId ? { ...p, entryFile, updatedAt: Date.now() } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function deleteProject(projectId: string) {
  const projects = getProjects();
  const updated = projects.filter(p => p.id !== projectId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function updateProjectLastOpened(projectId: string) {
  const projects = getProjects();
  const updated = projects.map(p => 
    p.id === projectId ? { ...p, lastOpenedAt: Date.now() } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getSortedProjects(): Project[] {
  const projects = getProjects();
  // Filter out standalone community posts (questions without project link)
  // Only show actual projects in the dashboard
  // Standalone posts have IDs starting with "post_" and are stored separately
  const actualProjects = projects.filter(p => {
    // Exclude standalone question posts (they're stored in community posts storage)
    // Posts linked to projects will have the project's ID, not "post_"
    return !p.id.startsWith("post_");
  });
  return actualProjects.sort((a, b) => {
    // Primary: Most recently opened
    const aLastOpened = a.lastOpenedAt || 0;
    const bLastOpened = b.lastOpenedAt || 0;
    if (aLastOpened !== bLastOpened) {
      return bLastOpened - aLastOpened;
    }
    // Secondary: Most recently updated
    const aUpdated = a.updatedAt || a.createdAt || 0;
    const bUpdated = b.updatedAt || b.createdAt || 0;
    return bUpdated - aUpdated;
  });
}

/**
 * Get current user ID (placeholder - should integrate with auth system)
 */
export function getCurrentUserId(): string {
  // For now, use a default user ID
  // In production, this should come from auth context
  return "user_default";
}

/**
 * Check if a project is in view-only mode for the current user
 */
export function isViewOnlyMode(project: Project): boolean {
  const currentUserId = getCurrentUserId();
  // Check both legacy shared field and new isPublic field
  const isShared = project.isPublic === true || project.shared === true;
  return isShared && project.ownerId !== currentUserId;
}

/**
 * Check if current user is the owner of a project
 */
export function isProjectOwner(project: Project): boolean {
  const currentUserId = getCurrentUserId();
  return project.ownerId === currentUserId;
}

/**
 * Share a project to the community (make it public)
 */
export function shareProject(
  projectId: string,
  shareData: {
    shareDescription?: string;
    tags?: string[];
  }
): void {
  const projects = getProjects();
  const currentUserId = getCurrentUserId();
  const updated = projects.map(p => {
    if (p.id === projectId) {
      return {
        ...p,
        isPublic: true,
        shared: true, // Keep legacy field for backward compatibility
        sharedAt: Date.now(),
        sharedBy: currentUserId,
        shareDescription: shareData.shareDescription,
        tags: shareData.tags || [],
        updatedAt: Date.now(),
      };
    }
    return p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Unshare a project (make it private)
 */
export function unshareProject(projectId: string): void {
  const projects = getProjects();
  const updated = projects.map(p => {
    if (p.id === projectId) {
      return {
        ...p,
        isPublic: false,
        shared: false,
        updatedAt: Date.now(),
      };
    }
    return p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Update sharing metadata (description, tags) for a shared project
 */
export function updateProjectSharing(
  projectId: string,
  updates: {
    shareDescription?: string;
    tags?: string[];
  }
): void {
  const projects = getProjects();
  const updated = projects.map(p => {
    if (p.id === projectId) {
      return {
        ...p,
        ...updates,
        updatedAt: Date.now(),
      };
    }
    return p;
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Get all public/shared projects
 */
/**
 * Get all community posts (from both projects storage and posts storage)
 */
function getCommunityPosts(): Project[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(POSTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Save a community post (standalone question, not linked to a project)
 */
export function addCommunityPost(post: Project) {
  const posts = getCommunityPosts();
  const postWithMetadata = {
    ...post,
    createdAt: post.createdAt || Date.now(),
    updatedAt: post.updatedAt || Date.now(),
  };
  const updated = [...posts, postWithMetadata];
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Delete a community post (standalone question)
 */
export function deleteCommunityPost(postId: string): void {
  const posts = getCommunityPosts();
  const updated = posts.filter(p => p.id !== postId);
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(updated));
}

export function getPublicProjects(): Project[] {
  // Get public projects from projects storage
  const publicProjects = getProjects().filter(p => p.isPublic === true || p.shared === true);
  // Get all community posts (standalone questions)
  const communityPosts = getCommunityPosts();
  // Combine both
  return [...publicProjects, ...communityPosts];
}
