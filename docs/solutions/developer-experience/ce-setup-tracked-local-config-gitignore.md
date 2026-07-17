---
title: "Ce-setup: untrack local Compound Engineering config when gitignore is not enough"
date: 2026-07-17
category: developer-experience
module: compound-engineering
problem_type: developer_experience
component: development_workflow
severity: low
applies_when:
  - "Running /ce-setup on a repo that already has .compound-engineering/config.local.yaml committed"
  - "git check-ignore fails for a path that appears in .gitignore"
  - "Need to clarify what ce-setup manages vs hand-rolled Cursor workflow artifacts"
symptoms:
  - "git check-ignore exits non-zero for config.local.yaml despite .compound-engineering/*.local.yaml in .gitignore"
  - "config.local.example.yaml diverges from the current ce-setup plugin template"
  - "Expectation that /ce-setup scaffolds .cursor/artifacts/ or docs/solutions/ when it does not"
root_cause: config_error
resolution_type: config_change
related_components:
  - tooling
  - documentation
tags:
  - ce-setup
  - compound-engineering
  - gitignore
  - config-local
  - git-rm-cached
  - developer-experience
---

# Ce-setup: untrack local Compound Engineering config when gitignore is not enough

## Context

During `/ce-setup` (Compound Engineering plugin v3.19.0) on the `ce-setup` branch, the setup health check reported two issues:

1. **Local config exists but is "not safely gitignored"** — the plugin detected `.compound-engineering/config.local.yaml` on disk and flagged it as a potential secret-leak risk.
2. **Example config outdated** — `.compound-engineering/config.local.example.yaml` did not match the current plugin template.

The repo already had the correct ignore rule in place:

```74:74:.gitignore
.compound-engineering/*.local.yaml
```

After staging the untrack (`git rm --cached`), `git check-ignore -v .compound-engineering/config.local.yaml` confirms the file is ignored via that rule, and `git ls-files` no longer lists it. The local config file remains on disk but is no longer in the index. As of this writing, that index change (and the example-config refresh) is still local/uncommitted — collaborators only see the fix after it is committed.

A separate confusion arose around what `/ce-setup` actually scaffolds. This repo already had a hand-rolled Cursor agent workflow under `.cursor/artifacts/` (e.g. `ARCHITECTURE.md`, `CURRENT_PLAN.md`). The user expected `/ce-setup` to create those files. It does not. Compound Engineering's knowledge store is `docs/solutions/`, populated when you run `/ce-compound` to document a solved problem. `CONCEPTS.md` is a side effect of compounding, not of setup.

## Guidance

### Fix "local config not safely gitignored"

**Root cause:** Gitignore rules do not apply to files that are already tracked. If `config.local.yaml` was committed before the ignore pattern was added (or committed in a later change despite the pattern), git continues to track it. `git check-ignore` returns nothing for tracked paths, which is exactly what the CE health check detects.

**Fix — untrack without deleting:**

```bash
git rm --cached .compound-engineering/config.local.yaml
```

This removes the file from the index only; the working copy stays on disk. After this, the existing ignore rule at `.gitignore:74` takes effect.

**Verify:**

```bash
# Should print the matching .gitignore rule and path
git check-ignore -v .compound-engineering/config.local.yaml

# Should return no output (file is not tracked)
git ls-files .compound-engineering/config.local.yaml
```

Commit the index change (removal from tracking) so the fix persists for collaborators. `/ce-setup` flags the problem; the untrack step is manual — the skill does not run `git rm --cached` for you.

### Refresh the example config

Copy or sync `.compound-engineering/config.local.example.yaml` from the plugin's current template. In Compound Engineering v3.19.0, the canonical source lives **outside this repo** in the plugin install tree (e.g. Cursor plugin cache under `compound-engineering/.../skills/ce-setup/references/config-template.yaml`) — not as a path inside the working tree. The example file should remain tracked and committed; only `*.local.yaml` variants belong in gitignore.

### Clarify `/ce-setup` vs `/ce-compound` vs `.cursor/artifacts/`

| Mechanism | What it creates / manages |
|-----------|---------------------------|
| `/ce-setup` | CE plugin wiring: config files, health checks, ignore patterns — not agent workflow artifacts |
| `.cursor/artifacts/` | User- or team-defined Cursor agent coordination files (this repo's hand-rolled workflow) |
| `/ce-compound` | Writes solved-problem docs to `docs/solutions/`; may produce `CONCEPTS.md` as a compounding side effect |
| `docs/solutions/` | CE institutional knowledge store — created on first compound, not at setup time |

Do not expect `/ce-setup` to scaffold `.cursor/artifacts/` or `docs/solutions/`. Run `/ce-compound` after solving a problem to populate the knowledge store.

## Why This Matters

Machine-local CE config can contain paths, API preferences, delegation settings, and environment-specific overrides. If `config.local.yaml` stays tracked, every push risks leaking machine-specific or sensitive configuration, and the CE health check correctly blocks "safe" status.

The tracked-vs-ignored distinction is a common git footgun: adding a pattern to `.gitignore` does not retroactively untrack files. Teams often believe a file is "ignored" when it is still in the index.

Misunderstanding `/ce-setup`'s scope leads to false expectations — agents and humans may search `docs/solutions/` or `.cursor/artifacts/` for CE-generated content that was never created because only setup (not compound) was run.

## When to Apply

- CE setup or health check reports **"local config exists but not safely gitignored"** despite an ignore rule already present in `.gitignore`.
- You recently added `.compound-engineering/*.local.yaml` to `.gitignore` but the local config was committed earlier.
- `git check-ignore -v .compound-engineering/config.local.yaml` returns exit code 1 (not ignored) while the file appears in `git ls-files` or `git status`.
- After upgrading the Compound Engineering plugin and the health check flags an **outdated example config**.
- Onboarding a repo that mixes a custom `.cursor/artifacts/` workflow with CE — clarify which tool owns which artifact directory before expecting files to exist.

## Examples

### Example 1: Diagnose tracked local config

```bash
# Ignore rule present?
grep compound-engineering .gitignore
# → .compound-engineering/*.local.yaml

# Is git actually ignoring it?
git check-ignore -v .compound-engineering/config.local.yaml
# Before fix: (no output, exit 1)
# After fix:  .gitignore:74:.compound-engineering/*.local.yaml	.compound-engineering/config.local.yaml

# Still tracked?
git ls-files .compound-engineering/config.local.yaml
# Before fix: .compound-engineering/config.local.yaml
# After fix:  (empty)
```

### Example 2: Full remediation sequence

```bash
# 1. Untrack local config, keep file on disk
git rm --cached .compound-engineering/config.local.yaml

# 2. Confirm ignore works
git check-ignore -v .compound-engineering/config.local.yaml

# 3. Refresh example from plugin template (adjust source path to your plugin install)
cp /path/to/compound-engineering/skills/ce-setup/references/config-template.yaml \
   .compound-engineering/config.local.example.yaml

# 4. Commit the untrack + example refresh
git add .compound-engineering/config.local.example.yaml
git commit -m "fix(ce): untrack local CE config and refresh example template"
```

### Example 3: Wrong expectation after setup

**Symptom:** Ran `/ce-setup`; `docs/solutions/` is empty and `.cursor/artifacts/` was not created or updated by CE.

**Resolution:** This is expected. `/ce-setup` configures the plugin. To capture this learning, run `/ce-compound` — it writes to `docs/solutions/`. Keep using `.cursor/artifacts/` for session-level agent coordination if that is your chosen workflow; CE does not replace it automatically.

## Related

- `.gitignore` — pattern `.compound-engineering/*.local.yaml` (prevention rule; does not untrack already-indexed files)
- `.compound-engineering/config.local.example.yaml` — committed template; copy to `config.local.yaml` per checkout
- No prior `docs/solutions/` entries (first compound run); no matching GitHub issues
- Historical note: ignore rule landed with compound-engineering config; `config.local.yaml` was later committed despite that rule (session investigation via git history)
