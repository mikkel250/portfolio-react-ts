---
status: ready
priority: p1
issue_id: "001"
tags: [code-review, typescript, dead-code]
dependencies: []
---

# Remove dead `export let langfuseSpanProcessor` + test-only `clearLangfuseSpanProcessor`

## Problem Statement

Two pieces of dead/misplaced code in the Langfuse flush fix:

1. **`instrumentation.ts:16`** — `export let langfuseSpanProcessor` is never imported by any file. The variable is only used locally within `instrumentation.ts` (lines 36, 41, 45). The `export` keyword falsely suggests external consumption. The actual cross-bundle sharing uses `globalThis` via `setLangfuseSpanProcessor`.

2. **`langfuse-span-processor-ref.ts:32-34`** — `clearLangfuseSpanProcessor()` is only called from test files (`langfuse.test.ts`, 4 call sites). Production code never uses it. Tests could use the existing `setLangfuseSpanProcessor(null)` instead.

## Findings

| Agent | Finding |
|-------|---------|
| TypeScript reviewer | P1: `export let` is dead code — never imported |
| Architecture reviewer | P3: `export let langfuseSpanProcessor` — dead export, no external consumer |
| Code simplicity reviewer | P1: Dead code + P1: test-only code shipped to production |

## Proposed Solutions

### Option A: Minimal fix (recommended)
1. Change `export let langfuseSpanProcessor` → `let langfuseSpanProcessor` in `instrumentation.ts:16`
2. Delete `clearLangfuseSpanProcessor` from `langfuse-span-processor-ref.ts`
3. Replace test usages with `setLangfuseSpanProcessor(null)`
- **Effort:** Small (~5 lines changed)
- **Risk:** None — tests still clean up properly

### Option B: Remove the variable entirely
Since `NodeSDK` already holds a reference to the processor via `spanProcessors: [...]`, the intermediate `let langfuseSpanProcessor` could be a local `const` inside `register()` passed directly to both `NodeSDK` and `setLangfuseSpanProcessor`.
- **Effort:** Small
- **Risk:** None, but the local `let` is harmless documentation

## Recommended Action

Option A — remove `export`, delete `clearLangfuseSpanProcessor`.

## Technical Details

- **Affected files:** `instrumentation.ts`, `app/api/lib/langfuse-span-processor-ref.ts`, `app/api/lib/__tests__/langfuse.test.ts`
- **No database changes**
- **No env var changes**

## Acceptance Criteria

- [ ] `export` keyword removed from `langfuseSpanProcessor` in `instrumentation.ts`
- [ ] `clearLangfuseSpanProcessor` removed from `langfuse-span-processor-ref.ts`
- [ ] Tests updated to use `setLangfuseSpanProcessor(null)` instead
- [ ] All 10 tests still pass (`npx vitest run app/api/lib/__tests__/langfuse.test.ts`)
- [ ] TypeScript compiles cleanly (`npx tsc --noEmit`)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Discovered during code review of PR #10 |
| 2026-07-21 | Fixed | Removed `export` from `langfuseSpanProcessor`, removed `clearLangfuseSpanProcessor`, simplified module |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `instrumentation.ts:16`
- File: `app/api/lib/langfuse-span-processor-ref.ts:32-34`
