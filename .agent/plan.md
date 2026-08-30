# CodeFlow Feature Compass

## Feature Shape

M2 improves comprehension by letting developers move from a semantic relationship directly to the source evidence that supports it.

This sprint is the smallest source-inspection slice:

```text
semantic flow
 -> select relationship
 -> inspect canonical source -> target direction
 -> inspect exact supporting source range
 -> inspect provenance and evidence kind
 -> return to node inspection by selecting a function
```

The semantic graph and evidence records remain canonical. Relationship selection only changes inspection state; it does not mutate or infer new graph facts.

Durable visual and interaction language remains owned by root `DESIGN.md`.

## Current Position

M0/M1 and M2.1 are integrated into `master`.

M2.2 is implemented and verified on PR #4 / `feat/m2-edge-evidence-inspection`:

- projected relationships are keyboard-reachable selectable controls
- each relationship exposes an accessible source -> target inspection label
- selected relationship state is visually distinguishable without changing evidence styling
- selecting a relationship opens a relationship-specific inspector
- the inspector shows canonical source -> target direction, supporting file/range, source snippet, evidence kind, analyzer source, and reason
- selecting a function clears relationship selection and returns to the existing node/source inspector
- focus-mode changes clear stale edge inspection state
- focused regression coverage protects relationship selection -> source provenance inspection
- existing node selection and search/neighborhood-focus regressions still pass
- standard format/lint/build/typecheck/test gates passed on CI run #44

No analyzer, semantic IR, API, dependency, persistence, runtime, AI, multi-language, or material architecture boundary changed.

## Delta

None inside the authorized M2.2 slice.

Remaining M2 roadmap capabilities are intentionally outside this sprint:

- relationship filters/lenses once multiple useful relationship kinds exist
- source split mode beyond the existing inspector surface
- stable automatic layout for larger arbitrary graphs
- broader empty/error/partial states
- broader keyboard navigation beyond native primary controls

## Next Move

STOP after integration. M2.2 is release-ready and authorized to merge into `master` in this iteration.
