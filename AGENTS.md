# Agent Instructions

This repository uses `.agents/` as the canonical project knowledge and active iteration state.

Before making a meaningful change, inspect the relevant canonical documents.

## Canonical Sources

- `.agents/PROJECT.md`
  Product intent, domain behavior, scope, contracts, ownership, non-goals, and deferred product work.

- `.agents/ARCHITECTURE.md`
  System boundaries, module ownership, data flow, trust boundaries, and architecture invariants.

- `.agents/CURRENT_ITERATION.md`
  Current milestone, active/pending slices, evidence, risks, and single next action.

- `.agents/CODE_PATTERNS.md`
  Repository-specific implementation patterns and conventions.

- `.agents/QUALITY.md`
  Verification strategy, required checks, CI behavior, and release-ready gates.

- `.agents/DECISIONS.md`
  Durable material decisions and their rationale.

- `.agents/DESIGN.md`
  Durable visual, interaction, workspace, responsive, and accessibility behavior.

Read only the documents relevant to the requested change, but always inspect `.agents/CURRENT_ITERATION.md` when continuing active work.

## Operating Rule

Follow the canonical engineering lifecycle and user authority model.

Do not change product behavior, public contracts, architecture boundaries, data ownership, security/trust boundaries, persistence/runtime topology, or other material decisions without explicit user approval.

Prefer the smallest coherent change and the existing owning module/pattern.

Do not create persistent task plans, sprint files, status files, or additional `.agents/*.md` documents unless the information has a durable project-level owner or the project genuinely requires an optional canonical document.

## Material CodeFlow Boundaries

Treat the following as material boundaries owned by the canonical documents above:

- evidence-backed semantic relationships rather than generated canonical graph facts;
- one shared semantic model across analyzers/adapters;
- parser-specific structures stay behind analysis boundaries;
- canvas/view state is not canonical semantic state;
- static and runtime-observed evidence remain distinguishable;
- ordinary static analysis does not execute arbitrary repository code;
- private/untrusted repository source must respect the documented trust/privacy boundary.

If a requested change crosses one of these boundaries, inspect `.agents/ARCHITECTURE.md` and `.agents/DECISIONS.md` and surface the material decision before implementation.