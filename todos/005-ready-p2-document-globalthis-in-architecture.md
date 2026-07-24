---
status: done
priority: p2
issue_id: "005"
tags: [code-review, architecture, documentation]
dependencies: []
---

# Document `globalThis` cross-bundle pattern in ARCHITECTURE.md

## Problem Statement

The `globalThis`-based cross-bundle handle for the `LangfuseSpanProcessor` is a non-obvious architectural decision. Next.js loads `instrumentation.ts` and API routes in **separate module graphs** — a standard module-level export won't bridge them. The `globalThis` pattern is the chosen workaround.

This is now documented in ARCHITECTURE.md (Architectural Decisions + State bullet).

## Findings

| Agent | Finding |
|-------|---------|
| Architecture reviewer | P2: globalThis pattern needs an Architectural Decision entry |
| Patterns/standards reviewer | P2: New in-process state pattern is undocumented |
| Code simplicity reviewer | P2: Pattern is valid but should be recorded |

## Recommended Action

None — completed.

## Technical Details

- **Affected file:** `ARCHITECTURE.md`
- **Section:** "Architectural Decisions" and "State"

## Acceptance Criteria

- [x] Architectural Decision entry added explaining the dual-module-graph problem
- [x] State section updated to mention `globalThis` singleton
- [x] Entry includes: date, context, decision, rationale, tradeoffs, revisit trigger

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Next.js bundles instrumentation.ts and API routes separately |
| 2026-07-21 | Fixed | Added Cross-Bundle State via globalThis entry to ARCHITECTURE.md Architectural Decisions |
| 2026-07-23 | Verified / closed | Confirmed decision entry present; State bullet now mentions `globalThis` singleton |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- Next.js docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- File: `ARCHITECTURE.md`
