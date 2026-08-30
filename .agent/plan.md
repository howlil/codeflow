# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension once a semantic graph is large enough that seeing everything at once becomes noise.

This sprint is the smallest M2 slice:

```text
semantic flow
 -> search a function
 -> navigate directly to it
 -> focus on its immediate neighborhood
 -> inspect source/evidence
 -> return to the full flow
```

The existing evidence-backed semantic model remains canonical. Search and focus only change the projection the user is viewing; they do not invent or mutate semantic relationships.

## Current Position

M1 is release-ready on PR #2 and remains the integration base for this stacked sprint.

M2.1 is implemented and verified on PR #3 / `feat/m2-canvas-comprehension`:

- function search is available above the semantic canvas
- matching functions can be selected directly from search results
- search navigation selects the function and enters neighborhood focus
- neighborhood focus shows the selected function plus directly connected call relationships
- incoming and outgoing relationships remain directionally distinguishable
- `Show full flow` returns to the original entry-point projection
- source/evidence inspection continues to follow the selected function
- controls use native input/button semantics and remain usable in the responsive single-column layout
- a focused regression test covers search -> focus -> hidden unrelated node -> full-flow restore
- standard repository format/lint/build/typecheck/test gates passed on the implementation head

No analyzer, API, semantic IR, evidence model, dependency, or persistence boundary changed in this slice.

## Delta

None inside the authorized M2.1 slice.

Remaining M2 roadmap capabilities are intentionally not part of this sprint:

- relationship filters/lenses
- source split/snippet inspection improvements beyond the existing inspector
- stable automatic layout for larger arbitrary graphs
- broader empty/error/partial states
- broader keyboard navigation beyond native primary controls

## Next Move

STOP. M2.1 is release-ready. Integration/merge and selection of the next M2 capability remain separate decisions.
