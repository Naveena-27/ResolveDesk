
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { QueuePressure } from "@/components/queue-pressure";
import {
  ErrorNote,
  PRIORITY_BG,
  PriorityTag,
  SentimentTag,
  StatusTag,
} from "@/components/ticket-bits";

import {
  api,
  ApiError,
  type TicketCategory,
  type TicketList,
  type TicketPriority,
  type TicketStats,
  type TicketStatus,
} from "@/lib/api";

import {
  CATEGORIES,
  CATEGORY_LABEL,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUSES,
  timeAgo,
} from "@/lib/labels";

const PAGE_SIZE = 15;

const selectClass =
  "rounded-lg border border-rule bg-surface px-3 py-2 text-sm focus:border-plum focus:outline-none";

export default function QueuePage() {
  const router = useRouter();

  // Authentication
  const [authenticated, setAuthenticated] = useState(false);

  // Filters
  const [status, setStatus] = useState<TicketStatus | "">("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Data
  const [list, setList] = useState<TicketList | null>(null);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ========================================
  // AUTHENTICATION CHECK
  // ========================================

  useEffect(() => {
    const token = sessionStorage.getItem("agentToken");

    if (!token) {
      router.replace("/login");
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  // ========================================
  // LOGOUT
  // ========================================

  function logout() {
    sessionStorage.removeItem("agentToken");
    setAuthenticated(false);
    router.replace("/login");
  }

  // ========================================
  // SEARCH DEBOUNCE
  // ========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // ========================================
  // LOAD TICKETS AND STATISTICS
  // ========================================

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [ticketList, ticketStats] = await Promise.all([
        api.listTickets({
          status: status || undefined,
          category: category || undefined,
          priority: priority || undefined,
          search: search || undefined,
          page,
          limit: PAGE_SIZE,
        }),
        api.getStats(),
      ]);

      setList(ticketList);
      setStats(ticketStats);
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        sessionStorage.removeItem("agentToken");
        setAuthenticated(false);
        router.replace("/login");
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load tickets."
      );
    } finally {
      setLoading(false);
    }
  }, [status, category, priority, search, page, router]);

  useEffect(() => {
    if (!authenticated) return;

    void load();
  }, [authenticated, load]);

  // ========================================
  // PAGINATION
  // ========================================

  const filtered = Boolean(
    status || category || priority || search
  );

  const totalPages = list
    ? Math.max(1, Math.ceil(list.total / PAGE_SIZE))
    : 1;

  // ========================================
  // WAIT FOR AUTHENTICATION
  // ========================================

  if (!authenticated) {
    return (
      <div className="py-12 text-center text-sm text-muted">
        Checking login...
      </div>
    );
  }

  // ========================================
  // DASHBOARD UI
  // ========================================

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">
            Queue
          </h1>

          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-rule bg-surface px-3 py-2 text-sm hover:bg-canvas"
          >
            Logout
          </button>
        </div>

        <p className="text-sm text-muted">
          Most urgent first, then newest.
        </p>
      </div>

      {/* QUEUE STATISTICS */}

      {stats && <QueuePressure stats={stats} />}

      {/* FILTERS */}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div
          role="tablist"
          aria-label="Filter by status"
          className="flex rounded-lg border border-rule bg-surface p-1 text-sm"
        >
          {(["", ...STATUSES] as const).map((s) => (
            <button
              key={s || "all"}
              role="tab"
              aria-selected={status === s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`rounded-md px-3 py-1.5 ${
                status === s
                  ? "bg-ink font-medium text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {s ? STATUS_LABEL[s] : "All"}
            </button>
          ))}
        </div>

        <div className="flex flex-1 flex-wrap gap-3">
          {/* CATEGORY FILTER */}

          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              setCategory(
                e.target.value as TicketCategory | ""
              );
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All categories</option>

            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>

          {/* PRIORITY FILTER */}

          <select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => {
              setPriority(
                e.target.value as TicketPriority | ""
              );
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All priorities</option>

            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>

          {/* SEARCH */}

          <input
            type="search"
            aria-label="Search tickets"
            placeholder="Search by subject, message, name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={`${selectClass} min-w-56 flex-1`}
          />
        </div>
      </div>

      {/* ERROR MESSAGE */}

      {error && <ErrorNote message={error} />}

      {/* EMPTY QUEUE */}

      {list && list.data.length === 0 && (
        <div className="rounded-2xl border border-dashed border-rule px-6 py-14 text-center">
          {filtered ? (
            <p className="text-muted">
              No tickets match these filters. Clear a filter
              to see more.
            </p>
          ) : (
            <>
              <p className="font-medium">
                The queue is empty.
              </p>

              <p className="mt-1 text-muted">
                <Link
                  href="/"
                  className="text-plum underline underline-offset-4"
                >
                  Submit a test request
                </Link>{" "}
                to see how the AI sorts it.
              </p>
            </>
          )}
        </div>
      )}

      {/* TICKET LIST */}

      {list && list.data.length > 0 && (
        <ul
          aria-busy={loading}
          className={`divide-y divide-rule overflow-hidden rounded-2xl border border-rule bg-surface ${
            loading ? "opacity-60" : ""
          }`}
        >
          {list.data.map((ticket) => (
            <li
              key={ticket.id}
              className="relative"
            >
              {/* PRIORITY COLOR BAR */}

              <span
                aria-hidden
                className={`absolute inset-y-0 left-0 w-1 ${
                  PRIORITY_BG[ticket.priority]
                }`}
              />

              <Link
                href={`/dashboard/tickets/${ticket.id}`}
                className="grid gap-x-6 gap-y-2 px-5 py-4 pl-6 hover:bg-canvas/60 sm:grid-cols-[1fr_auto]"
              >
                {/* TICKET DETAILS */}

                <div className="min-w-0">
                  <p
                    className={`truncate font-semibold ${
                      ticket.status === "resolved"
                        ? "text-muted"
                        : ""
                    }`}
                  >
                    {ticket.subject}
                  </p>

                  <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                    {ticket.summary}
                  </p>

                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <PriorityTag
                      priority={ticket.priority}
                    />

                    <span className="text-muted">
                      {CATEGORY_LABEL[ticket.category]}
                    </span>

                    <SentimentTag
                      sentiment={ticket.sentiment}
                    />
                  </p>
                </div>

                {/* STATUS AND CUSTOMER */}

                <div className="flex items-center gap-4 text-sm sm:flex-col sm:items-end sm:gap-1.5">
                  <StatusTag
                    status={ticket.status}
                  />

                  <span>
                    {ticket.customerName}
                  </span>

                  <time
                    dateTime={ticket.createdAt}
                    className="text-muted"
                  >
                    {timeAgo(ticket.createdAt)}
                  </time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* PAGINATION */}

      {list && list.total > PAGE_SIZE && (
        <nav
          aria-label="Pages"
          className="flex items-center justify-between text-sm"
        >
          <button
            disabled={page <= 1}
            onClick={() =>
              setPage((previous) => previous - 1)
            }
            className="rounded-lg border border-rule bg-surface px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-muted">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages}
            onClick={() =>
              setPage((previous) => previous + 1)
            }
            className="rounded-lg border border-rule bg-surface px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}
