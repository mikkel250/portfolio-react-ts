# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Agent workflow & Compound Engineering

### Documented Solutions
Institutional learnings captured after a solved problem — bugs, practices, and workflow guidance — organized by category with searchable YAML frontmatter. Agents consult this store when implementing or debugging in documented areas. Created and grown by compounding, not by project setup.

### CE Local Config
Per-checkout Compound Engineering preferences (delegation defaults, output formats, optional feature toggles). Machine-specific; must stay out of version control even when an ignore rule already exists, because ignore patterns do not untrack files already in the index.

### Ce-setup
Compound Engineering health-check and repo-local config helper. Verifies optional tools and keeps local config / example templates aligned; it does not scaffold Documented Solutions or root orientation docs (`AGENTS.md`, `ARCHITECTURE.md`).

### Cursor Artifacts (retired)
Former hand-rolled session coordination pack under `.cursor/artifacts/` (plans, open questions, review notes, local architecture). **Retired in this repo.** Use `docs/plans/` for plans, `docs/solutions/` for learnings, root `ARCHITECTURE.md` for stack/invariants, and plan Open Questions sections for blockers.
*Avoid:* reintroducing `.cursor/artifacts/` coordination or the `/0`–`/6` command loop
