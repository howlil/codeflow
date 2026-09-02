# Agent Entry Point

`.agents/` is the canonical repository knowledge and active engineering-state layer for CodeFlow. The user's global SWE Agent Operating System governs delivery behavior; do not restate or fork that lifecycle inside this repository.

## Read by Ownership

Read only the sources required by the change:

- `.agents/PROJECT.md` — durable WHY/WHAT, observable product behavior, scope, constraints, non-goals, deferred directions, and open product questions.
- `.agents/ARCHITECTURE.md` — responsibility placement, system/data/security/deployment boundaries, major flows, and invariants.
- `.agents/CURRENT_ITERATION.md` — the single compact source for active milestone state, current position, delta, blockers, and next meaningful action.
- `.agents/CODE_PATTERNS.md` — CodeFlow-specific implementation patterns and traps.
- `.agents/QUALITY.md` — repository commands, proportional verification selection, CI behavior, and risk-specific gates.
- `.agents/DECISIONS.md` — durable material decisions and rationale.
- `.agents/DESIGN.md` — durable visual, interaction, responsive, and accessibility behavior.
- `.agents/skills/frontend/SKILL.md` — `apps/web` implementation guidance.
- `.agents/skills/backend/SKILL.md` — `apps/api` and `packages/analysis-core` implementation guidance.

Read `.agents/CURRENT_ITERATION.md` when continuing work, deciding what remains, or choosing the next authorized engineering action.

## Authority and Conflict Resolution

Explicit current user intent is authoritative. Within repository knowledge, use the owning source above instead of reconciling duplicated prose.

Material product behavior, public contracts, architecture/data ownership, security/trust boundaries, persistence/runtime topology, destructive behavior, and other material decisions require user authority before change. Local implementation choices inside those boundaries are agent-owned.

If repository documents conflict, stop treating history or stale prose as authority and resolve the contradiction in the owning canonical file.

## Repository State Rules

One concept has one owner.

- Do not create `plan.md`, `STATUS.md`, `TODO.md`, `ACTIVE_PLAN.md`, sprint files, milestone activation/closure files, or parallel `.agent/` state.
- Do not use `CURRENT_ITERATION.md` as a milestone diary or PR archive; keep only current execution truth and the minimum evidence needed to resume correctly.
- Do not duplicate generic lifecycle, Minimum Change, Product Authority, testing ladder, branch strategy, or retrospective policy in repo docs.
- Do not create activation/closure PR ceremony solely to move repository state. Update canonical state as part of the logical change that makes it true.
- Do not create branch-per-tiny-change workflow guidance. Integrate at coherent logical-change boundaries.
- Retire stale or duplicated workflow guidance after confirming no tooling depends on it.

## Implementation Entry

Prefer the existing owning module and the smallest coherent authorized vertical change. For user-facing semantic capability, use both frontend and backend skills so semantic truth, API projection, UI behavior, and verification ship together. Infrastructure-only, contract-only, migration-only, or exploratory work may remain intentionally non-vertical when that is the authorized outcome.

Do not introduce unrelated cleanup, speculative abstractions, dependency churn, or future product scope while implementing the requested outcome.
