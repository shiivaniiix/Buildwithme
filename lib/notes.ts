/**
 * Notes Data Model and Storage Utilities
 * 
 * Note types:
 * - manual: User-written notes
 * - ai-learn: AI-generated from Learn topic
 * - ai-project: AI-generated from Project context
 */

export type NoteType = "manual" | "ai-learn" | "ai-project";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string; // Markdown content
  type: NoteType;
  topic?: string; // For ai-learn notes
  projectId?: string; // For ai-project notes
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "buildwithme_notes";

/**
 * Get all notes for the current user
 */
export function getAllNotes(): Note[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const notes: Note[] = JSON.parse(stored);
    // Filter by current user (for now, use a default userId)
    const userId = getCurrentUserId();
    return notes.filter((note) => note.userId === userId);
  } catch (error) {
    console.error("Error loading notes:", error);
    return [];
  }
}

/**
 * Get a note by ID
 */
export function getNoteById(id: string): Note | null {
  const notes = getAllNotes();
  return notes.find((note) => note.id === id) || null;
}

/**
 * Save a new note
 */
export function createNote(note: Omit<Note, "id" | "createdAt" | "updatedAt">): Note {
  const newNote: Note = {
    ...note,
    id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const notes = getAllNotes();
  notes.push(newNote);
  saveNotes(notes);
  
  return newNote;
}

/**
 * Update an existing note
 */
export function updateNote(id: string, updates: Partial<Omit<Note, "id" | "createdAt" | "userId">>): Note | null {
  const notes = getAllNotes();
  const index = notes.findIndex((note) => note.id === id);
  
  if (index === -1) return null;
  
  notes[index] = {
    ...notes[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  saveNotes(notes);
  return notes[index];
}

/**
 * Delete a note
 */
export function deleteNote(id: string): boolean {
  const notes = getAllNotes();
  const filtered = notes.filter((note) => note.id !== id);
  
  if (filtered.length === notes.length) return false;
  
  saveNotes(filtered);
  return true;
}

/**
 * Get notes filtered by type
 */
export function getNotesByType(type: NoteType): Note[] {
  return getAllNotes().filter((note) => note.type === type);
}

/**
 * Get notes filtered by topic
 */
export function getNotesByTopic(topic: string): Note[] {
  return getAllNotes().filter((note) => note.topic === topic);
}

/**
 * Get notes filtered by project
 */
export function getNotesByProject(projectId: string): Note[] {
  return getAllNotes().filter((note) => note.projectId === projectId);
}

/**
 * Internal: Save notes to localStorage
 */
function saveNotes(notes: Note[]): void {
  if (typeof window === "undefined") return;
  
  try {
    // Get all notes (including other users for now)
    const stored = localStorage.getItem(STORAGE_KEY);
    const allNotes: Note[] = stored ? JSON.parse(stored) : [];
    const userId = getCurrentUserId();
    
    // Replace notes for current user
    const otherUsersNotes = allNotes.filter((note) => note.userId !== userId);
    const updated = [...otherUsersNotes, ...notes];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving notes:", error);
  }
}

/**
 * Get current user ID (placeholder - should integrate with auth system)
 */
function getCurrentUserId(): string {
  // For now, use a default user ID
  // In production, this should come from auth context
  return "user_default";
}






