/**
 * In-memory store for active execution sessions
 * In production, this should be replaced with Redis or a proper session store
 */

interface ExecutionSession {
  process: any;
  stdout: string;
  stderr: string;
  filePath: string;
  entryFileName?: string; // Original entry file name (for run history)
  language?: string; // Project language
  startTime: number;
}

const executionSessions = new Map<string, ExecutionSession>();

export function createSession(sessionId: string, session: ExecutionSession) {
  executionSessions.set(sessionId, session);
}

export function getSession(sessionId: string): ExecutionSession | undefined {
  return executionSessions.get(sessionId);
}

export function deleteSession(sessionId: string) {
  executionSessions.delete(sessionId);
}

export function updateSessionStdout(sessionId: string, newStdout: string) {
  const session = executionSessions.get(sessionId);
  if (session) {
    session.stdout = newStdout;
  }
}

export function updateSessionStderr(sessionId: string, newStderr: string) {
  const session = executionSessions.get(sessionId);
  if (session) {
    session.stderr = newStderr;
  }
}

