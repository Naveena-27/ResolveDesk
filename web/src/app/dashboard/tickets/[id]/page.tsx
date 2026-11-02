import { Suspense } from "react";
import { TicketDetail } from "@/components/ticket-detail";

// The ticket id is only known at request time, so the client component
// that reads it sits inside Suspense (required with cacheComponents).
export default function TicketPage() {
  return (
    <Suspense fallback={<p className="text-muted">Loading ticket…</p>}>
      <TicketDetail />
    </Suspense>
  );
}
