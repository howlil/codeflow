# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension by keeping larger semantic neighborhoods readable without manual diagram editing or introducing a layout-engine dependency.

This sprint is the smallest stable automatic-layout slice:

```text
deterministic projected relationships
 -> responsive auto-fit lanes
 -> preserve stable row-major ordering
 -> add columns when space allows
 -> wrap into more rows as relationships grow
 -> collapse to one column on narrow screens
```

Layout remains a presentation concern. It does not change graph semantics, selection, relationship direction, evidence, focus mode, keyboard traversal, or source inspection.

The semantic projection already provides deterministic relationship ordering; this slice removes the previous fixed two-column presentation constraint and lets CSS place that stable sequence according to available canvas width.

Durable visual and interaction language remains owned by root `DESIGN.md`.

## Current Position

M0/M1, M2.1, and M2.2 are integrated into `master`.

M2.3 is release-ready on PR #5 / `feat/m2-source-split` and remains unmerged.

M2.4 is release-ready on PR #6 / `feat/m2-analysis-states`, stacked on M2.3, and remains unmerged.

M2.5 is release-ready on PR #7 / `feat/m2-keyboard-navigation`, stacked on M2.4, and remains unmerged.

M2.6 is implemented and verified on PR #8 / `feat/m2-stable-auto-layout`, stacked on the verified M2.5 head:

- relationship lanes no longer assume exactly two columns
- CSS Grid uses `auto-fit` with a bounded minimum lane width so available canvas width determines the useful column count automatically
- stable DOM/projection order remains the row-major layout order; no random/manual coordinates are introduced
- additional relationships wrap into further rows instead of squeezing fixed columns
- lanes explicitly align from the start and allow internal content to shrink without forcing horizontal overflow
- the existing narrow-screen breakpoint still collapses lanes to one column
- source-split mode automatically receives fewer columns as the canvas narrows without any separate JS layout state
- no layout engine, graph library, dependency, or persistent layout configuration is introduced
- no new automated test was added because this is presentation-only layout behavior; existing behavior regressions remain the relevant executable confidence
- standard format/lint/build/typecheck/test gates passed on CI run #58

No analyzer, semantic IR, API, dependency, persistence, runtime, AI, multi-language, or material architecture boundary changed.

## Delta

None inside the authorized M2.6 slice.

Remaining M2 roadmap capability intentionally deferred:

- relationship filters/lenses once multiple useful relationship kinds exist

With the current graph model still exposing only `CALLS`, implementing a relationship filter now would create a control with no meaningful filtering choice. It remains deferred rather than inventing M3 semantics.

## Next Move

STOP. M2.6 is release-ready. PR #5, PR #6, PR #7, and PR #8 remain separate integration decisions.
