# Current Milestone

Status: RELEASE READY

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
- M2.1–M2.6 are integrated into `master`.
- The legacy PR #5–#8 stack is closed as superseded after clean integration through PR #11.
- Relationship filters/lenses are intentionally deferred because the implemented relationship contract currently exposes only `CALLS`, so a filter would not provide a meaningful choice.
- The M2 milestone gate passed.

Delta:

- No unfinished M2 product delta remains.
- No next milestone is active.

Next Move: STOP. Await explicit user intent before planning M3 or another milestone.

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
- [x] M2.3 — source split inspection — integrated through PR #11
- [x] M2.4 — explicit loading/empty/partial/error states — integrated through PR #11
- [x] M2.5 — semantic keyboard navigation — integrated through PR #11
- [x] M2.6 — stable responsive automatic layout — integrated through PR #11
- [-] Relationship filters/lenses — deferred; current relationship kind is only `CALLS`, so the control is not meaningfully useful yet
- [x] M2 milestone gate

## Current Decisions

- Semantic graph/evidence remains canonical; interaction changes view/inspection state only.
- Relationship filters are not an M2 completion requirement until multiple useful relationship kinds exist.
- PR #5–#8 are closed legacy execution artifacts; PR #11 is the canonical M2.3–M2.6 integration path.
- Future approved work must start from current `master`; do not recreate the legacy stacked-branch pattern.
- No subsequent milestone is implicitly authorized by M2 completion.

## Verification / Evidence

- PR #11 cleanly integrated the cumulative M2.3–M2.6 product state while changing only `apps/web/src/App.tsx`, `apps/web/src/App.test.tsx`, and `apps/web/src/index.css`.
- PR #11 CI run #68 passed the normal repository gate.
- Post-merge `master` CI run #69 passed the normal repository gate.
- Existing executable coverage protects search/neighborhood focus, relationship evidence inspection, source split preservation, empty/partial/error outcomes, and semantic keyboard traversal.
- Responsive automatic layout uses deterministic projection order with CSS Grid `auto-fit`, bounded lane width, wrapping, and the existing narrow-screen one-column behavior.
- Both the semantic model and web projection contract currently expose relationship kind `CALLS` only; relationship filtering therefore remains deferred rather than creating a no-op control.
- The canonical `.agents/` structure remains intact; the retired `.agent/` knowledge tree was not reintroduced by integration.

## Milestone Gate

- Required M2 slices are integrated: PASS.
- Repository integration and post-merge CI are green: PASS.
- Search/focus, semantic navigation, source/evidence inspection, explicit incomplete states, keyboard interaction, and responsive layout are present together on `master`: PASS.
- No current relationship diversity justifies a filter/lens control: NOT REQUIRED for M2.
- No known in-scope blocker remains: PASS.
- Durable project/iteration truth is updated with milestone completion: PASS after this gate change integrates.

Result: M2 — Canvas Comprehension is RELEASE READY.

## Blockers / Risks

No known in-scope M2 blocker remains.

Future larger-repository work may justify stronger browser-level visual stress coverage, but that is not required to close the current bounded M2 implementation and does not authorize additional scope.

## Next Action

STOP. Start a new milestone plan only after explicit user intent defines the next outcome.
