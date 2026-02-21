/**
 * Chat Store
 * 
 * Manages persistent storage of chat sessions and messages.
 * Uses localStorage with database-ready structure.
 */

import type { ChatSession, ChatMessage } from "./models";

export type { ChatSession, ChatMessage };

const SESSIONS_STORAGE_KEY = "buildwithme-codegraph-sessions";
const MESSAGES_STORAGE_KEY = "buildwithme-codegraph-messages";

/**
 * Get current user ID
 */
function getCurrentUserId(): string {
  return "user_default"; // TODO: Integrate with auth system
}

/**
 * Get all chat sessions for current user
 */
export function getChatSessions(): ChatSession[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return [];
  const allSessions: ChatSession[] = JSON.parse(stored);
  const userId = getCurrentUserId();
  return allSessions.filter(s => s.userId === userId);
}

/**
 * Get chat sessions for a specific analysis
 */
export function getSessionsByAnalysisId(analysisId: string): ChatSession[] {
  const sessions = getChatSessions();
  return sessions.filter(s => s.projectAnalysisId === analysisId);
}

/**
 * Get chat session by ID (with userId validation)
 */
export function getChatSessionById(sessionId: string): ChatSession | undefined {
  const sessions = getChatSessions();
  return sessions.find(s => s.id === sessionId);
}

/**
 * Create new chat session
 */
export function createChatSession(
  projectAnalysisId: string,
  title?: string
): ChatSession {
  if (typeof window === "undefined") {
    throw new Error("Cannot create session on server side");
  }

  const userId = getCurrentUserId();
  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  const allSessions: ChatSession[] = stored ? JSON.parse(stored) : [];

  const now = Date.now();
  const session: ChatSession = {
    id: `session-${now}`,
    projectAnalysisId,
    userId,
    title: title || "New Chat",
    createdAt: now,
    updatedAt: now,
  };

  allSessions.push(session);
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
  return session;
}

/**
 * Update chat session title
 */
export function updateChatSession(sessionId: string, updates: { title?: string }): ChatSession | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return null;

  const allSessions: ChatSession[] = JSON.parse(stored);
  const userId = getCurrentUserId();
  const index = allSessions.findIndex(s => s.id === sessionId && s.userId === userId);

  if (index >= 0) {
    allSessions[index] = {
      ...allSessions[index],
      ...updates,
      updatedAt: Date.now(),
    };
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
    return allSessions[index];
  }
  return null;
}

/**
 * Delete chat session (with userId validation)
 */
export function deleteChatSession(sessionId: string): boolean {
  if (typeof window === "undefined") return false;

  const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (!stored) return false;

  const allSessions: ChatSession[] = JSON.parse(stored);
  const userId = getCurrentUserId();
  const filtered = allSessions.filter(s => !(s.id === sessionId && s.userId === userId));

  if (filtered.length < allSessions.length) {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
    // Also delete all messages in this session
    deleteMessagesBySessionId(sessionId);
    return true;
  }
  return false;
}

/**
 * Get messages for a session (limit to last 20)
 */
export function getMessagesBySessionId(sessionId: string, limit: number = 20): ChatMessage[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
  if (!stored) return [];

  const allMessages: ChatMessage[] = JSON.parse(stored);
  const sessionMessages = allMessages
    .filter(m => m.sessionId === sessionId)
    .sort((a, b) => a.createdAt - b.createdAt);

  // Return last N messages
  return sessionMessages.slice(-limit);
}

/**
 * Add message to session
 */
export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): ChatMessage {
  if (typeof window === "undefined") {
    throw new Error("Cannot add message on server side");
  }

  const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
  const allMessages: ChatMessage[] = stored ? JSON.parse(stored) : [];

  const message: ChatMessage = {
    id: `msg-${Date.now()}-${role}`,
    sessionId,
    role,
    content,
    createdAt: Date.now(),
  };

  allMessages.push(message);
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(allMessages));

  // Update session updatedAt
  const sessionStored = localStorage.getItem(SESSIONS_STORAGE_KEY);
  if (sessionStored) {
    const allSessions: ChatSession[] = JSON.parse(sessionStored);
    const sessionIndex = allSessions.findIndex(s => s.id === sessionId);
    if (sessionIndex >= 0) {
      allSessions[sessionIndex].updatedAt = Date.now();
      // Auto-generate title from first user message if title is "New Chat"
      if (role === "user" && allSessions[sessionIndex].title === "New Chat" && content.trim().length > 0) {
        const title = content.trim().length > 50 ? content.trim().substring(0, 50) + "..." : content.trim();
        allSessions[sessionIndex].title = title;
      }
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(allSessions));
    }
  }

  return message;
}

/**
 * Delete all messages for a session
 */
function deleteMessagesBySessionId(sessionId: string): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
  if (!stored) return;

  const allMessages: ChatMessage[] = JSON.parse(stored);
  const filtered = allMessages.filter(m => m.sessionId !== sessionId);
  localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(filtered));
}

