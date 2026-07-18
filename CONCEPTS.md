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

## Portfolio chat routing

### Short-Circuit Router
Ordered decision path that chooses an instant canned reply versus the LLM for each chat message. Hard garbage and clear FAQ-shaped asks stay canned; role-share and long pastes default to the LLM. Client and server share one router implementation so outcomes stay aligned.

### Role-Share Paste
A message that presents a job or opportunity (typically a long paste or JD-shaped text) rather than asking Mikkel a short FAQ. Role-share pastes veto FAQ canned replies even when they contain compensation, contract, or other terms language—including when a terms question is embedded in the same message.
*Avoid:* treating every message with job keywords as a Role-Share Paste

### FAQ Eligibility
Whether a message may receive an allowlisted canned FAQ reply. Requires that the message is not a Role-Share Paste and looks like a clear ask (leading interrogative or directed FAQ phrasing)—not merely that an allowlisted keyword appears somewhere in the body.
*Avoid:* keyword-anywhere short-circuiting; blanket “any question mark means FAQ ask”

### FAQ Allowlist
The intentional set of topics that may produce canned short-circuit replies (for example salary expectation, work arrangement, location, work authorization, role mismatch for eligible asks). Expanding the allowlist is an explicit product change, not an accidental keyword expansion.
