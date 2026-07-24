---
status: ready
priority: p2
issue_id: "005"
tags: [code-review, architecture, documentation]
dependencies: []
---

# Document `globalThis` cross-bundle pattern in ARCHITECTURE.md

## Problem Statement

The `globalThis`-based cross-bundle handle for the `LangfuseSpanProcessor` is a non-obvious architectural decision. Next.js loads `instrumentation.ts` and API routes in **separate module graphs** — a standard module-level export won't bridge them. The `globalThis` pattern is the chosen workaround.

ARCHITECTURE.md currently covers:
- State management (React hooks, localStorage, in-memory `Map` for rate limiting)
- Key directories and conventions

But it does **not** document:
- Why `globalThis` is used
- What state lives on `globalThis` and why
- How the `langfuse-span-processor-ref.ts` module bridges the gap

Future maintainers (and agents) will encounter this pattern without context.

## Findings

| Agent | Finding |
|-------|---------|
| Architecture reviewer | P2: globalThis pattern needs an Architectural Decision entry |
| Patterns/standards reviewer | P2: New in-process state pattern is undocumented |
| Code simplicity reviewer | P2: Pattern is valid but should be recorded |

## Proposed Solutions

Add a new entry under **"Architectural Decisions"** in ARCHITECTURE.md:

```markdown
### Cross-Bundle State via globalThis (Langfuse Span Processor)
**Date:** July 2026
**Context:** Next.js loads `instrumentation.ts` and API routes in separate module
graphs, so a module-level `export const` is not shared. The LangfuseSpanProcessor
initialized in `instrumentation.ts` must be accessible from `app/api/lib/langfuse.ts`
for `forceFlush()` before serverless exits.
**Decision:** Store the processor on `globalThis.__portfolioLangfuseSpanProcessor`
via typed get/set helpers in `app/api/lib/langfuse-span-processor-ref.ts`.
**Rationale:** Typed slot with explicit helpers avoids ad-hoc `globalThis` casts;
AsyncLocalStorage solves request isolation, not module isolation.
**Tradeoffs accepted:** Production bundle ships a typed global singleton;
callers that import the helpers directly avoid unsafe casts.
**Revisit if:** Next.js changes module graph behavior for instrumentation.
```

Also update the "State" section entry to add: `globalThis` — cross-bundle `LangfuseSpanProcessor` singleton (see Architectural Decisions).

## Recommended Action

Add the entry as described. Effort: Small (documentation only).

## Technical Details

- **Affected file:** `ARCHITECTURE.md`
- **Section:** "Architectural Decisions" and "State"

## Acceptance Criteria

- [ ] Architectural Decision entry added explaining the dual-module-graph problem
- [ ] State section updated to mention `globalThis` singleton
- [ ] Entry includes: date, context, decision, rationale, tradeoffs, revisit trigger

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Next.js bundles instrumentation.ts and API routes separately |
| 2026-07-21 | Fixed | Added Cross-Bundle State via globalThis entry to ARCHITECTURE.md Architectural Decisions |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- File: `ARCHITECTURE.md`
