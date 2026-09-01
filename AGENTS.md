# Agent Instructions

`.agents/` is the canonical repository knowledge and engineering-state layer for CodeFlow.

## Canonical Sources

- `.agents/PROJECT.md` — product intent, behavior, scope, constraints, non-goals, and deferred work.
- `.agents/ARCHITECTURE.md` — system boundaries, ownership, data flow, trust boundaries, and invariants.
- `.agents/CURRENT_ITERATION.md` — current execution position, evidence, and single next action.
- `.agents/CODE_PATTERNS.md` — repository-specific implementation patterns and traps.
- `.agents/QUALITY.md` — repository commands, verification strategy, CI, and release-ready gates.
- `.agents/DECISIONS.md` — durable material decisions and rationale.
- `.agents/DESIGN.md` — durable visual, interaction, responsive, and accessibility behavior.

Read only the sources relevant to the requested change. Read `.agents/CURRENT_ITERATION.md` whenever continuing active work or deciding what should happen next.

## Authority

Repository documents own CodeFlow-specific truth. Generic SWE lifecycle, product-authority, minimum-change, delivery, and retrospective rules remain global agent policy and should not be duplicated here.

Prefer the smallest coherent change in the existing owning module. Do not create parallel project-state files, persistent sprint/task plans, or additional `.agents/*.md` files without a durable project-level owner.

Product behavior, public contracts, architecture/data ownership, security/trust boundaries, persistence/runtime topology, and other material decisions require explicit user approval before change.

For material CodeFlow boundaries, inspect `.agents/ARCHITECTURE.md` and `.agents/DECISIONS.md` rather than duplicating those boundaries in this entrypoint.
