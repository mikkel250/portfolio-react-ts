# Architecture

> Keep this aggressively current. It is the highest-ROI artifact in the system.
> Agents treat this as ground truth. Stale entries cause more damage than missing entries.
> Update immediately after any architectural decision.

## Stack context (for agents)

**Single source of truth:** language, frameworks, auth, data layer, test runner, deployment, and repo-wide conventions belong **in this file only**—especially **## Stack**, **## Key Directories**, and **## Conventions**. Do not copy the same bullets into Cursor project rules; rules should point here.

**This document answers:**

- **Language:** TypeScript 5.0.2, strict mode (`strict: true` in `tsconfig.json`)
- **Framework:** Next.js 15.5.7 App Router — entry points are `app/layout.tsx`, `app/page.tsx`, and `app/api/**/route.ts`. No `middleware.ts`.
- **Auth:** None — all routes and API endpoints are public
- **Database:** None — no ORM, no raw SQL, no persistent storage
- **State:** React built-in hooks in client components; conversation history and session IDs in browser `localStorage`; server-side rate limiting in an in-memory `Map`
- **Testing:** Vitest (`npm test`) for unit tests under `app/api/lib/__tests__/`; ad-hoc evaluation scripts in `tests/` (`npm run eval:langfuse`)
- **Deployment:** Vercel free tier; API routes use `export const runtime = 'nodejs'` (not Edge)

> **Inferred:** Server Components by default; add `'use client'` only for interactivity (state, effects, event handlers, browser APIs). Confirm if this matches intent.

---

## Project Overview

**What it does:**
A Next.js portfolio site with a production AI recruiting assistant — an expandable three-state chat widget (minimized → compact → maximized) that lets recruiters ask questions about Mikkel's background. Uses a multi-provider LLM architecture with keyword-based RAG over structured markdown knowledge files. Dual purpose: portfolio showcase and functional recruitment tool.

**Primary users:**
Recruiters and hiring managers

**Current phase:** MVP (deployed to production)

See also: `README.md`, `knowledge-base/meta-project.md`

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | TypeScript 5.0.2 | Strict mode; `@/*` path alias → project root |
| Framework | Next.js 15.5.7 (App Router) | `app/` directory; `pageExtensions: ["ts", "tsx"]` |
| UI runtime | React 18.2.0 | Server Components by default *(inferred)* |
| Styling | Tailwind CSS 3.2.7, Sass, Framer Motion 10.x | Aceternity UI / Radix UI component primitives |
| API runtime | Node.js | All API routes set `runtime = 'nodejs'` |
| LLM providers | Google Gemini (`@google/genai`), DeepSeek (`openai` compat), Anthropic Claude (`@anthropic-ai/sdk`), OpenAI (`openai`) | Unified `ChatResponse` interface; `AI_MODEL` then `AI_MODEL_FALLBACKS` JSON array; code defaults when unset: primary → DeepSeek → Anthropic |
| Observability | LangSmith (`langsmith`), Langfuse (`@langfuse/client`, `@langfuse/otel`, `@langfuse/tracing`) | LangSmith traces LLM calls; Langfuse via OpenTelemetry in `instrumentation.ts` |
| Database | None | |
| ORM / Query layer | N/A | |
| Auth | None | |
| Cache | N/A | |
| Queue / Jobs | N/A | |
| File storage | Local markdown | `knowledge-base/` — no blob/S3 storage |
| Email | N/A | |
| Deployment | Vercel (free tier) | `vercel.json`: `framework: nextjs` |
| CI/CD | [TBD] | |
| Package manager | npm | |
| State management | React hooks + `localStorage` | No Redux/Zustand; widget state in `ChatWidget` / `ChatInterface` |

---

## Key Directories

```
app/                       — Next.js App Router pages and API routes
  layout.tsx               — Root layout
  page.tsx                 — Home page
  api/                     — Route Handlers (serverless functions)
    lib/                   — Server-side AI logic (LLM, prompts, RAG, rate limit, observability)
      llm.ts               — Multi-provider LLM abstraction + fallback
      llm-fallback-chain.ts — Provider detection, fallback chain, retryable errors
      prompts.ts           — System prompt construction
      knowledge-base.ts    — Keyword-based RAG retrieval
      rate-limit.ts        — In-memory rate limiting
      langsmith.ts         — LangSmith tracing helpers
      langfuse.ts          — Langfuse tracing helpers
    chat/route.ts          — Main chat endpoint (POST)
    analyze-jd/route.ts    — Job description analysis (POST)
  about/                   — About page
  contributions/           — GitHub contributions page
  events/                  — Events page
  portfolio/               — Portfolio page
  projects/                — Projects page
components/                — React UI (ChatWidget, ChatInterface, Navbar, etc.)
lib/                       — Shared non-API utilities (input-filter, github, formatDate)
knowledge-base/            — Structured markdown knowledge files
  career-story.md
  experience.md
  projects.md
  skills.md
  meta-project.md          — Detailed technical documentation (also for AI context)
  workingDocs/             — Draft/archived versions of knowledge files
tests/                     — Ad-hoc evaluation scripts (not a unit test suite)
scripts/                   — Prompt migration and maintenance scripts
instrumentation.ts         — Langfuse OpenTelemetry bootstrap (Node.js runtime only)
```

---

## Auth Model

**Provider:** None

**Session strategy:** N/A — no user accounts

**Where auth logic lives:** N/A

**Protected route convention:** All routes and API endpoints are public

**Token handling:** N/A

---

## Data Model

No database. All state is ephemeral or client-side:

- **Rate limiting:** In-memory `Map` keyed by client IP in `app/api/lib/rate-limit.ts`; resets on serverless cold start. Default: 15 messages per hour (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW` env vars).
- **Conversation history:** Client-side only (`localStorage` in browser)
- **Knowledge base:** Static markdown files in `knowledge-base/`; retrieved via keyword matching in `app/api/lib/knowledge-base.ts`
- **Session tracking:** Client-generated session ID stored in `localStorage`

---

## API Design

**Style:** REST (Next.js Route Handlers)

**Base path:** `/api/`

**Auth header convention:** None (public API)

**Error shape:** `NextResponse.json({ error: string }, { status: number })`

Key routes:

- `POST /api/chat` — Main chat endpoint; accepts `{ messages: ChatMessage[] }`; returns LLM response with RAG context injection
- `POST /api/analyze-jd` — Analyze a job description against candidate profile
- `GET /api/hello` — Health check
- `GET /api/test`, `/api/test-fallback`, `/api/test-langsmith` — Development/testing endpoints

All production API routes use `export const runtime = 'nodejs'`.

---

## External Integrations

### Google Gemini (primary LLM)
- Purpose: Primary LLM provider — free tier for cost optimization
- SDK: `@google/genai`
- Credentials: `GOOGLE_API_KEY` in `.env.local`
- Default model: `gemini-2.5-flash` or `gemini-2.5-pro` (via `AI_MODEL` env var)
- Rate limits: Free-tier quota is typically **project/account-level** (not per model); exhausting Gemini limits affects all Gemini models until reset

### DeepSeek (inexpensive fallback LLM)
- Purpose: First paid fallback after Google when rate-limited or quota-exceeded; inexpensive vs Anthropic/OpenAI
- SDK: `openai` package with `baseURL: https://api.deepseek.com` (OpenAI-compatible chat completions)
- Credentials: `DEEPSEEK_API_KEY` in `.env.local` / Vercel (user-configured)
- Default model in code fallback chain: `deepseek-v4-pro` (first fallback after primary when `AI_MODEL_FALLBACKS` unset; then Anthropic Haiku — OpenAI not in code defaults)
- Omitted from runtime chain when `DEEPSEEK_API_KEY` is unset

### Anthropic Claude (fallback LLM)
- Purpose: Secondary/fallback provider
- SDK: `@anthropic-ai/sdk`
- Credentials: `ANTHROPIC_API_KEY` in `.env.local`
- Model: Claude Haiku 4.5 (cost-optimized fallback)

### OpenAI (fallback LLM)
- Purpose: Tertiary/fallback provider
- SDK: `openai`
- Credentials: `OPENAI_API_KEY` in `.env.local`
- Model: GPT-4o-mini

### LangSmith
- Purpose: LLM observability — tracing, token usage, performance analytics
- SDK: `langsmith`
- Credentials: `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT_NAME`, `LANGSMITH_TRACING` in `.env.local`
- Used in: `app/api/lib/langsmith.ts`, `app/api/lib/llm.ts`

### Langfuse
- Purpose: Additional LLM observability, prompt management, evaluation datasets
- SDK: `@langfuse/client`, `@langfuse/otel`, `@langfuse/tracing`
- Credentials: `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, `LANGFUSE_BASE_URL`, `LANGFUSE_TRACING` in `.env.local`
- Used in: `instrumentation.ts`, `app/api/lib/langfuse.ts`, `scripts/migrate-prompts.ts`
- Enabled when `LANGFUSE_TRACING=true` (exact string) and keys are present
- Chat path awaits Langfuse generation spans and `forceFlush` before returning so serverless exits do not drop traces
- Parent observation name: `chat_request` with `timings_ms` metadata (filter / knowledgeBase / prompt / llm / total)

### DeepSeek reasoning dial
- Env: `DEEPSEEK_REASONING_EFFORT` = `max` | `high` | `disabled` (default `high`)
- Models: `deepseek-v4-pro`, `deepseek-v4-flash` via `AI_MODEL` / `AI_MODEL_FALLBACKS`
- Latency ladder after attribution: Flash + `max` → `high` → `disabled`

### GitHub (portfolio data)
- Purpose: Fetch contribution/repo data for portfolio pages
- SDK: `octokit`
- Credentials: `GITHUB_PERSONAL_ACCESS_TOKEN` in `.env.local`
- Used in: `lib/github.ts`

---

## Environment Variables

> List names only — never values.

**LLM providers:**
```
GOOGLE_API_KEY
DEEPSEEK_API_KEY
ANTHROPIC_API_KEY
OPENAI_API_KEY
AI_MODEL
AI_MODEL_FALLBACKS
AI_MAX_TOKENS
AI_TEMPERATURE
DEEPSEEK_REASONING_EFFORT
```

**Observability:**
```
LANGSMITH_API_KEY
LANGSMITH_PROJECT_NAME
LANGSMITH_TRACING
LANGSMITH_ORG_ID
LANGSMITH_ENDPOINT
LANGFUSE_PUBLIC_KEY
LANGFUSE_SECRET_KEY
LANGFUSE_BASE_URL
LANGFUSE_TRACING
LANGFUSE_SEED_DATASET
```

**Rate limiting:**
```
RATE_LIMIT_MAX
RATE_LIMIT_WINDOW
```

**App config:**
```
NEXT_PUBLIC_CALENDLY_LINK
CANDIDATE_FIRSTNAME
CANDIDATE_CALENDLY
ADMIN_EMAIL
GITHUB_PERSONAL_ACCESS_TOKEN
```

**Evaluation scripts (dev only):**
```
CHAT_API_URL
EVAL_DELAY_MS
```

---

## Conventions

> Non-obvious rules agents must follow.

**Naming:**
- API route files: `route.ts` (App Router convention)
- Page components: `page.tsx`
- Server-side AI logic: `app/api/lib/` (not top-level `lib/`)
- Shared client/server utilities: top-level `lib/`
- `@/` path alias maps to project root

**Error handling:**
- API routes return `NextResponse.json({ error: string }, { status: number })`
- LLM provider abstraction has graceful fallback between providers on failure
- Input filtering via `lib/input-filter.ts` before LLM calls

**Logging:**
- LangSmith traces all LLM calls via `traceLLMCall` / `traceableChat`
- Langfuse traces via OpenTelemetry when enabled
- Some debug `console.log` in chat route (development)

**Testing:**
- Unit tests: `npm test` (Vitest, Node environment)
- Ad-hoc evaluation: `npm run eval:langfuse` runs `tests/langfuse-evaluation.ts`
- Guardrails evaluation: `tests/langsmith-guardrails-evaluation.ts`
- Prompt migration: `npm run migrate:prompts`

**Async patterns:**
- API routes are async functions returning `NextResponse`
- LLM calls are async/await through the provider abstraction in `app/api/lib/llm.ts`

**Component patterns:**
- Server Components by default *(inferred)*
- `'use client'` for chat widget, animations, and interactive UI
- Framer Motion for animations (client-side only)
- Tailwind CSS utility-first styling; some SCSS modules for chat components

**Knowledge base:**
- Content lives in `knowledge-base/` as markdown files
- Keyword-based retrieval — no embeddings or vector DB
- `knowledge-base/workingDocs/` contains draft/archived versions; do not serve these to users
- `knowledge-base/meta-project.md` documents the project's own architecture (meta-awareness)

**Cost constraints:**
- Target operating cost: ~$0–2.50/month
- Prefer Google Gemini free tier as primary provider
- Do not add paid infrastructure (vector DB, Redis, persistent storage) without explicit approval

---

## Architectural Decisions

### Multi-Provider LLM Architecture
**Date:** October 2025
**Context:** Need AI chat with minimal operating cost and high reliability
**Decision:** Unified `ChatResponse` interface across Google Gemini, DeepSeek, Anthropic Claude, and OpenAI; provider selected by model name (`gemini-*` → Google, `deepseek-*` → DeepSeek, `claude-*` → Anthropic, else OpenAI). `chat()` walks `buildFallbackChain()` on retryable errors. Default chain when `AI_MODEL_FALLBACKS` unset: primary → `deepseek-v4-pro` → Claude Haiku.
**Rationale:** Cost optimization (Google free tier primary), quality, reliability (graceful fallback), future-proofing
**Tradeoffs accepted:** More complex provider abstraction layer
**Revisit if:** Free tier limits become constraining, or a new provider offers better quality/cost

### Keyword-Based RAG (Not Vector DB)
**Date:** October 2025
**Context:** Knowledge base is small (~5–10 pages about one person)
**Decision:** Simple keyword matching against markdown files in `knowledge-base/`
**Rationale:** Full RAG with embeddings + vector DB (Pinecone/Supabase) would be premature optimization for this content size; ships faster, costs $0
**Tradeoffs accepted:** No semantic search; may miss context with different terminology
**Revisit if:** Knowledge base grows significantly, or keyword retrieval consistently misses relevant context

### Stateless Rate Limiting
**Date:** October 2025
**Context:** MVP needs basic abuse prevention without infrastructure cost
**Decision:** In-memory `Map` with configurable limit (default 15 messages/hour); client-side session ID in `localStorage`
**Rationale:** Avoids Vercel KV/Redis; cold-start reset is acceptable for MVP; generous limit preserves UX
**Tradeoffs accepted:** Limits reset on cold start; no cross-instance consistency
**Revisit if:** Abuse becomes a problem, or persistent rate limiting is needed

### LangSmith + Langfuse Observability from Day One
**Date:** October 2025
**Context:** Need visibility into LLM performance, costs, and prompt quality
**Decision:** LangSmith for LLM call tracing; Langfuse for OpenTelemetry-based observability and prompt management
**Rationale:** Production-ready thinking — build observability before you need it; enables data-driven model selection
**Tradeoffs accepted:** Additional SDK dependencies and OpenTelemetry overhead
**Revisit if:** One observability tool proves sufficient

---

## Known Constraints

> Hard limits agents must not violate.

- **No database** — do not add code depending on persistent storage without explicit approval
- **No auth** — do not add auth gating without explicit approval
- **Vercel free tier** — keep serverless function execution within free tier limits
- **Node.js runtime only** — API routes use `runtime = 'nodejs'`; do not use Edge-only APIs
- **Cost target ~$0–2.50/month** — do not add paid infrastructure (vector DB, Redis, Vercel KV) without explicit approval
- **Knowledge base is static markdown** — do not assume a live database backend

---

## Areas of Known Complexity

> Flag these so agents escalate rather than guess.

- **LLM provider abstraction** (`app/api/lib/llm.ts`): Three providers with different API patterns, fallback chain, streaming, and dual observability tracing. Changes require understanding all provider SDKs.
- **System prompt construction** (`app/api/lib/prompts.ts`, `chat-prompt*.ts`): Carefully tuned prompts with marketing/recruitment framing and guardrails. Changes can significantly alter response quality and tone.
- **Rate limiting** (`app/api/lib/rate-limit.ts`): In-memory state with session tracking; env-configurable limits.
- **Dual observability** (LangSmith + Langfuse): OpenTelemetry setup in `instrumentation.ts`; modifications could break trace collection.
- **Input filtering** (`lib/input-filter.ts`): Pre-LLM sanitization; changes affect security posture.

---

## Last Updated

- Date: 2026-06-01
- What changed: DeepSeek provider, `llm-fallback-chain.ts`, Vitest tests, default fallback DeepSeek → Anthropic (no code-default OpenAI)
