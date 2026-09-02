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

- M4.1–M4.4 are implemented on PR #19.
- Existing M2/M3 canvas, repository input, search/focus, keyboard navigation, source, and call-evidence behavior remain intact.
- The M4 projection is additive: existing function nodes and `CALLS` edges remain canonical while `functionData` and `staticFlow` expose source-backed data semantics.
- Final standard `pnpm check` / PR CI and post-merge `master` CI are still required before the milestone can close.

Delta: Verification and integration only; no remaining approved M4 feature slice is intentionally deferred.

Next Move: Pass the standard PR gate, integrate PR #19, verify merged `master`, then record the M4 milestone gate.

## Scope Delivered

### M4.1 — Function Inputs & Outputs — IMPLEMENTED

- declared function parameters and type text where explicitly present;
- explicit return paths with repository-relative source evidence;
- supported call argument → callee parameter mappings;
- function inputs, outputs, and argument mappings exposed in the web inspector.

### M4.2 — Local Value Flow & Transformations — IMPLEMENTED

- supported local declarations and lexical binding writes;
- local reads connected to the latest earlier supported lexical write without pretending branch execution is known;
- source-backed transform/value-dependency steps;
- supported value flow through existing resolved function-call boundaries.

### M4.3 — Reads, Writes, Mutations & Relationship Lenses — IMPLEMENTED

- static relationship kinds include `READS`, `WRITES`, `MUTATES`, `FLOWS_TO`, `PASSES_ARGUMENT`, and `RETURNS_TO` in addition to the existing `CALLS` graph;
- each projected relationship retains evidence/provenance;
- the web relationship lens exposes only relationship kinds actually present in the current projection.

### M4.4 — Deterministic Static Step-through & Failure Paths — IMPLEMENTED

- deterministic ordered static-flow steps tied to repository-relative source;
- forward/reverse step controls synchronize the selected function while preserving the workspace;
- `if`/`switch` and `throw` paths are labeled as static possibilities;
- no runtime values, timing, frequency, probability, or selected branch outcome is fabricated.

## Boundaries Preserved

M4 does not add runtime execution/tracing, framework-specific persistence/event inference, Git-host auth/import, persistence, AI explanation, another language adapter, queues/workers, Redis, graph databases, or distributed architecture.

Static-flow evidence remains `verified-static` / `inferred-static` as appropriate; it is never relabeled as `observed-runtime`.

## Verification / Evidence

Evidence collected so far on PR #19:

- formatter output was generated with the repository's pinned Prettier and committed back to the branch;
- `analysis-core`, web, and API TypeScript builds passed during CI #90;
- existing web regression suite passed 10/10 during CI #90;
- the first M4 web test run exposed only test cleanup/query ambiguity, which was corrected without changing product behavior;
- temporary CI instrumentation has been removed and `.github/workflows/ci.yml` is again identical to `master` (`pnpm check`).

Still required before `RELEASE READY`:

1. standard PR `pnpm check` passes from the canonical workflow;
2. M4 API tests execute and pass, including deterministic output and the static-vs-runtime boundary;
3. M4 web inspector/lens/step-through tests pass;
4. PR #19 is squash-merged;
5. post-merge `master` CI passes.

## Risks / Blockers

No product/architecture blocker remains inside the approved M4 scope.

The remaining risk is verification correctness: static possibilities must not be presented as observed runtime truth. The milestone stays ACTIVE until final PR and post-merge gates pass.

## Next Action

Run the canonical PR gate for PR #19, fix any verified regression, integrate, verify `master`, close M4, then STOP.
