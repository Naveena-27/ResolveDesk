"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { API_URL } from "@/lib/api";

const links = [
  { href: "/", label: "Get help" },
  { href: "/dashboard", label: "Agent queue" },
];

export function SiteHeader() {
  return <HeaderView pathname={usePathname()} />;
}

/** Plain header markup; rendered with pathname=null as the Suspense fallback. */
export function HeaderView({ pathname }: { pathname: string | null }) {
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="grid size-6 place-items-center rounded-md bg-plum text-xs font-bold text-white"
          >
            R
          </span>
          ResolveDesk
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {links.map(({ href, label }) => {
            const active = href === "/" ? pathname === "/" : Boolean(pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 ${
                  active ? "bg-plum-soft font-medium text-plum" : "text-muted hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <a
          href={`${API_URL}/docs`}
          target="_blank"
          rel="noreferrer"
          className="ml-auto hidden text-sm text-muted hover:text-ink sm:block"
        >
          API docs
        </a>
      </div>
    </header>
  );
}
