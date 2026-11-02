# ResolveDesk

AI-assisted customer support ticketing. Customers describe a problem in their own words; the API uses the OpenAI API to sort each ticket by **category, priority and sentiment**, write a one-line summary and draft a reply. Support agents work from a queue that always shows the most urgent tickets first.

![Agent queue](docs/queue.png)

| Customer form | Ticket view with AI triage |
|---|---|
| ![Submit form](docs/submit.png) | ![Ticket](docs/ticket.png) |

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST, class-validator DTOs |
| Database | PostgreSQL with TypeORM |
| API docs | OpenAPI 3 generated from the code, Swagger UI at `/api/docs` |
| AI | OpenAI Responses API with structured outputs (Zod schema) |
| Testing | Vitest unit tests |
| Dev setup | Docker Compose for Postgres |

## How it works

```
Customer form (Next.js)
        │  POST /api/tickets
        ▼
NestJS API ── ValidationPipe checks the DTO
        │
        ├── AiService ──► OpenAI (structured output: category, priority,
        │      │           sentiment, summary, suggestedReply)
        │      └── if no key / API error ──► keyword rules fallback
        ▼
PostgreSQL (tickets table)
        ▲
        │  GET /api/tickets?status=&priority=&search=  (urgent first)
Agent dashboard (Next.js) ── edit reply, override AI, resolve
```

A few decisions worth knowing:

- **Structured outputs, not free text.** The model must return JSON that matches a Zod schema, so the API never has to guess what the model meant. The enum values in the schema are the same enums the database uses.
- **AI never blocks the user.** If the OpenAI key is missing or the call fails, a rule-based classifier fills in instead and the ticket is marked `triageSource: "rules"`. Agents can click **Run AI again** later.
- **Humans stay in control.** The AI only drafts. Agents can change the priority or category and must save the reply themselves.
- **Validation at the edge.** DTOs reject unknown fields, bad emails and empty messages with clear 400 errors, and IDs are checked as UUIDs.

## Run it locally

You need **Node.js 20+**, **Docker Desktop** (for Postgres) and, optionally, an **OpenAI API key**.

```bash
# 1. Start Postgres
docker compose up -d

# 2. API (http://localhost:4000/api, docs at /api/docs)
cd api
cp .env.example .env        # Windows PowerShell: copy .env.example .env
#    then paste your OPENAI_API_KEY into .env (optional)
npm install
npm run start:dev

# 3. Frontend (http://localhost:3000) — in a second terminal
cd web
cp .env.example .env.local  # Windows PowerShell: copy .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000, click **Fill with an example**, send it, then open the agent queue.

Without an OpenAI key the app still works using the keyword rules, so you can try it for free. With a key, triage and reply drafts come from the model set in `OPENAI_MODEL`. Check the OpenAI pricing page for current model names and costs; a small "mini" model is plenty here.

> No Docker? Install PostgreSQL directly, create a database called `resolvedesk`, and update `DATABASE_URL` in `api/.env`.

### Tests

```bash
cd api && npm test
```

## API overview

Full interactive docs at `http://localhost:4000/api/docs` (OpenAPI JSON at `/api/docs-json`).

| Method | Path | What it does |
|---|---|---|
| POST | `/api/tickets` | Submit a ticket; AI triage runs before saving |
| GET | `/api/tickets` | List with `status`, `category`, `priority`, `search`, `page`, `limit` |
| GET | `/api/tickets/stats` | Counts for the dashboard |
| GET | `/api/tickets/:id` | One ticket |
| PATCH | `/api/tickets/:id` | Change status, reply, or override priority/category |
| POST | `/api/tickets/:id/retriage` | Run AI triage again |
| DELETE | `/api/tickets/:id` | Delete a ticket |
| GET | `/api/health` | Database and AI status |

## Project structure

```
resolvedesk/
├── docker-compose.yml         Postgres for development
├── api/                       NestJS backend
│   └── src/
│       ├── main.ts            CORS, validation, Swagger setup
│       ├── app.module.ts      Config + TypeORM connection
│       ├── ai/                OpenAI triage, schema, rule-based fallback (+ tests)
│       └── tickets/           Entity, DTOs, controller, service
└── web/                       Next.js frontend
    └── src/
        ├── app/               Pages: / (form), /dashboard, /dashboard/tickets/[id]
        ├── components/        Queue pressure bar, ticket detail, tags
        └── lib/               Typed API client and labels
```

## Deploying

- **Database:** a hosted Postgres such as Neon or Supabase. Set `DB_SSL=true`.
- **API:** Render, Railway or AWS. Set the env vars from `api/.env.example`, and `CORS_ORIGIN` to your frontend URL.
- **Frontend:** Vercel. Set `NEXT_PUBLIC_API_URL` to your API URL plus `/api`.

## What I'd add next

- Database migrations instead of `synchronize` (needed before real data)
- Agent login with JWT and roles
- Sending replies by email, plus a customer page to check ticket status
- Rate limiting on the public form
- e2e tests against a test database
