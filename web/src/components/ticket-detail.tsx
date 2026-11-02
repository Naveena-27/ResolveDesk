
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ErrorNote,
  PriorityTag,
  SentimentTag,
  StatusTag,
} from "@/components/ticket-bits";

import {
  api,
  ApiError,
  type Ticket,
  type TicketCategory,
  type TicketPriority,
  type UpdateTicketInput,
} from "@/lib/api";

import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  shortId,
  timeAgo,
} from "@/lib/labels";

const selectClass =
  "w-full rounded-lg border border-rule bg-surface px-3 py-2 text-sm focus:border-plum focus:outline-none";

export function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // ========================================
  // AUTHENTICATION ERROR HANDLING
  // ========================================

  function handleError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      sessionStorage.removeItem("agentToken");
      router.replace("/login");
      return;
    }

    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong."
    );
  }

  // ========================================
  // LOAD TICKET
  // ========================================

  useEffect(() => {
    const token = sessionStorage.getItem("agentToken");

    if (!token) {
      router.replace("/login");
      return;
    }

    let active = true;

    api
      .getTicket(id)
      .then((t) => {
        if (!active) return;

        setTicket(t);
        setReply(t.finalReply ?? t.suggestedReply);
      })
      .catch((err: unknown) => {
        if (!active) return;

        if (err instanceof ApiError && err.status === 401) {
          sessionStorage.removeItem("agentToken");
          router.replace("/login");
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load ticket."
        );
      });

    return () => {
      active = false;
    };
  }, [id, router]);

  // ========================================
  // UPDATE TICKET
  // ========================================

  async function run(
    label: string,
    action: () => Promise<Ticket>,
    done: string,
  ): Promise<Ticket | undefined> {
    setBusy(label);
    setError(null);
    setNotice(null);

    try {
      const updated = await action();

      setTicket(updated);
      setNotice(done);

      return updated;
    } catch (err) {
      handleError(err);
      return undefined;
    } finally {
      setBusy(null);
    }
  }

  const update = (
    input: UpdateTicketInput,
    label: string,
    done: string,
  ) => run(label, () => api.updateTicket(id, input), done);

  // ========================================
  // RUN AI TRIAGE AGAIN
  // ========================================

  async function retriage() {
    const updated = await run(
      "retriage",
      () => api.retriage(id),
      "AI triage updated.",
    );

    if (updated && !updated.finalReply) {
      setReply(updated.suggestedReply);
    }
  }

  // ========================================
  // DELETE TICKET
  // ========================================

  async function remove() {
    if (!window.confirm("Delete this ticket? This can't be undone.")) {
      return;
    }

    setBusy("delete");
    setError(null);

    try {
      await api.deleteTicket(id);
      router.push("/dashboard");
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(null);
    }
  }

  // ========================================
  // LOADING / ERROR
  // ========================================

  if (!ticket) {
    return error ? (
      <ErrorNote message={error} />
    ) : (
      <p className="text-muted">Loading ticket…</p>
    );
  }

  const resolved = ticket.status === "resolved";

  // ========================================
  // TICKET DETAILS UI
  // ========================================

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard"
        className="text-sm text-muted hover:text-ink"
      >
        ← Back to queue
      </Link>

      {/* HEADER */}

      <header className="!mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted">
            Ticket #{shortId(ticket.id)}
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {ticket.subject}
          </h1>
        </div>

        <StatusTag status={ticket.status} />
      </header>

      {/* ERROR AND SUCCESS MESSAGES */}

      {error && <ErrorNote message={error} />}

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-plum/20 bg-plum-soft px-4 py-3 text-sm text-plum"
        >
          {notice}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* CUSTOMER DETAILS */}

        <div className="space-y-6">
          <article className="rounded-2xl border border-rule bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <span className="font-semibold">
                  {ticket.customerName}
                </span>{" "}
                <a
                  href={`mailto:${ticket.customerEmail}`}
                  className="text-sm text-muted hover:text-ink"
                >
                  {ticket.customerEmail}
                </a>
              </p>

              <time
                dateTime={ticket.createdAt}
                className="text-sm text-muted"
              >
                {new Date(ticket.createdAt).toLocaleString()} (
                {timeAgo(ticket.createdAt)})
              </time>
            </div>

            <p className="mt-4 max-w-prose whitespace-pre-wrap leading-relaxed">
              {ticket.message}
            </p>
          </article>

          {/* CUSTOMER REPLY */}

          <section className="rounded-2xl border border-rule bg-surface p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">
                Your reply
              </h2>

              {!ticket.finalReply && (
                <p className="text-sm text-muted">
                  Drafted by AI. Check it and edit before saving.
                </p>
              )}
            </div>

            <textarea
              aria-label="Reply to customer"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={9}
              className="mt-3 w-full resize-y rounded-lg border border-rule bg-canvas/40 px-3 py-2 leading-relaxed focus:border-plum focus:outline-none"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                disabled={busy !== null || !reply.trim()}
                onClick={() =>
                  update(
                    {
                      finalReply: reply,
                      status: "resolved",
                    },
                    "resolve",
                    "Reply saved and ticket resolved.",
                  )
                }
                className="rounded-lg bg-plum px-4 py-2 font-medium text-white hover:bg-plum-dark disabled:opacity-60"
              >
                {busy === "resolve"
                  ? "Saving…"
                  : "Save reply and resolve"}
              </button>

              <button
                disabled={busy !== null || !reply.trim()}
                onClick={() =>
                  update(
                    { finalReply: reply },
                    "save",
                    "Reply saved.",
                  )
                }
                className="rounded-lg border border-rule px-4 py-2 font-medium hover:border-ink/40 disabled:opacity-60"
              >
                {busy === "save"
                  ? "Saving…"
                  : "Save draft"}
              </button>

              {ticket.finalReply &&
                reply !== ticket.suggestedReply && (
                  <button
                    onClick={() =>
                      setReply(ticket.suggestedReply)
                    }
                    className="px-1 text-sm text-muted underline underline-offset-4 hover:text-ink"
                  >
                    Use the AI draft instead
                  </button>
                )}
            </div>

            <p className="mt-3 text-xs text-muted">
              This demo saves the reply; it doesn&apos;t
              send an email.
            </p>
          </section>
        </div>

        {/* AI TRIAGE */}

        <aside className="space-y-6">
          <section className="rounded-2xl border border-rule bg-surface p-6">
            <h2 className="text-lg font-semibold">
              AI triage
            </h2>

            <p className="mt-3 leading-relaxed">
              {ticket.summary}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <PriorityTag priority={ticket.priority} />
              <SentimentTag sentiment={ticket.sentiment} />
            </div>

            <div className="mt-5 space-y-4">
              {/* PRIORITY */}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Priority
                </span>

                <select
                  value={ticket.priority}
                  disabled={busy !== null}
                  onChange={(e) =>
                    update(
                      {
                        priority:
                          e.target.value as TicketPriority,
                      },
                      "priority",
                      "Priority changed.",
                    )
                  }
                  className={selectClass}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_LABEL[p]}
                    </option>
                  ))}
                </select>
              </label>

              {/* CATEGORY */}

              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  Category
                </span>

                <select
                  value={ticket.category}
                  disabled={busy !== null}
                  onChange={(e) =>
                    update(
                      {
                        category:
                          e.target.value as TicketCategory,
                      },
                      "category",
                      "Category changed.",
                    )
                  }
                  className={selectClass}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-4 text-sm">
              <span className="text-muted">
                {ticket.triageSource === "openai"
                  ? "Sorted by OpenAI"
                  : "Sorted by keyword rules (no AI key)"}
              </span>

              <button
                onClick={retriage}
                disabled={busy !== null}
                className="shrink-0 font-medium text-plum hover:underline disabled:opacity-60"
              >
                {busy === "retriage"
                  ? "Running…"
                  : "Run AI again"}
              </button>
            </div>
          </section>

          {/* STATUS MANAGEMENT */}

          <section className="space-y-3 rounded-2xl border border-rule bg-surface p-6 text-sm">
            <h2 className="text-lg font-semibold">
              Status
            </h2>

            {ticket.status === "open" && (
              <button
                disabled={busy !== null}
                onClick={() =>
                  update(
                    { status: "in_progress" },
                    "start",
                    "Marked as in progress.",
                  )
                }
                className="w-full rounded-lg border border-rule px-4 py-2 font-medium hover:border-ink/40 disabled:opacity-60"
              >
                Start working on it
              </button>
            )}

            {resolved ? (
              <>
                <p className="text-muted">
                  Resolved{" "}
                  {ticket.resolvedAt
                    ? timeAgo(ticket.resolvedAt)
                    : ""}
                  .
                </p>

                <button
                  disabled={busy !== null}
                  onClick={() =>
                    update(
                      { status: "open" },
                      "reopen",
                      "Ticket reopened.",
                    )
                  }
                  className="w-full rounded-lg border border-rule px-4 py-2 font-medium hover:border-ink/40 disabled:opacity-60"
                >
                  Reopen ticket
                </button>
              </>
            ) : (
              <button
                disabled={busy !== null}
                onClick={() =>
                  update(
                    { status: "resolved" },
                    "resolve-only",
                    "Ticket resolved.",
                  )
                }
                className="w-full rounded-lg border border-rule px-4 py-2 font-medium hover:border-ink/40 disabled:opacity-60"
              >
                Resolve without reply
              </button>
            )}

            <button
              disabled={busy !== null}
              onClick={remove}
              className="w-full px-4 py-2 font-medium text-urgent hover:underline disabled:opacity-60"
            >
              Delete ticket
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
