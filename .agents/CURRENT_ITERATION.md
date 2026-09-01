# Current Milestone

Status: ACTIVE

Goal: Complete M2 — Canvas Comprehension so a graph large enough to create clutter remains understandable without manual diagram editing.

Why: CodeFlow must preserve orientation while developers search, focus, navigate semantic relationships, inspect source/evidence, and handle incomplete analysis states.

## Feature Compass

Shape:

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

Position:

- M0 executable foundation is integrated.
- M1 first evidence-backed TypeScript flow is integrated.
- M2.1 search + neighborhood focus is integrated.
- M2.2 relationship evidence inspection is integrated.
- M2.3–M2.6 are verified on open legacy stacked PRs but are not integrated into `master`.

Delta:

- integrate the verified M2.3–M2.6 stack safely;
- add relationship filters/lenses only when the currently supported relationship kinds make the control meaningfully useful;
- run the M2 milestone-level comprehension gate.

Next Move: Integrate the existing verified PR #5–#8 stack into `master` safely without creating another stacked branch, then continue only the remaining approved M2 work.

## Scope

### In

- focus/neighborhood mode;
- relationship filters/lenses when useful;
- search/navigation;
- source split/snippet inspection;
- stable automatic layout;
- explicit loading/empty/partial/error states;
- keyboard-accessible primary interactions;
- milestone-level verification that the resulting graph remains understandable.

### Out

Unless separately authorized:

- semantic-IR redesign;
- new API semantics unrelated to M2;
- persistence/graph database;
- runtime execution/tracing;
- AI explanation;
- multi-language expansion;
- distributed architecture/infrastructure.

## Slices

- [x] M2.1 — search + neighborhood focus — integrated
- [x] M2.2 — relationship evidence inspection — integrated
- [ ] M2.3 — source split inspection — verified on PR #5, pending integration
- [ ] M2.4 — explicit loading/empty/partial/error states — verified on PR #6, pending integration
- [ ] M2.5 — semantic keyboard navigation — verified on PR #7, pending integration
- [ ] M2.6 — stable responsive automatic layout — verified on PR #8, pending integration
- [ ] Relationship filters/lenses — only if current relationship kinds justify the UX
- [ ] M2 milestone gate

## Current Decisions

- Semantic graph/evidence remains canonical; interaction changes view/inspection state only.
- PR #5–#8 are legacy stacked execution state and must not become the template for future slices.
- New approved work should start from current `master` after the legacy stack is resolved.

## Verification / Evidence

- PR #5 reports passing CI for source split inspection.
- PR #6 reports passing CI for explicit analysis states.
- PR #7 reports passing CI for semantic keyboard navigation.
- PR #8 reports passing CI for responsive automatic layout.
- Repository-wide integration gate remains `pnpm check`.

## Blockers / Risks

- PR #5–#8 form a legacy branch stack; integration order/base relationships must be handled deliberately to avoid losing dependent changes.
- Do not mark those slices complete until their changes are actually present in `master`.

## Next Action

Resolve and integrate PR #5–#8 into `master` with verified final state, then update this file to the next unfinished M2 slice.
