---
status: ready
priority: p2
issue_id: "004"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Remove `| null` redundancy from globalThis value type & simplify module

## Problem Statement

In `app/api/lib/langfuse-span-processor-ref.ts`:

1. The `| null` in the value type creates 3 states (`undefined` | `null` | `LangfuseSpanProcessor`) but the getter collapses `undefined` and `null` into `null` via `?? null` — the distinction is erased and unused.

```typescript
type LangfuseSpanProcessorGlobal = typeof globalThis & {
  [GLOBAL_KEY]?: LangfuseSpanProcessor | null;  // `| null` is redundant
};
```

2. The file is 34 lines for what could be ~10 lines. The `getStore()` helper and custom intersection type add ceremony without improving type safety (the getter already uses `?? null` for the return).

## Findings

| Agent | Finding |
|-------|---------|
| TypeScript reviewer | P2: `| null` in value type collapsed by getter — 3 states become 2 |
| Code simplicity reviewer | P2: 34-line file could be 8 lines |

## Proposed Solutions

### Option A: Remove `| null`, simplify module (recommended)
```typescript
import type { LangfuseSpanProcessor } from '@langfuse/otel';

const KEY = '__portfolioLangfuseSpanProcessor';

export function setLangfuseSpanProcessor(processor: LangfuseSpanProcessor): void {
  (globalThis as Record<string, unknown>)[KEY] = processor;
}

export function getLangfuseSpanProcessor(): LangfuseSpanProcessor | null {
  return ((globalThis as Record<string, unknown>)[KEY] as LangfuseSpanProcessor) ?? null;
}
```
- Removes `clearLangfuseSpanProcessor` (see todo #001)
- Removes `getStore()` helper
- Remove `LangfuseSpanProcessorGlobal` type alias
- 3 fewer states to reason about
- **Effort:** Small (~10 lines removed)
- **Risk:** None — callers use `getLangfuseSpanProcessor()` which already returns `null`

### Option B: Keep nullable setter, distinguish states in getter
Return `LangfuseSpanProcessor | null | undefined` from getter so callers can distinguish "never set" from "explicitly nulled."
- **Effort:** Small
- **Risk:** Changes call-site semantics; no current caller needs the distinction

## Recommended Action

Option A — simplify. No caller benefits from the `null` vs `undefined` distinction.

## Technical Details

- **Affected file:** `app/api/lib/langfuse-span-processor-ref.ts`
- **Importers:** `instrumentation.ts`, `app/api/lib/langfuse.ts`, `app/api/lib/__tests__/langfuse.test.ts`
- **No API changes** — `getLangfuseSpanProcessor()` return type unchanged

## Acceptance Criteria

- [ ] `| null` removed from value type
- [ ] `setLangfuseSpanProcessor` signature narrowed to accept only `LangfuseSpanProcessor`
- [ ] Tests updated (if `setLangfuseSpanProcessor(null)` was used — replace with `clearLangfuseSpanProcessor` per #001)
- [ ] All tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | TypeScript type semantics review |
| 2026-07-21 | Fixed | Removed `getStore()`, `LangfuseSpanProcessorGlobal` type alias; inlined globalThis cast; kept `| null` on setter for testability |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/langfuse-span-processor-ref.ts`
