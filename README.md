# Portfolio Website with AI Recruiting Assistant

Next.js portfolio with a production recruiting assistant. Recruiters can ask about Mikkel's background or paste a job description. Answers come from a small markdown knowledge base.

Stack and invariants live in [`ARCHITECTURE.md`](./ARCHITECTURE.md). The assistant's own account of the system is [`knowledge-base/meta-project.md`](./knowledge-base/meta-project.md).

## What it does

- Three-state chat widget on every page (minimized, compact side panel, maximized modal). Viewports at or under 768px open maximized.
- `POST /api/chat` validates the body, rate-limits, runs a shared short-circuit router, retrieves markdown by keyword, and calls an LLM.
- Providers: Google Gemini, DeepSeek, Anthropic Claude, and OpenAI behind one `chat()` function. Unset default chain: `gemini-2.5-flash`, then `deepseek-v4-pro`, then Claude Haiku.
- Observability: LangSmith and Langfuse. Both flushes are awaited before the serverless handler returns.
- Operating target about $0–2.50/month. No database, no accounts, Vercel free tier.

`POST /api/analyze-jd` scores a job description with a weighted rubric. The widget does not call it. Pasted roles go through `/api/chat`.

## Stack

- Next.js 15 App Router, React 18, TypeScript (strict), Tailwind CSS, Sass, Framer Motion
- API routes on the Node.js runtime
- Vitest and Playwright in GitHub Actions on pull requests to `main`
- Deployed on Vercel

## Scripts

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # Vitest
npm run test:e2e     # Playwright (builds first in CI)
npm run eval:langfuse
```

Pages live under `app/` (`app/page.tsx`, `app/api/chat/route.ts`). Copy env names from `ARCHITECTURE.md` into `.env.local`. Never commit values.

## Deploy

The app is deployed on Vercel (`vercel.json`, `framework: nextjs`). API routes set `runtime = 'nodejs'` because retrieval reads files and tracing uses OpenTelemetry.
