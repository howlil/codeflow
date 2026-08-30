# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension by making incomplete analysis states explicit without discarding useful semantic context.

This sprint is the smallest analysis-state slice:

```text
analysis request
 -> loading
 -> ready | empty | partial | error
 -> partial keeps recovered functions navigable
 -> missing evidence stays visibly unavailable
```

Analysis-state rendering is a UI interpretation of the existing projection contract. It does not create semantic entities, relationships, evidence, or confidence.

Durable visual and interaction language remains owned by root `DESIGN.md`.

## Current Position

M0/M1, M2.1, and M2.2 are integrated into `master`.

M2.3 is release-ready on PR #5 / `feat/m2-source-split` and remains unmerged.

M2.4 is implemented and verified on PR #6 / `feat/m2-analysis-states`, stacked on the M2.3 head:

- loading and request failure are distinct states
- a completed projection with zero functions renders an explicit empty state instead of an empty workspace
- projections with a missing entry point, dangling relationship endpoint, or missing relationship evidence render a `Partial projection` notice
- partial projections keep recovered functions searchable and navigable
- the canvas derives its default focal function from canonical `entryPointId`; a missing entry point is not silently replaced
- relationships without evidence render `evidence-unavailable` instead of falling back to `inferred-static`
- relationship/node inspection shows missing provenance explicitly instead of omitting it
- focused regression coverage protects empty, partial-but-navigable, missing-evidence, and request-failure behavior
- existing node selection, search/neighborhood focus, relationship evidence inspection, and source split regressions remain green
- standard format/lint/build/typecheck/test gates passed on CI run #52

No analyzer, semantic IR, API, dependency, persistence, runtime, AI, multi-language, or material architecture boundary changed.

## Delta

None inside the authorized M2.4 slice.

Remaining M2 roadmap capabilities intentionally outside this sprint:

- relationship filters/lenses once multiple useful relationship kinds exist
- stable automatic layout for larger arbitrary graphs
- broader keyboard navigation beyond native primary controls

## Next Move

STOP. M2.4 is release-ready. PR #5 and PR #6 remain separate integration decisions.
