"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorNote } from "@/components/ticket-bits";
import { api, type CreateTicketInput, type Ticket } from "@/lib/api";
import { shortId } from "@/lib/labels";

const EMPTY: CreateTicketInput = { customerName: "", customerEmail: "", subject: "", message: "" };

const EXAMPLES: CreateTicketInput[] = [
  {
    customerName: "Amaya Perera",
    customerEmail: "amaya@example.com",
    subject: "Charged twice for order #4521",
    message:
      "Hi, I was charged twice for my order last Friday. I've emailed twice already and nobody replied. Please refund the extra charge, this is really frustrating.",
  },
  {
    customerName: "Kasun Silva",
    customerEmail: "kasun@example.com",
    subject: "Can't log in, password changed",
    message:
      "I got an email saying my password was changed but I didn't do it. Now I can't get into my account. I think someone else has access. Please help.",
  },
  {
    customerName: "Dilini Fernando",
    customerEmail: "dilini@example.com",
    subject: "Love the new app",
    message:
      "Just wanted to say the new app is great. One small thing: could you add a dark mode? Thanks!",
  },
];

const inputClass =
  "w-full rounded-lg border border-rule bg-surface px-3 py-2 text-ink placeholder:text-muted/70 focus:border-plum focus:outline-none";

export default function GetHelpPage() {
  const [form, setForm] = useState<CreateTicketInput>(EMPTY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Ticket | null>(null);
  const [exampleIndex, setExampleIndex] = useState(0);

  const set = (field: keyof CreateTicketInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      setCreated(await api.createTicket(form));
      setForm(EMPTY);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function fillExample() {
    setForm(EXAMPLES[exampleIndex % EXAMPLES.length]);
    setExampleIndex((i) => i + 1);
  }

  if (created) {
    return (
      <section className="mx-auto max-w-xl py-10">
        <h1 className="text-3xl font-semibold tracking-tight">We&apos;ve got your request</h1>
        <p className="mt-3 text-lg text-muted">
          Your reference number is{" "}
          <strong className="font-semibold text-ink">#{shortId(created.id)}</strong>. We&apos;ll
          reply to {created.customerEmail}.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => setCreated(null)}
            className="rounded-lg border border-rule bg-surface px-4 py-2 font-medium hover:border-ink/40"
          >
            Send another request
          </button>
          <Link
            href={`/dashboard/tickets/${created.id}`}
            className="rounded-lg bg-plum px-4 py-2 font-medium text-white hover:bg-plum-dark"
          >
            See it as an agent
          </Link>
        </div>
        <p className="mt-3 text-sm text-muted">
          The agent view is part of this demo, so you can see how the AI sorted the ticket.
        </p>
      </section>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
      <section className="lg:pt-6">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Tell us what went wrong.
        </h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted">
          Write it in your own words. Your message is read and sorted the moment you send it, so
          urgent problems like account access or wrong charges reach an agent first.
        </p>

        <dl className="mt-10 max-w-md space-y-5 border-l-2 border-plum/30 pl-5 text-sm">
          <div>
            <dt className="font-semibold">Wrong charge or refund?</dt>
            <dd className="text-muted">Include the order number if you have it.</dd>
          </div>
          <div>
            <dt className="font-semibold">Can&apos;t get into your account?</dt>
            <dd className="text-muted">Tell us the email address you sign in with.</dd>
          </div>
          <div>
            <dt className="font-semibold">Something not working?</dt>
            <dd className="text-muted">Say what you tried and what happened.</dd>
          </div>
        </dl>
      </section>

      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-2xl border border-rule bg-surface p-6 sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Your name</span>
            <input required maxLength={120} value={form.customerName} onChange={set("customerName")} className={inputClass} autoComplete="name" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Email</span>
            <input required type="email" maxLength={200} value={form.customerEmail} onChange={set("customerEmail")} className={inputClass} autoComplete="email" />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Subject</span>
          <input
            required
            minLength={3}
            maxLength={200}
            value={form.subject}
            onChange={set("subject")}
            placeholder="e.g. Charged twice for my order"
            className={inputClass}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">What happened?</span>
          <textarea
            required
            minLength={10}
            maxLength={5000}
            rows={7}
            value={form.message}
            onChange={set("message")}
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </label>

        {error && <ErrorNote message={error} />}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={fillExample}
            className="text-sm text-muted underline decoration-rule underline-offset-4 hover:text-ink"
          >
            Fill with an example
          </button>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-plum px-5 py-2.5 font-medium text-white hover:bg-plum-dark disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send request"}
          </button>
        </div>
      </form>
    </div>
  );
}
