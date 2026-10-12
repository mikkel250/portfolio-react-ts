---
status: done
priority: p2
issue_id: "007"
tags: [code-review, observability, langsmith]
dependencies: []
---

# LangSmith traces may be lost in serverless exits (no pre-exit flush)

## Problem Statement

Langfuse flushes OTel spans before serverless exits. LangSmith was fire-and-forget with no equivalent flush — traces could be dropped when the function exited mid-HTTP.

**Resolved:** `flushLangSmithTracing()` awaits in-flight `createRun` work (tracked from `traceLLMCall` / `traceableChat`), then calls `client.flush()`. Both phases share one `FLUSH_TIMEOUT_MS` (2s) deadline. `client.flush()` receives only the time remaining and is skipped when that deadline has already passed. Chat and analyze-jd `finally` blocks both call it.

## Findings

| Agent | Finding |
|-------|---------|
| Performance reviewer | P2: LangSmith traces are fire-and-forget with no pre-exit flush |

## Recommended Action

None — completed.

## Technical Details

- **Affected files:** `app/api/chat/route.ts`, `app/api/analyze-jd/route.ts`, `app/api/lib/langsmith.ts`

## Acceptance Criteria

- [x] LangSmith SDK `flush()` method identified (or equivalent)
- [x] Added to `finally` blocks in chat and analyze-jd routes
- [x] Does not throw to callers (follows same pattern as Langfuse flush)
- [x] In-flight `createRun` promises tracked and awaited before `client.flush()`
- [x] Pending-trace await and `client.flush()` share one `FLUSH_TIMEOUT_MS` deadline (`withTimeout` + `Promise.allSettled`); flush is skipped when no time remains

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Observability hardening gap noticed during Langfuse review |
| 2026-07-21 | Fixed | Added `flushLangSmithTracing()` to langsmith.ts; called from both chat and analyze-jd route `finally` blocks |
| 2026-07-23 | Hardened / closed | Pending-trace tracking + 2s flush timeout; acceptance criteria synced |
| 2026-07-23 | Timeout pending await | Wrapped `Promise.allSettled(pendingTraces)` in `withTimeout` so createRun wait cannot hang |
| 2026-10-11 | Shared deadline | One clock for the pending-trace wait and `client.flush()`; the second phase gets only the time left |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/langsmith.ts`
