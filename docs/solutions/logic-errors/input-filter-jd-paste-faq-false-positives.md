---
title: "Portfolio chat: JD pastes false-positive FAQ short-circuits"
date: 2026-07-18
category: logic-errors
module: input-filter
problem_type: logic_error
component: assistant
symptoms:
  - "Pasting a full job description returned a canned salary_query or work_arrangement_query reply instead of calling the LLM"
  - "Employer copy containing phrases like salary range, full-time, C2C, or authorized to work triggered FAQ matchers without an ask-shaped question"
  - "Long JDs with embedded compensation or trailing salary/C2C questions still short-circuited before the LLM path"
root_cause: logic_error
resolution_type: code_fix
severity: medium
related_components:
  - testing_framework
tags:
  - input-filter
  - chat
  - short-circuit
  - faq-router
  - job-description
  - vitest
  - pr-7
---

# Portfolio chat: JD pastes false-positive FAQ short-circuits

Merged in [PR #7](https://github.com/mikkel250/portfolio-react-ts/pull/7) (`fix: short-circuit router for JD false positives`). Plan: `docs/plans/2026-07-17-001-fix-short-circuit-router-plan.md`.

## Problem

The portfolio chat assistant uses `filterInput` to short-circuit common recruiter questions with canned FAQ replies and route everything else to the LLM. Before the fix, FAQ matchers ran on keyword presence anywhere in the message. Long job-description (JD) pastes and employer blurbs routinely contained terms like "salary range," "full-time," "W2," or "authorized to work," so recruiters pasting a role received instant compensation or arrangement canned text instead of substantive JD match analysis. That broke the primary product flow for role-share messages while still needing true short asks and hard garbage (keyboard mash) to stay canned.

## Symptoms

- Pasting an observed-style JD with a compensation section returned `shouldCallAPI: false` with `reason: salary_query` instead of the LLM path (`lib/input-filter.test.ts` AE1).
- JD pastes without compensation but with contract/full-time employer language false-positived on `work_arrangement_query` (AE2).
- Long pastes with embedded recruiter questions still short-circuited on salary or arrangement (AE6 — role-share must win).
- Short employer blurbs ("Looking for W2 only…", "Must be authorized to work…", "C2C preferred…") triggered FAQ canned replies when they should proceed to the LLM.
- Employer copy ending in "Any questions?" was treated as an FAQ ask when matchers keyed off any `?` in the string.

## What Didn't Work

- **Keyword-anywhere FAQ matchers without a router gate.** Tightening individual patterns in salary/arrangement helpers could not fix JD pastes: employer copy legitimately contains the same vocabulary recruiters ask about. Running job FAQ checks without ask-shape / role-share gating meant any substring match won.
- **Treating any trailing `?` as ask-shaped.** A blanket question-mark heuristic classified employer closers ("Any questions?") as user asks and re-opened short-circuit paths.
- **Bolting a JD skip only onto work-arrangement.** Salary, location, and work-auth shared the same false-positive class; product chose a single eligibility router. (session history / plan)
- **Second LLM classifier for canned vs LLM.** Rejected for latency/cost — if calling a model, answer with that call. (session history / plan)
- **Relying on ad-hoc `tests/test-job-filtering.ts` as the gate.** That script exercises `filterJobCriteria` in isolation via `npx tsx` and is not in Vitest CI; it did not cover `filterInput` router ordering.
- **E2E `"hi"` as the sole short-circuit fixture.** Welcome text contains `?`, which activates the follow-up path and makes greeting-based filter tests brittle for characterizing "never hits API." Prefer a clear generic or dedicated Vitest AE cases for JD FPs. (session history)

## Solution

Reshape `filterInput` into an ordered short-circuit router (`lib/input-filter.ts` header + `filterInput`):

1. **Mash** — `checkSpamMash` rejects repeated chars and keyboard patterns (length gated by `ROLE_SHARE_LENGTH`).
2. **Role-share** — `isRoleShareOrLongPaste` sends long pastes and JD-shaped text to the LLM (`reason: role_share_or_long_paste`). Role-share wins even when terms questions are embedded.
3. **FAQ eligible** — `isShortCircuitEligible` = not role-share **and** `looksLikeFaqAsk`. Only then run `filterJobCriteria`, location, and work-arrangement canned matchers.
4. **Greetings** — `checkGenericQuery` before follow-up so bare `"hi"` after a prior `?` stays canned.
5. **Follow-up** — Short non-empty replies after a prior `?` go to the LLM (`valid_follow_up`).
6. **Too-short / default** — remaining traffic to canned too-short or LLM.

**`looksLikeFaqAsk` without blanket `?`.** Require a leading interrogative, directed expectation phrases (`his|her|your|mikkel's` + salary/compensation/pay expectation), sponsorship phrases with a subject, or bare `W2`/`C2C`/`1099` asks — not any embedded question mark.

**`role_mismatch` intentionally behind eligibility for non-ask openings.** Through `filterInput`, openings like `"Hiring a physician role."` are not FAQ-eligible and proceed to the LLM by design (documented at the eligibility gate and locked in Vitest). `filterJobCriteria` still declines those openings when called directly. Do not ungate without revisiting the product contract.

**Vitest as primary gate.** `lib/input-filter.test.ts` covers AE1–AE6 and regressions via `npm test`. Client (`ChatInterface`) and server (`app/api/chat/route.ts`) share one `filterInput` module.

## Why This Works

The failure was a **scope error**, not a missing keyword: FAQ matchers were correct for genuine asks but ran on the wrong message class. JD pastes are long, multi-line employer copy with FAQ vocabulary embedded as requirements—not as questions to Mikkel.

`isRoleShareOrLongPaste` hard-vetoes FAQ short-circuits using length, JD heuristics, and structural signals before any FAQ matcher runs. For shorter employer blurbs, `looksLikeFaqAsk` separates recruiter questions from requirements. Combined in `isShortCircuitEligible`, FAQ patterns only fire on ask-shaped input while true positives (salary expectation, C2C, mash, greetings) remain covered.

## Prevention

- **Review router order, not just patterns.** New FAQ canned replies must sit behind `isShortCircuitEligible` inside `filterInput`. Ask: "Does this fire on a long JD paste or a one-line employer blurb?"
- **Test through `filterInput`, not only `filterJobCriteria`.** Helper-unit declines do not prove chat router behavior.
- **Avoid blanket `?` or keyword-anywhere heuristics.** Prefer leading interrogatives and directed phrases.
- **Preserve role-share precedence** on mixed long messages (AE6).
- **Do not ungate `role_mismatch` on non-ask openings** without explicit product review — intentional LLM path for openings; helper may still decline.
- **Run `npm test`** (includes `lib/input-filter.test.ts`) before merge; treat `tests/test-job-filtering.ts` as ad-hoc only.

## Related Issues

- [PR #7 — fix: short-circuit router for JD false positives](https://github.com/mikkel250/portfolio-react-ts/pull/7) (merged)
- Plan: `docs/plans/2026-07-17-001-fix-short-circuit-router-plan.md`
