---
title: "test: Chat failure-path and orchestration error coverage"
date: 2026-10-20
type: test
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-brainstorm
execution: code
---

# test: Chat failure-path and orchestration error coverage

## Goal Capsule

**Objective:** The portfolio chat widget and `POST /api/chat` have automated tests that prove failure behavior matches the intended UX (error alert, rollback, restored input, retry) and that the API returns the correct status and message for LLM exhaustion and other orchestration errors—not only the stubbed happy path.

**Means:** Vitest mocks for the route error matrix and for fallback-chain exhaustion, plus one Playwright spec that stubs a 503 (KTD4, KTD5, KTD6).

**Product authority:** User-confirmed scope (orchestration slice B, excluding unused `/api/analyze-jd`) > this plan > existing Vitest/Playwright patterns in `e2e/chat.spec.ts` and `app/api/chat/route.test.ts`.

**Not in active scope:** `/api/analyze-jd`. Broader suite-wide audit items stay deferred.

**Stop when:** U1–U3 are green under `npm test` and `npm run test:e2e` with no provider API keys, and no production handler or widget behavior was changed to force a pass.

**Open blockers:** None.

**Finishes and ships:** The implementer. No production code change is in scope unless a test exposes a mismatch with the Product Contract; that mismatch is a stop, not a silent product edit.

---

## Product Contract

Product Contract preservation: restructured, no scope change — added Problem Frame; R/A/F/AE IDs unchanged.

### Problem Frame

Chat reliability is proven on the success path. A visitor who hits provider exhaustion or a rate limit should see the existing error bar, get their text back, and be able to retry. Maintainers have no automated check that those responses stay mapped to 503, 429, and 500.

### Summary

Today, Playwright stubs `200` for `/api/chat`, and route unit tests mock `chat()` to always succeed. Fallback-chain logic has partial unit coverage. The user-visible failure path and HTTP error mapping are untested. This work adds the chat orchestration slice: the API error matrix, a unit test for `chat()` when every configured provider fails, and Playwright coverage for the widget failure UX.

### Requirements

- R1. **LLM exhaustion (API):** When `chat()` rejects with a message indicating all providers failed (e.g. `All LLM providers failed`), `POST /api/chat` returns **503** and JSON `{ error: 'AI service error. Please try again.' }` (matching `app/api/chat/route.ts`).
- R2. **Rate limit (API):** When rate limiting denies the request, `POST /api/chat` returns **429** with the server `error` string surfaced to the client (existing route behavior; test via mocked `checkRateLimit`).
- R3. **Generic server error (API):** When `chat()` throws an error that does not match the 503 or 429 classifiers, `POST /api/chat` returns **500** with `{ error: 'Internal server error, please try again later.' }`.
- R4. **All providers failed (library):** A Vitest test against `app/api/lib/llm.ts` `chat()` asserts that when every entry in the fallback chain fails with retryable errors, the function throws with `All LLM providers failed` (and does not return a success payload).
- R5. **Failure UX (E2E):** Playwright stubs `POST /api/chat` to return **503** with `{ error: 'AI service error. Please try again.' }` for a filter-passing message. The user sees an alert (`role="alert"`) with that text, the optimistic user message is **not** left in the transcript, the message text is **restored in the input**, and **Retry** triggers another request (assert stub call count increases).
- R6. **CI parity:** New tests run under existing `npm test` (Vitest) and `npm run test:e2e` (Playwright) without live LLM keys or network calls to providers.

### Actors

- A1. **Visitor** — sends a chat message and sees either a reply or a clear failure with retry.
- A2. **Maintainer** — relies on CI to catch regressions in error handling and fallback exhaustion.

### Key Flows

- F1. **API 503 path:** Valid chat request → mocked `chat()` throws provider exhaustion → 503 + generic AI error body.
- F2. **API 429 path:** Valid chat request → mocked rate limit `allowed: false` → 429 + limit message.
- F3. **API 500 path:** Valid chat request → mocked `chat()` throws unrelated error → 500 + generic internal error body.
- F4. **Widget failure path:** User sends filter-passing message → stubbed 503 → error bar, rollback, input restore → Retry re-invokes API.

### Acceptance Examples

- AE1. Removing the 503 handler branch in `route.ts` causes the new route test to fail.
- AE2. Changing the Playwright stub to `200` after a failed send causes the failure UX test to fail.
- AE3. Mocking all providers to fail in the `chat()` unit test causes an assertion on thrown message to fail if exhaustion handling is removed.
- AE4. Full Vitest and Playwright suites remain green in CI without provider API keys.

### Scope Boundaries

**In scope**

- `app/api/chat/route.test.ts`: 503, 429, and 500 cases with the existing mock harness.
- A new Vitest file for all-providers-failed, using the SDK mock pattern from `app/api/lib/__tests__/llm-google-contents.test.ts`.
- `e2e/chat.spec.ts`: stubbed failure UX and retry.

**Out of scope**

- `/api/analyze-jd` routes, tests, or 503 parity fixes.
- Platform timeout (504), non-JSON error bodies, or client-specific network abort messaging.
- Expanding the LLM provider adapter matrix beyond exhaustion of a two-entry chain.
- Contact form, debug API routes, or consolidating the second chat route suite under `app/api/chat/__tests__/`.

### Key Decisions

- KTD1. **session-settled:** Scope is chat orchestration slice B without analyze-jd. Governs the out-of-scope boundary for `/api/analyze-jd`.
- KTD2. **session-settled:** Playwright for user-visible failure UX; Vitest with mocks for route and `chat()` behavior. Governs R4, R5, R6.
- KTD3. **session-settled:** Tests assert current product copy. Governs R1, R3, R5.

### Deferred to Follow-Up Work

- E2E or unit coverage for 504 / malformed responses and friendlier timeout copy.
- Widget tests for 429 and 500 (the route tests cover those statuses).
- Route integration test of rate limit and burst with a realistic env, beyond a mocked `checkRateLimit`.
- Optional component tests for `ChatInterface` if the Playwright case is flaky.
- Triage of the second live suite at `app/api/chat/__tests__/route.test.ts`.

### Sources / Research

- Code: `components/ChatInterface.tsx`, `app/api/chat/route.ts`, `app/api/lib/llm.ts`, `app/api/chat/route.test.ts`, `app/api/lib/__tests__/llm-google-contents.test.ts`, `e2e/chat.spec.ts`.
- `docs/solutions/` has no learning that constrains this slice.
- External research was not required. The repo already has the mock and stub patterns these tests extend.

---

## Planning Contract

### Key Technical Decisions

- KTD4. Put the exhaustion case in a new file, `app/api/lib/__tests__/llm-fallback-exhaustion.test.ts`, that copies the Google/DeepSeek SDK mocks. (session-settled: user-approved — chosen over appending to `llm-google-contents.test.ts`: that file stays about request contents.)
- KTD5. Add the 503/429/500 cases only to `app/api/chat/route.test.ts`. The nested suite at `app/api/chat/__tests__/route.test.ts` does not mock `checkRateLimit` and is left untouched.
- KTD6. Exercise R4 with a two-entry chain: stub `GOOGLE_API_KEY` and `DEEPSEEK_API_KEY`, set `AI_MODEL` to a `gemini-*` id, set `AI_MODEL_FALLBACKS` to `["deepseek-v4-pro"]`, and reject both SDK calls with status 429. Do not include Anthropic. Its SDK is not mocked in that harness. A missing key throws `No LLM providers configured with valid API keys`. A 400 aborts the chain before exhaustion.
- KTD7. The Playwright retry assertion waits until `role="alert"` contains the error text again after the second 503. `handleRetry` clears the alert and calls `sendMessage()`, so the alert is absent while the second request is in flight. Match `role="alert"` for the error text. The input holds the restored user message, not that error sentence.

### Assumptions

- `NODE_ENV` during Vitest is not `development`, so response bodies need not include `timings_ms`. Assert `status` and `error`.
- The chat textbox is already visible on `/` without an extra open click, matching `e2e/chat.spec.ts`.
- A filter-passing message is the existing constant pattern in that spec (length and shape that `lib/input-filter.ts` sends to the API).

### Sequencing

U1, U2, and U3 do not depend on each other. Land them in any order. Do not edit `app/api/chat/route.ts`, `app/api/lib/llm.ts`, or `components/ChatInterface.tsx` to make a new test pass.

---

## Implementation Units

### U1. Route error matrix

**Goal:** `POST /api/chat` tests lock 503, 429, and 500.

**Requirements:** R1, R2, R3, R6. F1, F2, F3. AE1, AE4. KTD3, KTD5.

**Dependencies:** None.

**Files:** `app/api/chat/route.test.ts`

**Approach:**

- Reuse the file's `postChat` helper and the mocked `chat` import.
- For 503, `vi.mocked(chat).mockRejectedValueOnce(new Error('All LLM providers failed. Last error: rate limit'))` on an otherwise valid body. Expect status 503 and `error` equal to `AI service error. Please try again.`
- For 429, `vi.mocked(checkRateLimit).mockReturnValueOnce` with `{ allowed: false, remaining: 0, resetTime, message: 'Rate Limit exceeded' }`. Expect status 429, that `error` string, and the echoed `remaining` and `resetTime`. Expect `chat` not to have been called for that request. Restore the allow mock afterward so later tests in the file stay on the success path (`mockReturnValueOnce` is enough if the default mock remains `allowed: true`).
- For 500, reject `chat` with `new Error('knowledge base read failed')`. The message must not include `OpenAI`, `All LLM providers failed`, or `Rate limit`. Expect status 500 and `error` equal to `Internal server error, please try again later.`

**Patterns to follow:** Existing `describe` blocks and `postChat` in `app/api/chat/route.test.ts`.

**Test scenarios:**

- Covers AE1. Valid session and one user message; `chat` throws `All LLM providers failed…`; response is 503 with `AI service error. Please try again.`
- Valid request; `checkRateLimit` returns `allowed: false` and `message: 'Rate Limit exceeded'`; response is 429 with that message, `remaining`, and `resetTime`; `chat` is not called.
- Valid request; `chat` throws `knowledge base read failed`; response is 500 with `Internal server error, please try again later.`

**Verification:** `npx vitest run app/api/chat/route.test.ts`

### U2. Fallback chain exhaustion

**Goal:** `chat()` throws when every entry in a configured chain fails with a retryable error.

**Requirements:** R4, R6. AE3. KTD4, KTD6.

**Dependencies:** None.

**Files:** `app/api/lib/__tests__/llm-fallback-exhaustion.test.ts` (new). Mock shape copied from `app/api/lib/__tests__/llm-google-contents.test.ts`. Do not add Anthropic.

**Approach:**

- Mock `@google/genai`, `openai` (DeepSeek via `baseURL`), `../langsmith`, and `../langfuse` the same way the contents test does.
- `vi.stubEnv` for `GOOGLE_API_KEY`, `DEEPSEEK_API_KEY`, `AI_MODEL=gemini-2.5-flash`, `AI_MODEL_FALLBACKS=["deepseek-v4-pro"]`. Do not set `ANTHROPIC_API_KEY`.
- Reject `generateContent` and the DeepSeek `create` with an error whose `status` is 429.
- Dynamic-import `chat` after the env stubs, call it with a single user turn, and expect a rejection whose message matches `/All LLM providers failed/`.
- Assert both SDK mocks were invoked once, so a throw from a one-provider chain cannot pass.

**Patterns to follow:** `drops a client system role when Gemini fails over to DeepSeek` in `app/api/lib/__tests__/llm-google-contents.test.ts`.

**Test scenarios:**

- Covers AE3. Both providers reject with status 429; `chat()` rejects with `/All LLM providers failed/`; both SDK mocks ran once.
- Guard: the test must not pass if only the primary is invoked.

**Verification:** `npx vitest run app/api/lib/__tests__/llm-fallback-exhaustion.test.ts`

### U3. Widget failure UX

**Goal:** A stubbed 503 shows the alert, rolls back the user turn, restores the input, and Retry sends again.

**Requirements:** R5, R6. F4. AE2, AE4. KTD2, KTD3, KTD7.

**Dependencies:** None.

**Files:** `e2e/chat.spec.ts`

**Approach:**

- Register `page.route('**/api/chat')` before `goto`, fulfill every hit with status 503 and `{ error: 'AI service error. Please try again.' }`, and count hits.
- Use a filter-passing message in the same style as `FILTER_PASSING_MESSAGE` in that file. Send it.
- Assert `getByRole('alert')` contains `AI service error. Please try again.`
- Assert no `article` named `Your message` contains that sent text.
- Assert the textbox named `Message input` has that value.
- Click the button named `Retry`. Wait until the alert contains the same text again and the hit count is 2. Do not assert the alert during the in-flight gap.

**Patterns to follow:** The stubbed happy-path test in `e2e/chat.spec.ts`.

**Test scenarios:**

- Covers AE2. Stub stays 503; after send, alert text is present, the user article for that text is absent, and the input value equals the sent text.
- After Retry, the stub has been hit twice and the alert text is present again.

**Verification:** `npx playwright test e2e/chat.spec.ts`

---

## Verification Contract

- U1: `npx vitest run app/api/chat/route.test.ts`
- U2: `npx vitest run app/api/lib/__tests__/llm-fallback-exhaustion.test.ts`
- U3: `npx playwright test e2e/chat.spec.ts`
- Full unit suite: `npm test`
- Full browser suite: `npm run test:e2e`
- No new CI workflow. Existing GitHub Actions already runs both commands. AE4 is met when those jobs stay green without provider secrets.
- No production file in the diff except test files named above.

## Definition of Done

- U1, U2, and U3 each meet their verification command.
- `npm test` and `npm run test:e2e` pass without provider API keys.
- The diff does not change `app/api/chat/route.ts`, `app/api/lib/llm.ts`, `components/ChatInterface.tsx`, or `/api/analyze-jd`.
- Abandoned experiments and extra test files are not left in the diff.
- Deferred items in the Product Contract remain unbuilt.
