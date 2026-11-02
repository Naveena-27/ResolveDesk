import type { TicketCategory, TicketPriority, TicketSentiment, TicketStatus } from "./api";

export const PRIORITIES: TicketPriority[] = ["urgent", "high", "medium", "low"];
export const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved"];
export const CATEGORIES: TicketCategory[] = [
  "billing",
  "technical",
  "account",
  "delivery",
  "product",
  "other",
];

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
};

export const CATEGORY_LABEL: Record<TicketCategory, string> = {
  billing: "Billing",
  technical: "Technical",
  account: "Account",
  delivery: "Delivery",
  product: "Product",
  other: "Other",
};

export const SENTIMENT_LABEL: Record<TicketSentiment, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Upset",
};

/** "3 min ago", "2 h ago", "4 d ago" */
export function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
