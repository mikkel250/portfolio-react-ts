---
title: "chore: Tailwind CSS v4 upgrade (npm audit / build toolchain)"
date: 2026-10-13
type: chore
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-plan-bootstrap
execution: code
---

# chore: Tailwind CSS v4 upgrade (npm audit / build toolchain)

## Goal Capsule

**Outcome:** Clear Tailwind-related **high** npm audit findings (`braces`, `chokidar`, `micromatch`, `fast-glob`, nested `postcss-selector-parser`) by moving off **Tailwind 3.2.7** to **Tailwind v4**, without visible regressions on portfolio pages or the chat widget.

**Means:** Official `@tailwindcss/upgrade` tool + Next.js PostCSS guide (`@tailwindcss/postcss`), then manual fixes for the large **typography** theme block and any v4 utility renames.

**Authority:** This plan > [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide) > [Next.js + Tailwind v4 install](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

**Stop when:** `npm run build`, `npm test`, and `npm run test:e2e` pass; `npm audit` no longer reports the Tailwind/`braces` chain; spot-check `/`, `/about`, `/portfolio`, and chat UI in the browser.

**Not in scope:** Chasing **zero** audit findings (Vitest/esbuild/Tailwind-unrelated advisories may remain).

---

## Product Contract

### Summary

npm audit flags multiple **high** issues on a dependency chain that exists only because **Tailwind 3.2.7** pulls old `chokidar` → `braces` / `micromatch` / `fast-glob`. Those packages run at **dev/build time** (content scanning), not in the Vercel server runtime, so exploitability for site visitors is low—but CI and local `next dev` still carry the advisory noise, and staying on 3.2 is far behind current Tailwind and plugins.

This app’s **runtime UI** is mostly plain utility classes in TSX; **no `@apply`** in SCSS. The real migration cost is **`tailwind.config.js` (~340 lines)**, almost entirely **custom `@tailwindcss/typography`** styling for `Prose.tsx`, plus a **custom `matchUtilities` plugin** for `bg-grid` / `bg-dot` utilities that appear **unused** in components (safe to delete rather than port).

### Requirements

- R1. Replace Tailwind 3 PostCSS setup with v4: `tailwindcss`, `@tailwindcss/postcss`, `postcss`; drop direct `autoprefixer` dependency if redundant (v4 handles vendor prefixes).
- R2. Migrate `styles/globals.css` from `@tailwind base/components/utilities` to `@import "tailwindcss";` (and plugin imports per v4 docs).
- R3. Preserve chat + marketing visual parity for typography (`prose`, `prose-invert`, `prose-cyan` in `components/Prose.tsx`) within acceptable drift.
- R4. Keep `@tailwindcss/forms` behavior for form controls (e.g. `Contact.tsx`).
- R5. Remove `@tailwindcss/line-clamp` (native in modern Tailwind; no `line-clamp-*` usage found in TSX).
- R6. Re-run `npm audit` and document which Tailwind-chain advisories cleared.

### Actors

- A1. Maintainer — runs upgrade, reviews diff, merges after CI.
- A2. Visitor — sees unchanged layout/typography (accept minor token-scale shifts from v4 renames).

### Key Flows

- F1. Automated upgrade branch → `npm run dev` → visual pass on primary routes.
- F2. `npm run build` (production CSS) → `npm run test:e2e` smoke.

### Acceptance Examples

- AE1. `npm audit` no longer lists `tailwindcss` / `braces` / `chokidar` / `micromatch` / `fast-glob` as vulnerable paths from this repo’s direct tree.
- AE2. `components/Prose.tsx` markdown blocks render with readable headings, links, and code styles in light context used on the site.
- AE3. Chat widget (`ChatInterface`, `ChatMessage` SCSS + Tailwind classes) unchanged at a glance.

### Scope Boundaries

**In scope**

- Tailwind v4, PostCSS config, CSS entrypoint, plugin migration, utility renames, deleting dead custom utilities, lockfile refresh.

**Out of scope**

- Redesign, Tailwind v4 `@theme` redesign of the whole color system, Playwright visual snapshot suite, upgrading `tailwind-merge` major unless required.

### Deferred

- Pin-level `npm overrides` on `braces` without Tailwind 4 (rejected: fights the lockfile, audit still nags).
- Tailwind 3.4.x only bump (does **not** satisfy audit’s suggested `tailwindcss@4.x` fix path).

---

## Planning Contract

### Known-to-be-decided (KTD)

| ID | Topic | Decision |
|----|--------|----------|
| KTD-1 | Upgrade automation | Run `npx @tailwindcss/upgrade` on a dedicated branch first; human-review diff before manual fixes. |
| KTD-2 | Config format | Expect JS config → **CSS-first** (`@theme`, `@plugin`) per upgrade tool; keep a minimal `@config` only if the tool leaves a partial JS file. |
| KTD-3 | Typography | Port the large `theme.extend.typography` block from `tailwind.config.js` to v4-compatible typography customization ([typography plugin v4 docs](https://github.com/tailwindlabs/tailwindcss-typography)) or simplify to defaults + small CSS overrides if parity is close enough. |
| KTD-4 | Custom `bg-grid` plugin | **Delete** unused `matchUtilities` plugin and `flattenColorPalette` import (no TSX references). |
| KTD-5 | Utility renames | v4 renames (`shadow-sm` → `shadow-xs`, `rounded-sm` → `rounded-xs`, `outline-none` → `outline-hidden`, etc.). Grep repo after upgrade; fix or enable compatibility layer if offered by upgrade tool. ~10–20 files touched per current grep, mostly components + chat SCSS. |
| KTD-6 | Browser floor | v4 targets Safari 16.4+, Chrome 111+, Firefox 128+—acceptable for a recruiter portfolio in 2026. |

### Technical design

**Current stack**

| Piece | Today |
|--------|--------|
| `tailwindcss` | **3.2.7** (pinned; old nested `chokidar`) |
| PostCSS | `tailwindcss` + `autoprefixer` (`postcss.config.js`) |
| CSS entry | `styles/globals.css` — `@tailwind` directives |
| Config | `tailwind.config.js` — forms, line-clamp, typography (heavy), custom utilities |
| Next | 15 App Router — `app/layout.tsx` imports `../styles/globals.css` |

**Target stack (Next + PostCSS path)**

```text
package.json
  tailwindcss@^4
  @tailwindcss/postcss
  postcss
  @tailwindcss/forms
  @tailwindcss/typography
  (remove @tailwindcss/line-clamp, autoprefixer if unused)

postcss.config.mjs
  plugins: { "@tailwindcss/postcss": {} }

styles/globals.css
  @import "tailwindcss";
  @plugin "@tailwindcss/forms";
  @plugin "@tailwindcss/typography";
  (+ @theme / typography overrides migrated from tailwind.config.js)

instrumentation.ts / API routes — unchanged (no Tailwind at runtime)
```

**Why this clears audit but “doesn’t feel big”**

- Most pages use standard utilities; migration tool rewrites many class names.
- **Hidden complexity** is the **prose theme object** (200+ lines), not page count.
- Custom grid background utilities are **dead code**—removing them reduces port work.

**Sequencing**

1. Merge open dependency PRs first (#22 Vitest, #23 OTel, #21 Langfuse if still open) to avoid lockfile conflicts.
2. Branch `chore/tailwind-v4` from updated `main`.
3. Run upgrade tool; commit mechanical diff.
4. Manual: typography + plugin CSS, delete dead plugin, fix rename grep failures.
5. Verify + audit diff.

### Assumptions

- Node **20+** on dev/CI (already required by Langfuse OTel).
- No reliance on removed v3 utilities listed in the upgrade guide (verify via build + grep).
- `@acebuilder/component-tagger` does not hard-pin Tailwind 3 (check after install; escalate if it blocks).

### Open Questions

| Question | Blocking? | Default if unanswered |
|----------|-----------|---------------------|
| Accept minor visual drift on prose/chat shadows if we simplify typography config? | No | Prefer simplified typography + quick visual check over 1:1 port of 300-line config. |
| Add Playwright screenshot diff for `/` after upgrade? | No | Manual browser check only (MVTS already covers smoke). |

---

## Implementation Units

### U-1 — Branch and automated upgrade

- Create `chore/tailwind-v4` from latest `main`.
- Run `npx @tailwindcss/upgrade` (Node 20+).
- Inspect diff: `package.json`, lockfile, `postcss.config.*`, `styles/globals.css`, fate of `tailwind.config.js`.

**Done when:** Project installs; `npm run dev` starts (may look broken until U-2).

### U-2 — PostCSS and CSS entry (Next alignment)

- Align with [Next.js + Tailwind v4 guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs): `@tailwindcss/postcss` only in PostCSS config.
- Replace `@tailwind` directives in `styles/globals.css` with `@import "tailwindcss";`.
- Wire `@plugin` for forms + typography.

**Done when:** `npm run build` completes CSS pipeline without PostCSS errors.

### U-3 — Typography and plugins

- Remove `@tailwindcss/line-clamp` from dependencies and config.
- Migrate or replace `theme.extend.typography` customizations (invert + DEFAULT) using v4 typography plugin patterns.
- Validate `components/Prose.tsx` (`prose prose-sm md:prose-base prose-invert prose-cyan`).

**Done when:** Prose-rendered content matches intent on a page that uses `Prose` (e.g. legal/copy blocks if any).

### U-4 — Remove dead custom utilities

- Delete `matchUtilities` / `flattenColorPalette` / `mini-svg-data-uri` grid plugin block from legacy config (or equivalent after CSS migration).
- Confirm no `bg-grid*` / `bg-dot*` classes in repo.

**Done when:** No references; build still passes.

### U-5 — v4 utility rename sweep

- Grep and fix per [upgrade guide renames](https://tailwindcss.com/docs/upgrade-guide#renamed-utilities): `shadow-sm`, `rounded-sm`, `outline-none`, `ring`, blur scale, etc. (hits `Contact`, `Hero`, `Navbar`, `ChatInterface.scss`, `ChatWidget.scss`, etc.).
- Re-run upgrade tool codemods if available for missed files.

**Done when:** No missing styles on manual route walkthrough.

### U-6 — Verification and audit

- `npm test`, `npm run build`, `npm run test:e2e`.
- Capture `npm audit` before/after counts in PR description.
- Update `ARCHITECTURE.md` stack line if it mentions Tailwind 3 explicitly.

**Done when:** CI green; audit Tailwind chain gone.

---

## Verification Contract

| Check | Command |
|--------|---------|
| Unit tests | `npm test` |
| Production build | `npm run build` |
| E2E smoke | `npm run test:e2e` |
| Audit (informational) | `npm audit` |
| Manual | `npm run dev` — `/`, `/about`, `/portfolio`, open chat, send filter-passing message |

---

## Definition of Done

- [ ] Tailwind v4 + `@tailwindcss/postcss` in production build path.
- [ ] `tailwind.config.js` removed or reduced to documented `@config` shim only.
- [ ] Typography/forms behavior acceptable on `Prose` and forms.
- [ ] Dead `bg-grid` plugin removed.
- [ ] Tests and E2E green.
- [ ] PR notes: audit delta + screenshots or short note on visual check.

---

## Appendix

### npm audit mapping (current `chore/opentelemetry-sdk-trace-node` baseline)

High/moderate issues tied to Tailwind 3.2.7 tree:

- `tailwindcss` → `chokidar` → `braces` (stack exhaustion DoS — **build/dev**)
- `micromatch` / `fast-glob` (same chain)
- `postcss-nested` / `postcss-selector-parser` under Tailwind 3 + `@tailwindcss/typography` peer chain

Audit’s suggested fix version: `tailwindcss@4.3.3`.

### Risk note

These CVEs are **not** exposed to end users browsing the deployed site unless you run a **hostile pattern against the dev watcher** locally. Value of the upgrade is **toolchain hygiene**, **maintainability**, and **cleaner audit signal**—not an emergency production patch.

### Estimated effort

| Phase | Effort |
|--------|--------|
| U-1–U-2 automated + PostCSS | 1–2 h |
| U-3 typography | 2–4 h (largest unknown) |
| U-4–U-5 cleanup + renames | 1–2 h |
| U-6 verify | 1 h |
| **Total** | **~1 day** focused (less if typography simplified aggressively) |
