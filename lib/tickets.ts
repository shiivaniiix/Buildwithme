import { updateStepStatus } from "./steps";

export type Ticket = {
  id: string;
  title: string;
  projectId: string;
  stepId: string;
  status: "open" | "resolved";
  codeContext?: {
    startLine: number;
    endLine: number;
    reason?: string;
  };
};

const storageKey = (projectId: string) =>
  `buildwithme-tickets-${projectId}`;

export function getTickets(projectId: string): Ticket[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(storageKey(projectId));
  return stored ? JSON.parse(stored) : [];
}

export function addTicket(projectId: string, ticket: Ticket) {
  const tickets = getTickets(projectId);
  localStorage.setItem(
    storageKey(projectId),
    JSON.stringify([...tickets, ticket])
  );
}

export function resolveTicket(projectId: string, ticketId: string) {
  const tickets = getTickets(projectId);
  const ticket = tickets.find(t => t.id === ticketId);
  
  const updatedTickets = tickets.map(ticket =>
    ticket.id === ticketId
      ? { ...ticket, status: "resolved" as const }
      : ticket
  );

  localStorage.setItem(
    storageKey(projectId),
    JSON.stringify(updatedTickets)
  );

  // Automatically unblock the related step when ticket is resolved
  if (ticket && typeof window !== "undefined") {
    updateStepStatus(projectId, ticket.stepId, "pending");
  }
}

