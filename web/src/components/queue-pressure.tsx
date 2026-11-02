import type { TicketStats } from "@/lib/api";
import { PRIORITIES, PRIORITY_LABEL } from "@/lib/labels";
import { PRIORITY_BG } from "./ticket-bits";

/**
 * One bar showing every unresolved ticket, split by priority.
 * The wider the red, the more the team needs to drop everything.
 */
export function QueuePressure({ stats }: { stats: TicketStats }) {
  const counts = PRIORITIES.map((p) => ({ priority: p, count: stats.unresolvedByPriority[p] ?? 0 }));
  const waiting = counts.reduce((sum, c) => sum + c.count, 0);

  return (
    <section aria-label="Unresolved tickets by priority" className="rounded-2xl border border-rule bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <p className="text-lg">
          <span className="text-4xl font-semibold tracking-tight">{waiting}</span>{" "}
          <span className="text-muted">{waiting === 1 ? "ticket" : "tickets"} waiting for a reply</span>
        </p>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="text-muted">Resolved</dt>
            <dd className="text-lg font-semibold">{stats.resolved}</dd>
          </div>
          <div>
            <dt className="text-muted">Avg. time to resolve</dt>
            <dd className="text-lg font-semibold">
              {stats.avgResolutionHours === null
                ? "No data yet"
                : stats.avgResolutionHours < 1
                  ? "Under 1 h"
                  : `${stats.avgResolutionHours} h`}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-canvas">
        {waiting > 0 &&
          counts.map(({ priority, count }) =>
            count > 0 ? (
              <div
                key={priority}
                className={`${PRIORITY_BG[priority]} h-full transition-[width] duration-500`}
                style={{ width: `${(count / waiting) * 100}%` }}
              />
            ) : null,
          )}
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        {counts.map(({ priority, count }) => (
          <li key={priority} className="flex items-center gap-2">
            <span aria-hidden className={`size-2.5 rounded-full ${PRIORITY_BG[priority]}`} />
            <span className={count === 0 ? "text-muted" : ""}>
              {PRIORITY_LABEL[priority]} <span className="font-semibold">{count}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
