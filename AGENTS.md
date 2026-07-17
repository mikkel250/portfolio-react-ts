# Agent instructions

Stack, directories, conventions, and architectural invariants live in `ARCHITECTURE.md` — do not duplicate them here.

## Knowledge store

- `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
- `CONCEPTS.md` — shared domain vocabulary (entities, named processes, status concepts). Relevant when orienting to the codebase or discussing domain concepts.
- `docs/plans/` — Compound Engineering unified plans (`ce-unified-plan/v1`). Active work is planned and executed from these files.

## Workflow

Prefer Compound Engineering skills over ad-hoc process:

1. `/ce-brainstorm` or `/ce-plan` — write or deepen a plan under `docs/plans/`
2. `/ce-work` — execute the plan
3. `/ce-code-review` — review changes (ephemeral run artifacts under `/tmp`)
4. `/ce-compound` — capture a verified learning into `docs/solutions/` (may update `CONCEPTS.md`)

Do not read or write `.cursor/artifacts/` — that hand-rolled coordination pack is retired in this repo.

## Scope and ambiguity

- Implement only the assigned task; do not silently redefine architecture or refactor unrelated areas.
- Preserve existing conventions unless asked to change them.
- **Internal ambiguity** (architecture, auth/security, billing, data model, conflicting constraints): stop and escalate. Append blockers to the active plan’s Open Questions section under `docs/plans/`, or ask the user if no plan exists. Do not guess.
- **External ambiguity** (third-party APIs, library behavior): search docs/web before escalating.
