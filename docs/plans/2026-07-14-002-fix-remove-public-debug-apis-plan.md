---
title: "fix: Remove public debug API routes"
date: 2026-07-14
type: fix
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
origin: docs/plans/2026-07-14-001-feat-playwright-mvts-plan.md
---

# fix: Remove public debug API routes

## Goal Capsule

Delete the unused public debug routes `/api/test-fallback` and `/api/test-langsmith` so production no longer exposes key metadata, LLM burns, LangSmith proxying, or stack traces. Flip the existing Playwright characterization specs to assert **404**. Low-risk stubs `/api/hello` and `/api/test` stay.

**Authority:** Confirmed delete-only scope > this plan > deferred item in origin Playwright MVTS plan.

**Stop when:** Both route modules are gone, E2E asserts 404 for both URLs, Vitest and Playwright pass, and no new public debug replacement is introduced.

---

## Product Contract

### Summary

Remove two high-risk unauthenticated debug handlers. Update `e2e/debug-api.spec.ts` from “prove open” to “prove gone.” No secret-header gate and no production-only soft-disable — deletion only.

### Requirements

- R1. `GET /api/test-fallback` and `GET /api/test-langsmith` no longer exist as App Router handlers (App Router returns 404 for missing routes).
- R2. Playwright risk specs assert **404** for both URLs without auth headers and without requiring provider/LangSmith secrets.
- R3. No replacement public debug/admin route is added in this work.
- R4. Existing Vitest unit tests and non-debug E2E (smoke/chat) remain green.

### Actors

- A1. Visitor / anonymous internet — must not reach debug surfaces.
- A2. Maintainer — uses Vitest, Chat E2E stubs, and local scripts if future diagnostics are needed.

### Key Flows

- F1. Unauthenticated `request.get` to either former debug path → **404**.
- F2. Portfolio smoke/chat E2E paths unchanged.

### Acceptance Examples

- AE1. After deploy/local start, `GET /api/test-fallback?test=environment` returns 404.
- AE2. `GET /api/test-langsmith` returns 404 (no LangSmith network call).
- AE3. `npm test` and `npm run test:e2e` pass with no provider secrets.

### Scope Boundaries

**In scope**

- Delete `app/api/test-fallback/route.ts` and `app/api/test-langsmith/route.ts` (and empty parent dirs if left empty).
- Rewrite `e2e/debug-api.spec.ts` for 404 expectations and rename test titles accordingly.

**Out of scope**

- Deleting or changing `/api/hello`, `/api/test`.
- Auth middleware for the rest of the API surface.
- New local-only debug tooling (scripts); recreate later only if needed.

### Deferred to Follow-Up Work

- Optional cleanup of low-value stubs `/api/hello` and `/api/test` if desired for hygiene.
- Broader API auth if future admin/debug routes are added.

---

## Planning Contract

### Assumptions

- Next.js App Router 404 for deleted `route.ts` files is sufficient denial; no custom 404 JSON required.
- Maintainer does not need these routes in local or preview environments (confirmed).
- Origin Playwright plan’s deferred hardening item is satisfied by this plan; do not edit the origin plan body during execution.

### Key Technical Decisions

- KTD1. **Delete, don’t gate** — avoids preview/prod gate mistakes and unused dead code; diagnostics belong in Vitest / private scripts.
- KTD2. Assert **404** specifically (not 401/403) — matches “route removed” semantics; updates characterization suite meaning from exposure proof to absence proof.
- KTD3. Keep `/api/hello` and `/api/test` — not load-bearing risk; avoids drive-by scope.

### Alternative Approaches Considered

| Approach | Why rejected |
|---|---|
| `NODE_ENV === 'production'` gate | Preview/dev still leak; gate easy to get wrong |
| Shared secret header | Complex for unused tools; key management overhead |
| Soft-disable returning 403 with body | Leaves attack surface and handlers in the bundle |

---

## Implementation Units

### U1. Delete debug route handlers

**Goal:** Remove both public debug Route Handlers from the app.

**Requirements:** R1, R3

**Dependencies:** None

**Files:**
- Delete: `app/api/test-fallback/route.ts`
- Delete: `app/api/test-langsmith/route.ts`
- Delete empty dirs `app/api/test-fallback/`, `app/api/test-langsmith/` if applicable

**Approach:** Delete the two route modules entirely. Grep for remaining references outside plans/docs; only expected production code hit is these files. Do not add stubs or redirect handlers.

**Patterns to follow:** App Router file-based routing — absence = 404.

**Test scenarios:**
- Test expectation: none in this unit alone — proven by U2 E2E against a running server.

**Verification:** Files gone; no imports of these modules remain in `app/` or `components/`.

---

### U2. Flip Playwright debug specs to expect 404

**Goal:** Turn characterization of exposure into regression guards for absence.

**Requirements:** R2, R4 — F1 — AE1, AE2, AE3

**Dependencies:** U1

**Files:**
- Modify: `e2e/debug-api.spec.ts`

**Approach:**
- For both paths, `request.get` without auth; expect `response.status() === 404`.
- Drop assertions on `success`, `environment`, or LangSmith body shape.
- Rename tests to reflect “not publicly available” / “returns 404”.
- Keep `timeout` optional/low for langsmith — should not call upstream once route is gone.
- Do not change smoke/chat specs.

**Execution note:** Prefer smoke/runtime proof via `npm run test:e2e` after delete; the red state is U2’s updated expectations failing until U1 lands (order: can update specs and delete in one commit if desired, or delete first then flip).

**Patterns to follow:** Existing Playwright `request` fixture usage in the same file; Chromium project / `webServer` already configured.

**Test scenarios:**
- Risk / happy path: `GET /api/test-fallback?test=environment` → 404.
- Risk / happy path: `GET /api/test-langsmith` → 404.
- Integration: suite runs under existing Playwright `webServer` without LLM/LangSmith secrets.
- Edge: query strings on deleted fallback path still 404 (same as path miss).

**Verification:** `npm run test:e2e` green; `npm test` green; intentional reintroduce of either route would fail the new assertions once restored to old expected status.

---

## Verification Contract

- `npm test` — Vitest still green.
- `npm run test:e2e` — all specs green including updated debug-api cases.
- Manual optional: curl both URLs against local `start`/`dev` → 404.

---

## Definition of Done

- [ ] Both debug route files removed
- [ ] E2E asserts 404 for both former URLs
- [ ] Vitest + Playwright green without provider secrets
- [ ] No new public debug route introduced
- [ ] `/api/hello` and `/api/test` untouched

---

## System-Wide Impact

- **Security:** Closes unauthenticated key-enumeration, LLM burn, and LangSmith proxy surfaces on Vercel production.
- **CI:** Same Playwright job; debug specs become faster (no outbound LangSmith).
- **Ops:** Maintainers lose in-app curl health checks — use Vitest + provider dashboards instead.
- **Docs:** Prior MVTS plan remains historical; this plan is the execution authority for the deferred item.

---

## Risk Analysis & Mitigation

| Risk | Mitigation |
|---|---|
| Accidental keep of helper that re-exposes env | R3 + DoD; no replacement route |
| Incomplete delete (orphaned route file) | Verify both paths via E2E 404 |
| Docs/scripts still linking to deleted URLs | Grep after delete; only plan/docs expected |

---

## Sources & Research

- Deferred follow-up in `docs/plans/2026-07-14-001-feat-playwright-mvts-plan.md`
- Handlers: `app/api/test-fallback/route.ts`, `app/api/test-langsmith/route.ts`
- Characterization suite: `e2e/debug-api.spec.ts`
- Confirmed product choice: delete over gate/secret; no local-use need

External research not load-bearing — approach is route deletion under Next App Router conventions already used in the repo.
