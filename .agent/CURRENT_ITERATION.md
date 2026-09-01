# CodeFlow Current Iteration

This file is the canonical live execution state. Keep it concise and update it only when milestone/slice position materially changes.

## Active Milestone

**M2 — Canvas Comprehension**

### Why

Make increasingly complex semantic graphs understandable without manual diagram editing while preserving direct access to truthful source/evidence.

### Milestone Outcome

A developer can navigate a graph large enough to create clutter, focus the relevant semantic neighborhood, inspect supporting source/evidence, understand incomplete/error states, and use primary interactions without losing context.

### In Scope

- focus/neighborhood mode
- relationship filters/lenses when useful relationship kinds justify them
- search/navigation
- source split/snippet inspection
- stable automatic layout
- empty/error/partial states
- keyboard-accessible primary interactions

### Out of Scope

Unless separately authorized:

- analyzer/semantic-IR redesign
- new API semantics
- persistence/graph database
- runtime execution/tracing
- AI explanation
- multi-language expansion
- distributed architecture/infrastructure

## Feature Shape

```text
semantic graph
 -> search/focus relevant neighborhood
 -> navigate nodes/relationships
 -> inspect exact source + provenance
 -> expand source without losing canvas context
 -> understand loading/empty/partial/error states
 -> traverse primary semantics by keyboard
 -> retain readable automatic layout as graph grows
```

The semantic graph and evidence remain canonical. UI interaction changes inspection/focus state; it does not invent graph facts.

## Current Position

Integrated into `master`:

- M0 executable foundation
- M1 first evidence-backed TypeScript flow
- M2.1 search + neighborhood focus
- M2.2 relationship evidence inspection

Verified but not yet integrated into `master` (legacy stacked-branch sequence created before the current continuous-delivery rule):

- PR #5 — M2.3 source split inspection; CI passed
- PR #6 — M2.4 explicit loading/empty/partial/error states; CI passed
- PR #7 — M2.5 semantic keyboard navigation; CI passed
- PR #8 — M2.6 stable responsive automatic canvas layout; CI passed

These open PRs are historical execution state, not the workflow to repeat.

## Delta

M2 has four verified slices pending integration. The repository workflow is being aligned so future approved slices no longer create sprint-per-change or stacked-branch chains.

Remaining M2 capability after the verified stack is integrated:

- relationship filters/lenses, once current relationship kinds make the control meaningfully useful
- milestone-level comprehension verification against M2 exit criteria

Do not manufacture extra M2 slices merely to fill a sprint/iteration structure.

## Next Move

**Integrate the existing verified M2.3–M2.6 stack safely into `master` without creating another stacked/sprint branch, then continue the remaining approved M2 work one logical change at a time with integrate-on-green behavior.**

After all required M2 slices are integrated, run the M2 milestone gate against `.agent/requirements/product-roadmap.md`, declare `RELEASE READY` if exit criteria pass, and stop.

## Evidence

Known integration evidence before this state update:

- PR #4 / M2.2 merged to `master`
- PR #5 CI passed for source split inspection
- PR #6 CI passed for explicit analysis states
- PR #7 CI passed for semantic keyboard navigation
- PR #8 CI passed for responsive automatic layout

Do not claim those open PRs are integrated until `master` actually contains them.
