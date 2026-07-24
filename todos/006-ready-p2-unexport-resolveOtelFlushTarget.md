---
status: done
priority: p2
issue_id: "006"
tags: [code-review, typescript, api-surface]
dependencies: [002]
---

# Un-export `resolveOtelFlushTarget` and remove dedicated test block

## Problem Statement

`resolveOtelFlushTarget` in `app/api/lib/langfuse.ts` is **already unexported** and only used internally by `flushLangfuseTracing`. The dedicated `describe('resolveOtelFlushTarget', ...)` unit block was removed; coverage remains via `flushLangfuseTracing` integration tests (delegate path, direct provider, recursive unwrap, dual-method fallback, warn-when-missing).

No further action required for the original export/test-surface concern.

## Findings

| Agent | Finding |
|-------|---------|
| Code simplicity reviewer | P2: `resolveOtelFlushTarget` exported solely for testing — bloats public API |
| TypeScript reviewer | P3: Exported but only tested locally (noted as fine — testability concern) |

## Proposed Solutions

### Option A: Un-export and remove dedicated tests (recommended) — **done**
1. Change `export function resolveOtelFlushTarget` → `function resolveOtelFlushTarget`
2. Delete `describe('resolveOtelFlushTarget', ...)` test block
3. Keep the existing `flushLangfuseTracing` integration tests
- **Effort:** Small
- **Risk:** None — integration coverage is already sufficient

## Recommended Action

None — completed.

## Technical Details

- **Affected files:** `app/api/lib/langfuse.ts`, `app/api/lib/__tests__/langfuse.test.ts`

## Acceptance Criteria

- [x] `resolveOtelFlushTarget` is no longer exported
- [x] Dedicated `describe('resolveOtelFlushTarget')` block removed
- [x] `flushLangfuseTracing` integration tests still pass
- [x] TypeScript compiles cleanly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Public API surface review |
| 2026-07-21 | Fixed | Un-exported `resolveOtelFlushTarget`, removed dedicated test block, kept integration coverage |
| 2026-07-23 | Verified / closed | Confirmed unexported in current code; TODO metadata synced to `done` |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/langfuse.ts`
- File: `app/api/lib/__tests__/langfuse.test.ts`
