
// Typed client for the ResolveDesk NestJS API.
// API documentation: http://localhost:4000/api/docs

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// ================================
// TICKET TYPES
// ================================

export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved";

export type TicketCategory =
  | "billing"
  | "technical"
  | "account"
  | "delivery"
  | "product"
  | "other";

export type TicketPriority =
  | "low"
  | "medium"
  | "high"
  | "urgent";

export type TicketSentiment =
  | "positive"
  | "neutral"
  | "negative";

// ================================
// TICKET INTERFACES
// ================================

export interface Ticket {
  id: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
  status: TicketStatus;
  finalReply: string | null;
  resolvedAt: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  sentiment: TicketSentiment;
  summary: string;
  suggestedReply: string;
  triageSource: "openai" | "rules";
  createdAt: string;
  updatedAt: string;
}

export interface TicketList {
  data: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  urgentOpen: number;
  byCategory: Partial<Record<TicketCategory, number>>;
  bySentiment: Partial<Record<TicketSentiment, number>>;
  unresolvedByPriority: Partial<Record<TicketPriority, number>>;
  avgResolutionHours: number | null;
}

// ================================
// INPUT TYPES
// ================================

export interface CreateTicketInput {
  customerName: string;
  customerEmail: string;
  subject: string;
  message: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  finalReply?: string;
}

export interface TicketFilters {
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  search?: string;
  page?: number;
  limit?: number;
}

// ================================
// ERROR HANDLING
// ================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ================================
// JWT AUTHENTICATION
// ================================

// Retrieve the agent JWT from browser session storage.
// Development-only approach; use secure HttpOnly cookies
// before deploying to production.

function getAgentToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem("agentToken");
}

// ================================
// API REQUEST FUNCTION
// ================================

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = getAgentToken();

  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  // Customers can submit tickets without authentication.
  const isPublicTicketSubmission =
    path === "/tickets" &&
    init?.method?.toUpperCase() === "POST";

  // Add JWT token to protected API requests.
  if (token && !isPublicTicketSubmission) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;

  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Can't reach the API at ${API_URL}. Check that the backend is running.`,
      0,
    );
  }

  // Handle unsuccessful responses.
  if (!res.ok) {
    const body = await res.json().catch(() => null);

    const message = Array.isArray(body?.message)
      ? body.message.join(". ")
      : (body?.message ??
        `Request failed with status ${res.status}`);

    // Expired or invalid token.
    if (res.status === 401 && !isPublicTicketSubmission) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("agentToken");
      }
    }

    throw new ApiError(message, res.status);
  }

  // DELETE requests may return no content.
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

// ================================
// API METHODS
// ================================

export const api = {
  // Get all tickets with optional filters.
  listTickets(filters: TicketFilters = {}) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }

    const qs = params.toString();

    return request<TicketList>(
      `/tickets${qs ? `?${qs}` : ""}`,
    );
  },

  // Get dashboard statistics.
  getStats: () =>
    request<TicketStats>("/tickets/stats"),

  // Get a single ticket.
  getTicket: (id: string) =>
    request<Ticket>(`/tickets/${id}`),

  // Public customer ticket submission.
  createTicket: (input: CreateTicketInput) =>
    request<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  // Update ticket status, category, priority or reply.
  updateTicket: (
    id: string,
    input: UpdateTicketInput,
  ) =>
    request<Ticket>(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),

  // Run AI triage again.
  retriage: (id: string) =>
    request<Ticket>(`/tickets/${id}/retriage`, {
      method: "POST",
    }),

  // Delete a ticket.
  deleteTicket: (id: string) =>
    request<void>(`/tickets/${id}`, {
      method: "DELETE",
    }),
};
