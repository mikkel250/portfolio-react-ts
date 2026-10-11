---
status: done
priority: p2
issue_id: "003"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# `as never` mocks and `err: any` catches — done

## Problem Statement

Resolved. Langfuse tracer-provider mocks use `as unknown as ReturnType<typeof getLangfuseTracerProvider>`. `scripts/migrate-prompts.ts` catch clauses use `unknown` and narrow before reading `status` or `message`.

Do not put `as never` back on those mocks or type those catch variables as `any`.

## Recommended Action

None — completed.

## Acceptance Criteria

- [x] No `as never` on `getLangfuseTracerProvider` mock returns
- [x] No `err: any` in `scripts/migrate-prompts.ts` catch blocks

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-07-21 | Finding identified | Code review of PR #10 |
| 2026-07-21 | Fixed | Replaced `as never` and `err: any` |
| 2026-10-11 | Closed | TODO no longer describes those types as current code |

## Resources

- PR: https://github.com/mikkel250/portfolio-react-ts/pull/10
- File: `app/api/lib/__tests__/langfuse.test.ts`
- File: `scripts/migrate-prompts.ts`
