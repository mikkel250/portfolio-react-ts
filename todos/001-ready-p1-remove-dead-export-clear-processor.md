---
status: done
priority: p1
issue_id: "001"
tags: [code-review, typescript, dead-code]
dependencies: []
---

# Dead `export let langfuseSpanProcessor` and `clearLangfuseSpanProcessor` — done

## Problem Statement

Resolved. `instrumentation.ts` keeps `langfuseSpanProcessor` as a module-local `let` (not exported). `clearLangfuseSpanProcessor` is removed. Tests clear the handle with `setLangfuseSpanProcessor(null)`.

Do not re-export the processor or restore a separate clear helper.

## Recommended Action

None — completed.

## Acceptance Criteria

- [x] `export` keyword removed from `langfuseSpanProcessor` in `instrumentation.ts`
- [x] `clearLangfuseSpanProcessor` removed from `langfuse-span-processor-ref.ts`
- [x] Tests clear via `setLangfuseSpanProcessor(null)`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Discovered during code review of PR #10 |
| 2026-07-21 | Fixed | Removed `export` from `langfuseSpanProcessor`, removed `clearLangfuseSpanProcessor` |
| 2026-10-11 | Closed | Body no longer describes the removed export as current work |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `instrumentation.ts`
- File: `app/api/lib/langfuse-span-processor-ref.ts`
