# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension by keeping semantic context visible while source inspection receives enough space for focused reading.

This sprint is the smallest source-split slice:

```text
semantic flow
 -> inspect selected node or relationship
 -> expand source
 -> keep canvas + selection visible
 -> read source/evidence in a wider inspector
 -> restore the standard inspector layout
```

Source split is view state only. It does not change the selected semantic entity, relationship, evidence, or canonical graph.

Durable visual and interaction language remains owned by root `DESIGN.md`.

## Current Position

M0/M1, M2.1, and M2.2 are integrated into `master`.

M2.3 is implemented on `feat/m2-source-split`:

- node and relationship inspectors expose one `Expand source` control
- expanded mode reallocates workspace width toward source while keeping repository context and semantic canvas visible
- `Restore inspector` returns to the normal three-region proportions
- source split stays synchronized with the currently selected node or relationship
- primary controls remain native keyboard-reachable buttons
- responsive layouts collapse expanded and standard modes to the same single-column reading order below the existing breakpoint
- focused regression coverage protects expand -> canvas preserved -> source preserved -> restore

No analyzer, semantic IR, API, dependency, persistence, runtime, AI, multi-language, or material architecture boundary changed.

## Delta

Verification remains before release-ready:

1. standard format/lint/build/typecheck/test gates pass
2. PR diff stays limited to M2.3 layout/view state, focused coverage, and Feature Compass state

Remaining M2 roadmap capabilities are intentionally outside this sprint:

- relationship filters/lenses once multiple useful relationship kinds exist
- stable automatic layout for larger arbitrary graphs
- broader empty/error/partial states
- broader keyboard navigation beyond native primary controls

## Next Move

Run standard CI. Fix only observed regressions. If green, mark M2.3 release-ready and stop for integration decision.
