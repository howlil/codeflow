# Current Iteration

Status: ACTIVE

Active Milestone: M4 — Data Flow & Static Simulation

Last Completed: M3 — Real Repository Analysis (`RELEASE READY`)

Goal: Extend CodeFlow from function/call topology into evidence-backed TypeScript data movement and deterministic static step-through while keeping static semantics distinct from observed runtime behavior.

## Feature Compass

Shape:

```text
bounded TypeScript repository
 -> function inputs / outputs
 -> local value flow / transforms
 -> reads / writes / mutations
 -> branch / failure possibilities
 -> additive static-flow projection
 -> API
 -> inspector + relationship lens + static step-through
```

Position:

- M4.1–M4.4 are implemented and verified on PR #19.
- Existing M2/M3 canvas, repository input, search/focus, keyboard navigation, source, and call-evidence behavior remain intact.
- The M4 projection is additive: existing function nodes and `CALLS` edges remain canonical while `functionData` and `staticFlow` expose source-backed data semantics.
- Canonical PR CI #94 passed after formatting/test-isolation fixes, and final implementation/docs head CI #96 also passed.

Delta: Integration and post-merge verification only.

Next Move: Squash-merge PR #19, verify the resulting `master` commit, then record the M4 milestone gate.

## Slices

### M4.1 — Function Inputs & Outputs — VERIFIED

- declared function parameters and explicit return paths retain repository-relative provenance;
- supported call arguments map to callee parameters;
- function inputs, outputs, and argument mappings are exposed in the inspector.

### M4.2 — Local Value Flow & Transformations — VERIFIED

- supported declarations, lexical reads/writes, transforms, and value dependencies are projected;
- lexical flow does not pretend runtime branch selection is known;
- supported value flow crosses existing resolved call boundaries without inventing parser/UI semantics.

### M4.3 — Reads, Writes, Mutations & Relationship Lenses — VERIFIED

- static relationships include `READS`, `WRITES`, `MUTATES`, `FLOWS_TO`, `PASSES_ARGUMENT`, and `RETURNS_TO` alongside the existing `CALLS` graph;
- evidence remains source-backed and repository-relative;
- relationship lenses expose only semantic kinds present in the projection.

### M4.4 — Deterministic Static Step-through & Failure Paths — VERIFIED

- ordered source-backed static steps support forward/reverse exploration and semantic selection synchronization;
- branch and throw paths are explicitly labeled as static possibilities;
- runtime values, timing, frequency, probability, and branch outcomes are not fabricated.

## Boundaries Preserved

M4 adds no runtime execution/tracing, framework-specific persistence/event inference, Git-host auth/import, persistence, AI explanation, another language adapter, queue/worker, Redis, graph database, or distributed architecture.

Static-flow evidence remains static evidence and is never presented as `observed-runtime`.

## Verification / Evidence

PR #19 canonical CI evidence:

- CI #94: `pnpm check` success after formatter/test-isolation correction;
- CI #96: final implementation + architecture/design head `pnpm check` success;
- formatting: Prettier clean;
- lint: clean;
- `analysis-core`, web, and API builds: pass;
- web: 13/13 tests pass — 10 existing M2/M3 regressions + 3 M4 inspector/lens/step-through tests;
- API: 10/10 tests pass — 7 existing M3 regressions + 3 M4 function-data/static-flow/determinism tests;
- M4 tests verify no `observed-runtime` evidence is fabricated by static step-through.

Post-merge `master` CI is still required before M4 can be marked `RELEASE READY`.

## Risks / Blockers

No product, architecture, implementation, or PR-head verification blocker remains inside the approved M4 scope.

## Next Action

Integrate PR #19, verify merged `master`, perform the M4 milestone gate, then STOP.
