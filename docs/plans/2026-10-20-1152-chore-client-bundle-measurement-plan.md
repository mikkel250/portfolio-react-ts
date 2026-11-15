---
title: "Client Bundle Measurement - Plan"
date: 2026-10-20
type: chore
topic: client-bundle-measurement
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-brainstorm
execution: code
---

# Client Bundle Measurement - Plan

## Goal Capsule

- **Objective:** A maintainer can see the client JavaScript weight of each route, including the chat code that loads with every page.
- **Means:** An opt-in bundle-analyzer report (KTD1).
- **Product authority:** This Product Contract. Chat deferral, saved widget state, Lighthouse, and a CI size budget are not active scope.
- **Product Contract preservation:** Outstanding Questions removed. The script-versus-flag fork is KTD1. R, F, and AE IDs are unchanged.
- **Open blockers:** None.
- **Stop when:** The analyze command's client report shows the chat modules, and the ordinary build does not write that report.
- **Execution:** Smoke the two builds. No new unit test.
- **Ships:** The implementer, once the stop condition holds. This plan does not commit or open a pull request.

---

## Product Contract

### Summary

Add a local bundle-analyzer command so a maintainer can see client module weight per route, including the chat code that loads with every page. Visitor behavior stays as it is.

### Problem Frame

The chat ships in the client JavaScript for every route, and the repo has no measurement of that weight. The widget is already open when the page is shown, so the cost is paid before a click. Without a module-level report, there is no evidence for whether that cost is large.

### Key Decisions

- **Measure with a bundle analyzer and leave the widget's load behavior alone.** (session-settled: user-directed — chosen over deferring the chat, splitting its chunk while the modal still opens, and the broader list of load changes: a full load opens the chat, so those changes would not spare the first visit.) Governs R1, R4.
- **Do not save open/closed state in the browser.** (session-settled: user-directed — chosen over persisting that state: repeat visitors are too few to justify it now.) Governs R5.
- **The analyzer is opt-in.** A CI size budget was rejected. Governs R3.

<!-- ce-section: work-relationships -->
### How This Work Fits Together

This plan covers client-bundle measurement only. The other items are the current picture, not a committed sequence.

- Chat load deferral — Can proceed independently of this measurement. It would skip the chat's JavaScript only if a visit started with the chat closed. Still to decide, and not active scope.
- Browser storage for open/closed state — Can proceed independently of this measurement. Current judgment: too few repeat visitors. Not active scope.
- A CI size budget — Depends on a number this measurement can produce. Still to decide, and not active scope.

### Requirements

**Report**

- R1. A maintainer can run one local command that produces a `@next/bundle-analyzer` report for a production build.
- R2. The report shows client module sizes for each route, including the chat modules in the graph those routes share.

**What stays the same**

- R3. The ordinary production build and deploy complete without generating or requiring that report.
- R4. A full page load opens the chat maximized.
- R5. Minimizing the chat lasts only for the current tab session. A reload or a later visit opens it maximized again.

### Key Flows

- F1. Inspect client weight
  - **Trigger:** A maintainer wants the chat's share of first-load JavaScript.
  - **Steps:** Run the analyzer command. Open the report. Find the shared client graph and the chat modules in it.
  - **Outcome:** Module sizes are visible, per R2. Full-load behavior stays per R4.
  - **Covered by:** R1, R2, R4

### Acceptance Examples

- AE1. Analyzer report
  - **Covers R1, R2.**
  - **Given:** A production build of the current site.
  - **When:** The maintainer runs the analyzer command.
  - **Then:** The report shows client modules for the routes, and the chat widget's modules appear in the graph those routes share.
- AE2. Ordinary build
  - **Covers R3.**
  - **Given:** The analyzer is installed.
  - **When:** The maintainer runs the ordinary production build.
  - **Then:** The build completes without producing or requiring the analyzer report.
- AE3. Reload after minimize
  - **Covers R5.**
  - **Given:** A visitor minimized the chat in this tab.
  - **When:** They reload the page.
  - **Then:** The chat opens maximized again.

### Scope Boundaries

- Chat deferral, prefetch, and conditional mount are out of this plan. Load behavior stays as R4 states it.
- Chat rendering changes, including the welcome message, are out of this plan.
- Widget-state persistence is out of this plan. R5 stays the rule.
- A Lighthouse run, a CI size budget, and edits to `docs/interview-prep-technical-deep-dive.md` are out of this plan.

### Dependencies / Assumptions

- Repeat visitors are few enough that unsaved widget state is acceptable.
- The report runs against the existing production build.

### Sources / Research

- `app/layout.tsx` imports `ChatWidget` in the root layout, so the widget's client graph is on every route.
- `contexts/AppContext.tsx` starts the widget at `maximized` and does not read or write browser storage.
- `components/ChatWidget.tsx` imports `ChatInterface` statically and keeps it mounted when the panel is hidden.
- `components/ChatMessage.tsx` imports `react-markdown` on that same client graph.
- `README.md` and `ARCHITECTURE.md` say the widget loads maximized. `docs/interview-prep-technical-deep-dive.md` says it starts as the button. This plan does not change either.
- `package.json` depends on `next` `^15.5.7`. `scripts.build` is `next build`.
- `.github/workflows/test.yml` runs `npm run build` in the e2e job.
- [Next.js 15 package bundling](https://nextjs.org/docs/15/app/guides/package-bundling) is the setup this plan follows. The delta is an ESM config and a separate script, because `next.config.mjs` already exports a config.
- `@next/bundle-analyzer` at the `v15.5.7` tag defaults `enabled` to true, writes `./analyze/client.html` for the client compilation, and calls an existing `webpack` hook when one is present. npm's current release is `16.2.6`, which is the wrong line for this app.

## Planning Contract

### Key Technical Decisions

- KTD1. **Load the analyzer only for a separate command, on the Next 15.5.7 release.** The plugin treats `enabled` as true when that option is omitted, and the e2e job runs the ordinary build. Install `@next/bundle-analyzer` `15.5.7` as a devDependency and resolve it only when `ANALYZE` is `true`, then wrap the existing config. Add an `analyze` script that sets `ANALYZE` and runs the production build. Leave `scripts.build` as `next build`. Rejected: npm's current `16.2.6` release, and turning the plugin on for the existing build script. Governs R1, R2, R3.

### Assumptions

- Production builds stay on webpack. `scripts.build` has no Turbopack flag, and `next.config.mjs` already defines a `webpack` hook. The Next 16 Turbopack analyzer is a different tool.

### Risks & Dependencies

- A top-level import of this devDependency fails when a production start omits devDependencies, because Next loads `next.config.mjs` then. KTD1 avoids that by resolving the package only when `ANALYZE` is `true`.
- Do not edit `.github/workflows/test.yml`. The e2e job is safe only while the ordinary build leaves the plugin disabled, per R3.

## Implementation Units

### U1. Opt-in bundle analyzer

- **Goal:** A maintainer can produce the client module report without changing the ordinary build.
- **Requirements:** R1, R2, R3. F1. Do not change the behavior in R4 or R5.
- **Dependencies:** None.
- **Files:** `package.json`, `next.config.mjs`
- **Approach:**
  1. Add `@next/bundle-analyzer` at `15.5.7` as a devDependency.
  2. In `next.config.mjs`, when `ANALYZE` is `true`, load that package and wrap the existing config so its `webpack` hook still runs. Otherwise export the existing config unchanged. Per KTD1.
  3. Add an `analyze` script that sets `ANALYZE` and runs the production build. Leave `scripts.build` as `next build`.
- **Execution note:** This is packaging and config. Prove it with a build smoke, not a new unit test. CI already runs the ordinary build and must not gain an `ANALYZE` setting.
- **Patterns to follow:** The existing `webpack` function in `next.config.mjs`.
- **Test scenarios:** Test expectation: none — a unit test would not run the webpack plugin, and CI must not run the analyzer. AE1 and AE2 are the smoke checks below.
- **Verification:**
  - Covers AE1. After the analyze command, `.next/analyze/client.html` exists and its contents include `react-markdown` and a chat component module path.
  - Covers AE2. After the ordinary build, with `ANALYZE` unset, that file is absent and the build still completes.
  - `scripts.build` is still `next build`.
  - `components/`, `contexts/AppContext.tsx`, and `app/layout.tsx` are unchanged.
  - The report under `.next/` is not committed. `.gitignore` already ignores `.next/`.

## Verification Contract

- `npm test` — existing unit tests still pass. This plan adds no test file.
- Ordinary build, `ANALYZE` unset — completes, and `.next/analyze/client.html` is absent. Covers AE2.
- Analyze command — completes, and `.next/analyze/client.html` includes `react-markdown` and a chat component module path. Covers AE1 and F1.
- There is no bundle-size threshold. A CI size budget is out of scope.

## Definition of Done

- U1's verification outcomes hold.
- R4 and R5 stay true because their files were not edited.
- The ordinary build script and `.github/workflows/test.yml` do not set `ANALYZE`.
- Abandoned analyzer wiring is not left in the diff.
- `.next/` output is not committed.
