---
status: done
priority: p2
issue_id: "002"
tags: [code-review, typescript, bug-risk]
dependencies: []
---

# Recursive OTel flush unwrap — done

## Problem Statement

Resolved. `resolveOtelFlushTarget` in `app/api/lib/langfuse.ts` recursively unwraps `getDelegate()` chains, falls back to a provider's own `forceFlush`, and stops on a seen-set when the delegate is self-referential, cyclic, or throws.

Do not replace this with a single-level unwrap.

## Recommended Action

None — completed.

## Acceptance Criteria

- [x] `resolveOtelFlushTarget` recursively unwraps proxy chains
- [x] 2-deep proxy chain covered by `flushLangfuseTracing` tests
- [x] Cyclic and throwing `getDelegate()` paths resolve without throwing

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | OTel ProxyTracerProvider can nest |
| 2026-07-21 | Fixed | Recursive unwrap plus a 2-deep proxy test |
| 2026-10-11 | Closed | Cycle guard added; TODO no longer describes single-level unwrap as current code |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/langfuse.ts`
