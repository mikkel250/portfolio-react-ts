# Career Command Center API — Requirements

## Objective

Add a new API route to this portfolio project that powers a separately-built Career Command Center (CCC) frontend. The API takes a job description (and optionally a recruiter email) as input, uses the existing structured career knowledge base as a source of truth, and returns a **compositionally tailored CV** formatted as markdown — selecting, reordering, emphasizing, and lightly rewriting existing accomplishments to match the target job, without fabricating new claims.

## Problem Statement

Tailoring a CV to each job application burns 3–4 hours for senior engineers. This project already has:
- A structured, verified knowledge base of work history, skills, and accomplishments (`knowledge-base/`)
- A working LLM orchestration layer with multi-provider fallbacks and observability (`app/api/lib/llm.ts`)
- An existing `analyze-jd` endpoint that does fit analysis but **not** CV generation

The gap is producing an actual **tailored CV document** from the same knowledge base, controlled by prompts optimized for compositional tailoring rather than general analysis.

## Users / Stakeholders

- **Primary user**: Mikkel — using the CCC frontend to paste JDs and receive tailored CVs
- **Future**: Other job seekers (design data model for multi-user without implementing auth yet)

## In Scope

- New API endpoint(s) in this project that accept `POST` with a job description (and optional recruiter email)
- A new, separate prompt for CV tailoring (distinct from existing `chat-prompt.ts` and `jd-prompt.ts`)
- Compositional tailoring: the LLM **selects, reorders, emphasizes, and lightly rewrites** existing bullets from the knowledge base — never fabricates
- Output: tailored CV as structured markdown returned in the API response
- Stateless: each call is independent; the CCC frontend manages all HITL (human-in-the-loop) state
- Leverage existing infrastructure: `llm.ts` (multi-provider, fallbacks, tracing), `knowledge-base.ts` (`getAllContext()`), and rate limiting

## Out of Scope

- Cover letter generation (Phase 2)
- Recruiter email drafting (Phase 2)
- Interview prep notes, keyword gaps, ATS scoring (Phase 2+)
- CV Platform API integration (Phase 2 — use hardcoded knowledge base for now)
- Session management / stateful tailoring (Phase 2)
- Multi-user auth (Phase 3)
- Frontend UI — the CCC is built separately
- Vector-based retrieval / semantic tagging (Phase 3+)

## Functional Requirements

### FR1: CV Tailoring Endpoint
- **FR1.1**: Accept `POST` with body `{ jobDescription: string, recruiterEmail?: string }`
- **FR1.2**: Load the full career profile from the knowledge base (`getAllContext()` or equivalent)
- **FR1.3**: Build a system prompt that instructs the LLM to compositionally tailor — not fabricate
- **FR1.4**: Call the LLM via the existing `chat()` function in `llm.ts` (inherits multi-provider fallback and tracing)
- **FR1.5**: Return structured response: `{ tailoredCv: string, usage: {...}, model: string }`
- **FR1.6**: Apply rate limiting (reuse existing `checkRateLimit`)
- **FR1.7**: Handle errors gracefully (invalid input, LLM failures, rate limits) with appropriate HTTP status codes

### FR2: Compositional Tailoring Prompt
- **FR2.1**: A new prompt file (e.g., `cv-tailor-prompt.ts`) separate from `jd-prompt.ts` and chat prompts
- **FR2.2**: Prompt must enforce:
  - Only use accomplishments present in the knowledge base (anti-hallucination)
  - Select the most relevant bullets for the JD's role, seniority, and tech stack
  - Reorder bullets to lead with the strongest matches
  - Lightly adapt phrasing to mirror the JD's language and seniority signals
  - Mark any sections where evidence is insufficient as "Unknown" — do not invent
- **FR2.3**: Output format: standard CV sections as markdown (summary, experience, skills, education)

### FR3: Knowledge Base as Source of Truth
- **FR3.1**: Use existing `knowledge-base/` markdown files as canonical career data
- **FR3.2**: No code changes required to `knowledge-base/` itself — it already covers experience, projects, skills, career story
- **FR3.3**: The prompt must instruct the LLM to treat the knowledge base as ground truth

## Non-Functional Requirements

- **Performance**: API response under 30 seconds (LLM latency is the bottleneck; existing fallback chain handles provider failures transparently)
- **Reliability**: Inherits multi-provider fallback from `llm.ts` (primary model fails → automatic retry with backup providers)
- **Observability**: All LLM calls automatically traced via existing LangSmith + LangFuse integration in `llm.ts`. Nothing new needed — it's already wired in.
- **Security**: Input sanitization via existing `input-filter.ts`; rate limiting inherited
- **Compatibility**: No changes to existing API routes (`chat/`, `analyze-jd/`) — new routes are additive

## Constraints

- **Technical**:
  - Next.js 15 App Router, route handlers in `app/api/`
  - TypeScript
  - Node.js runtime (required by `knowledge-base.ts` which uses `fs`)
  - Existing `llm.ts` abstraction — do not bypass it
  - Existing knowledge-base markdown files — do not restructure them
- **Business**:
  - Single-user MVP, but design response types with multi-user extensibility in mind
  - Deployed on Vercel (existing deployment)
  - Human-in-the-loop initially, with path to full automation

## Interfaces / Dependencies

| Dependency | Status | Notes |
|---|---|---|
| `app/api/lib/llm.ts` | Exists | Reuse as-is. No changes needed. |
| `app/api/lib/knowledge-base.ts` | Exists | Reuse `getAllContext()`. No changes needed. |
| `knowledge-base/*.md` | Exists | Source of truth. No changes needed. |
| `app/api/lib/rate-limit.ts` | Exists | Reuse `checkRateLimit()`. No changes needed. |
| `app/api/lib/langfuse.ts` | Exists | Tracing auto-applied by `llm.ts`. No changes needed. |
| CCC Frontend | To be built separately | Not part of this project. |
| CV Platform API | Future (Phase 2) | Not in MVP. |

## Acceptance Criteria

- [ ] `POST /api/tailor-cv` accepts `{ jobDescription: string, recruiterEmail?: string }` and returns 200 with `{ tailoredCv, usage, model }`
- [ ] The returned CV markdown contains no fabricated claims — every bullet can be traced back to `knowledge-base/*.md`
- [ ] The returned CV is tailored to the JD: bullets are selected and ordered for relevance, summary is adapted to the role
- [ ] Calling with an empty or missing `jobDescription` returns 400
- [ ] Rate limiting blocks excessive requests and returns 429
- [ ] LLM provider failure triggers automatic fallback to the next provider in the chain
- [ ] All LLM calls appear in LangSmith and LangFuse traces (no code changes needed — this is automatic)
- [ ] Existing routes (`/api/chat`, `/api/analyze-jd`) continue to work unchanged
- [ ] Response includes `usage` (token counts) and `model` (which model was actually used) for observability

## Edge Cases / Failure Cases

- **Empty JD**: 400 with descriptive error
- **Extremely long JD** (>100k chars): API should still process (LLMs can handle it), but consider truncation or summarization in a future iteration
- **JD with no clear role**: API should still produce a best-effort CV (prompt should handle ambiguity gracefully)
- **Knowledge base file missing**: Return 500 with clear error message (should not happen in production but must not crash silently)
- **All LLM providers fail**: Return 503 with error message (handled by `llm.ts` fallback chain exhaustion)
- **Rate limit hit**: Return 429 with `remaining` and `resetTime` fields
- **Non-JD text pasted** (e.g., random text): API should still attempt tailoring — the prompt should note the unclear fit rather than fail
- **Recruiter email present but invalid**: Accept it and include in the prompt context; the LLM can handle gracefully

## Assumptions

- The `knowledge-base/*.md` files are accurate and up-to-date (last updated October 2025 per file headers)
- The CCC frontend will handle all UI state (approve/reject/tweak/lock) — this API is stateless
- The CCC frontend will handle rendering markdown-to-CV layout
- The LLM providers configured in the environment (OpenAI, Anthropic, Google) have sufficient context windows for the knowledge base + JD
- Rate limiting config (`RATE_LIMIT_MAX`) is already set in environment and applies to the new endpoint
- The existing `AI_MODEL` and `AI_MODEL_FALLBACKS` env vars control model selection for the new endpoint

## Open Questions

- [ ] Should the CV tailoring endpoint share the same rate limit pool as the chat endpoint, or have its own? (Recommendation: separate, since these are different use cases)
- [ ] Do we want a separate `NEXT_PUBLIC_` URL the CCC uses to call this API, or will it use the same Vercel deployment URL?
- [ ] Should the tailored CV include a section for "Projects" or only "Experience" + "Skills"? (Recommendation: include projects section, as the knowledge base has robust project data and it's a differentiator for senior engineers)

## Risk Flags

- **Hallucination risk**: The biggest risk. The prompt must enforce strict anti-fabrication. Consider adding an explicit verification step in the prompt ("Before outputting, verify each bullet against {CONTEXT}").
- **Prompt drift**: The JD analysis prompt (`jd-prompt.ts`) is already large and complex. The new CV tailoring prompt must be maintained separately to avoid cross-contamination.
- **Context window**: The full knowledge base (5 files) + JD + system prompt may approach token limits on some models. Monitor token usage via LangFuse.
- **Output quality variance**: Different LLM providers will produce different quality outputs. Consider adding a quality evaluation step later (LangFuse evals already have a starter in `tests/langfuse-evaluation.ts`).

## Recommended Next Step

- **Suggested workflow**: Architect → Backend Builder → Reviewer
- **Why**: The requirements are concrete but there are design decisions to make (route structure, prompt architecture, response schema) before implementation. An architect pass will design the specific file layout and API contract, then the backend builder can implement. The reviewer verifies correctness and anti-hallucination guardrails.