---
status: ready
priority: p2
issue_id: "003"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Fix `as never` in test mocks and `err: any` in catch blocks

## Problem Statement

Two TypeScript strict-mode violations:

1. **`as never` on mock returns** (`langfuse.test.ts:131, 147, 159`): The mock values for `getLangfuseTracerProvider` use `as never` which bypasses ALL type checking. If the real return type changes, tests won't catch incompatibility.

```typescript
vi.mocked(getLangfuseTracerProvider).mockReturnValue({
  forceFlush: proxyFlush,
  getDelegate: () => ({ forceFlush: delegateFlush }),
} as never);
```

2. **`err: any` in migrate-prompts.ts** (`scripts/migrate-prompts.ts:102, 143`): Explicitly typing catch variables as `any` opts out of `useUnknownInCatchVariables` (TS strict mode). The code accesses `err.status`, `err.message` without narrowing.

```typescript
} catch (err: any) {
  if (err.status === 409 || err.message?.includes('already exists')) {
```

## Findings

| Agent | Finding |
|-------|---------|
| TypeScript reviewer | P2: `as never` semantically wrong — use `as unknown as ReturnType<...>` |
| TypeScript reviewer | P2: `err: any` disables strict catch typing |
| Code simplicity reviewer | P2: Cited as unnecessary complexity |

## Proposed Solutions

### Fix 1: Replace `as never` with proper partial types
```typescript
type PartialTracerProvider = Partial<ReturnType<typeof getLangfuseTracerProvider>>;
vi.mocked(getLangfuseTracerProvider).mockReturnValue({
  forceFlush: proxyFlush,
  getDelegate: () => ({ forceFlush: delegateFlush }),
} as unknown as ReturnType<typeof getLangfuseTracerProvider>);
```
Or extract a shared mock helper: `function mockProcessor(overrides)`

### Fix 2: Replace `err: any` with `unknown` + narrowing
```typescript
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err && typeof err === 'object' && 'status' in err)
    ? (err as { status: unknown }).status : undefined;
  if (status === 409 || message.includes('already exists')) {
```
- **Effort:** Small for both
- **Risk:** Low — test behavior unchanged, error handling logic preserved

## Recommended Action

Apply both fixes as described.

## Technical Details

- **Affected files:** `app/api/lib/__tests__/langfuse.test.ts`, `scripts/migrate-prompts.ts`
- **TypeScript strict mode:** `strict: true` in `tsconfig.json`

## Acceptance Criteria

- [ ] No `as never` in test mock returns
- [ ] No `err: any` in migrate-prompts.ts catch blocks
- [ ] Tests pass
- [ ] TypeScript compiles cleanly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Code review of PR #10 |
| 2026-07-21 | Fixed | Replaced `as never` with `as unknown as ReturnType<typeof getLangfuseTracerProvider>`, replaced `err: any` with `err: unknown` + narrowing |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/__tests__/langfuse.test.ts:131,147,159`
- File: `scripts/migrate-prompts.ts:102,143`
