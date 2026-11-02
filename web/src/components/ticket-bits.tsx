import type { TicketPriority, TicketSentiment, TicketStatus } from "@/lib/api";
import { PRIORITY_LABEL, SENTIMENT_LABEL, STATUS_LABEL } from "@/lib/labels";

export const PRIORITY_BG: Record<TicketPriority, string> = {
  urgent: "bg-urgent",
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

const PRIORITY_TEXT: Record<TicketPriority, string> = {
  urgent: "text-urgent",
  high: "text-high",
  medium: "text-medium",
  low: "text-low",
};

export function PriorityTag({ priority }: { priority: TicketPriority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${PRIORITY_TEXT[priority]}`}>
      <span aria-hidden className={`size-2 rounded-full ${PRIORITY_BG[priority]}`} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

const STATUS_STYLE: Record<TicketStatus, string> = {
  open: "border-ink/20 text-ink",
  in_progress: "border-medium/40 bg-medium/5 text-medium",
  resolved: "border-transparent bg-canvas text-muted",
};

export function StatusTag({ status }: { status: TicketStatus }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

const SENTIMENT_FACE: Record<TicketSentiment, string> = {
  positive: "🙂",
  neutral: "😐",
  negative: "😠",
};

export function SentimentTag({ sentiment }: { sentiment: TicketSentiment }) {
  return (
    <span className="text-sm text-muted">
      <span aria-hidden>{SENTIMENT_FACE[sentiment]}</span> {SENTIMENT_LABEL[sentiment]}
    </span>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-urgent/30 bg-urgent/5 px-4 py-3 text-sm text-urgent">
      {message}
    </p>
  );
}
