---
status: ready
priority: p2
issue_id: "006"
tags: [code-review, typescript, api-surface]
dependencies: [002]
---

# Un-export `resolveOtelFlushTarget` and remove dedicated test block

## Problem Statement

`resolveOtelFlushTarget` in `app/api/lib/langfuse.ts:69` is exported but only used internally by `flushLangfuseTracing` (line 106). The export exists solely so tests can import and directly unit-test the function.

However, the `flushLangfuseTracing` integration tests already cover all three paths:
- "flushes via provider getDelegate when no span processor is cached" → exercises `resolveOtelFlushTarget` with delegate
- "flushes the provider directly when it has forceFlush and no delegate" → exercises `resolveOtelFlushTarget` with direct provider
- "warns and resolves when no flush target exists" → exercises `resolveOtelFlushTarget` with null return

The dedicated `describe('resolveOtelFlushTarget', ...)` test block is redundant — every path is already exercised end-to-end through the public API (`flushLangfuseTracing`).

## Findings

| Agent | Finding |
|-------|---------|
| Code simplicity reviewer | P2: `resolveOtelFlushTarget` exported solely for testing — bloats public API |
| TypeScript reviewer | P3: Exported but only tested locally (noted as fine — testability concern) |

## Proposed Solutions

### Option A: Un-export and remove dedicated tests (recommended)
1. Change `export function resolveOtelFlushTarget` → `function resolveOtelFlushTarget`
2. Delete `describe('resolveOtelFlushTarget', ...)` test block (lines 50-70 in test file)
3. Keep the existing `flushLangfuseTracing` integration tests (they already cover all paths)
- **Effort:** Small (~25 lines removed from test file)
- **Risk:** None — integration coverage is already sufficient

### Option B: Keep exported, justified by testability
Arguably the function is a pure utility with clear semantics that benefits from direct unit testing. Exporting it doesn't hurt — it's only imported by test code.
- **Effort:** None
- **Risk:** Public API surface grows for a one-call-site helper

## Recommended Action

Option A — un-export. The integration tests already cover all paths. If you later need it externally, re-exporting is trivial. Dependencies: Apply todo #002 (recursive unwrap fix) first since it changes the function logic.

## Technical Details

- **Affected files:** `app/api/lib/langfuse.ts`, `app/api/lib/__tests__/langfuse.test.ts`
- **Current tests:** 5 dedicated tests + 4 integration tests exercise the function

## Acceptance Criteria

- [ ] `resolveOtelFlushTarget` is no longer exported
- [ ] Dedicated `describe('resolveOtelFlushTarget')` block removed
- [ ] `flushLangfuseTracing` integration tests still pass
- [ ] TypeScript compiles cleanly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Public API surface review |
| 2026-07-21 | Fixed | Un-exported `resolveOtelFlushTarget`, removed dedicated test block, kept integration coverage |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/langfuse.ts:69-82`
- File: `app/api/lib/__tests__/langfuse.test.ts:50-70`
