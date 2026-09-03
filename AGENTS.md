# Agent Entry Point

`.agents/` is the canonical repository knowledge and active engineering-state layer for CodeFlow. The user's current SWE Agent Operating System governs delivery behavior; repository documents only specialize it for CodeFlow and must not fork it into parallel process rules.

## Required Read Order

Start every non-trivial change with:

1. `.agents/PROJECT.md` — durable WHY/WHAT, observable product behavior, scope, constraints, non-goals, and open product questions.
2. `.agents/CURRENT_ITERATION.md` — the single source of current engineering truth: active outcome, position, delta, blockers, verification state, and next meaningful action.

Then read only the owners relevant to the change:

- `.agents/ARCHITECTURE.md` — responsibility placement, system/data/security/deployment boundaries, major flows, and invariants.
- `.agents/CODE_PATTERNS.md` — CodeFlow-specific implementation patterns and traps.
- `.agents/QUALITY.md` — repository commands, risk-proportional verification, CI behavior, and release-ready evidence.
- `.agents/DECISIONS.md` — durable material decisions and rationale.
- `.agents/DESIGN.md` — durable product-experience, interaction, accessibility, responsive, visual, token, and component-styling rules.

## Authority

Explicit current user intent is authoritative. One concept has one canonical owner; do not reconcile duplicated prose by inventing a third interpretation.

The user owns product WHY/WHAT, observable behavior, scope, acceptance criteria, public contracts, material architecture/data ownership, security/trust boundaries, persistence/runtime topology, and destructive or irreversible decisions. The agent owns local implementation design, coding, debugging, focused verification, and low-blast refactoring inside those boundaries.

Stop for user authority only when the requested change would materially cross those boundaries or when requirements contradict each other. Do not stop for routine implementation choices that are already inside an authorized outcome.

## Capability-First Delivery

Shape work in this order when planning is needed:

```text
PRODUCT PURPOSE
-> CORE USER JOURNEY
-> CAPABILITY MAP
-> MILESTONE
-> SLICE
-> LOGICAL CHANGE
-> TASK
```

- **Milestone** = the smallest coherent product scope that delivers one meaningful integrated user capability or workflow end-to-end.
- **Slice** = the smallest demonstrable vertical behavior/scenario that materially advances that milestone.
- **Logical Change** = a coherent technical modification required by a slice.
- **Task** = a concrete implementation action inside a logical change.
- **Minimum Change** means the smallest complete authorized implementation, not the smallest diff or fewest files.

Once a milestone and its slices are authorized, execute the remaining slices continuously without restarting planning ceremony or asking for repeated approval. Re-plan only when evidence invalidates the current shape, a material boundary changes, or user intent changes.

For user-facing semantic capability, preserve the normal ownership chain:

```text
analysis/domain truth
-> API/projection contract
-> web interaction/presentation
-> verification
```

Infrastructure-only, migration-only, contract-only, reliability-only, bug-fix, or exploratory work should remain classified as such when it does not independently produce a product capability.

## Verification and State

Use `.agents/QUALITY.md` to choose the lowest sufficient confidence layer for the changed failure boundary. Do not require cumulative unit + integration + E2E + deployment verification when lower-cost evidence is already sufficient. Critical user journeys may justify E2E; deployment gates apply only when deployment surfaces change.

A merge is not evidence of `VERIFIED`, `RELEASE_READY`, `RELEASED`, or `DEPLOYED`. Advance repository state only when the corresponding evidence exists.

## Repository Knowledge Rules

- Keep active execution state only in `.agents/CURRENT_ITERATION.md`.
- Do not create `plan.md`, `STATUS.md`, `TODO.md`, `ACTIVE_PLAN.md`, sprint diaries, milestone activation/closure files, parallel `.agent/` state, or repository-local skill mirrors.
- Do not use `CURRENT_ITERATION.md` as a milestone diary, PR archive, or changelog; retain only current truth and the minimum evidence needed to resume correctly.
- Do not duplicate generic agent lifecycle, branch strategy, testing ladders, retrospective policy, or global preferences across repository files.
- Retire stale or duplicated guidance after confirming no tooling depends on it.

Prefer the existing owner and the smallest coherent authorized vertical change. Do not introduce unrelated cleanup, speculative abstractions, dependency churn, or future product scope while implementing the requested outcome.
