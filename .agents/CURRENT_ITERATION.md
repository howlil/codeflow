# Current Iteration

Status: ACTIVE

Active Milestone: M4 — Data Flow & Static Simulation

Last Completed: M3 — Real Repository Analysis (`RELEASE READY`)

Goal: Extend CodeFlow from function/call topology into evidence-backed TypeScript data movement and deterministic static step-through, while keeping static semantics clearly distinct from observed runtime behavior.

Why: M3 proved the real-repository path. The next product gap is understanding what data enters a function, how it is transformed and passed, what state it reads or mutates, what can be returned or fail, and how those facts connect back to source evidence.

## Feature Compass

Shape:

```text
bounded real TypeScript repository
 -> function inputs / outputs
 -> value assignments / transforms / call argument mapping
 -> read / write / mutation semantics
 -> branch / failure metadata
 -> bounded static-flow projection
 -> API
 -> semantic workspace + inspector
 -> deterministic static step-through
```

Position:

- M0 — Executable Foundation: integrated.
- M1 — First Semantic Vertical Slice: integrated.
- M2 — Canvas Comprehension: integrated.
- M3 — Real Repository Analysis: integrated and release ready.
- M4 is now the active milestone.

Delta: Deliver data-flow semantics vertically from `analysis-core` through projection/API to the existing workspace, then close the milestone only after representative real-repository acceptance and repository gates pass.

Next Move: Execute M4.1 — Function Inputs & Outputs as the first vertical slice.

## Scope

In scope:

- TypeScript-only static data-flow semantics over the bounded repository input established in M3;
- function parameters, call arguments, returns, and supported caller/callee value mapping;
- supported local declarations, assignments, property/value transforms, and deterministic value-flow relationships;
- explicit read, write, and mutation semantics where source evidence establishes them;
- deterministic branch and failure-path metadata needed for static step-through;
- bounded static-flow projection and API contract extensions;
- user-visible workspace/inspector presentation for every semantic capability introduced;
- meaningful relationship lenses/filters once multiple semantic relationship kinds exist;
- deterministic static step-through that shows source-backed possibilities rather than fabricated runtime values or execution timing;
- truthful unsupported/partial analysis behavior;
- focused analysis/API/web regression tests and the repository quality gate.

Out of scope unless separately authorized:

- runtime execution, tracing, concrete runtime values, latency, or probabilities;
- framework-specific database/event/message semantics that cannot be established from the current generic TypeScript semantic owner;
- Go or other language adapters;
- Git-host import/auth, durable persistence, saved analyses, accounts, or collaboration;
- queues, workers, Redis, graph databases, or distributed architecture;
- AI explanation.

## Slices

### M4.1 — Function Inputs & Outputs

Establish source-backed function data contracts through the complete product path:

```text
parameters + call arguments + returns
 -> semantic model / evidence
 -> projection + API
 -> workspace / inspector
 -> tests
```

Acceptance:

- selected functions expose supported parameters and return paths with source provenance;
- supported call arguments map to callee parameters deterministically;
- supported returned values remain traceable back toward the caller;
- UI does not invent input/output information absent from analysis truth.

### M4.2 — Local Value Flow & Transformations

Trace supported values through local declarations, assignments, aliases, property access, and deterministic transforms within/across already-supported function calls.

Acceptance:

- a user can follow a supported value path rather than only a call path;
- each flow step retains source evidence and semantic identity;
- unsupported expressions remain explicit instead of being guessed;
- backend semantics and UI representation ship in the same slice.

### M4.3 — Reads, Writes, Mutations & Relationship Lenses

Introduce evidence-backed side-effect semantics and make the richer relationship set usable in the workspace.

Acceptance:

- supported reads, writes, and mutations are distinguishable from `CALLS` and from one another;
- relationship evidence remains repository-relative and inspectable;
- relationship lenses/filters become available only for semantic kinds that actually exist in the projection;
- selection, search, focus, keyboard navigation, source inspection, and partial states remain coherent.

### M4.4 — Deterministic Static Step-through & Failure Paths

Project an ordered static explanation of supported flow from a selected entry point, including branch/failure possibilities where the source proves them.

Acceptance:

- users can advance/reverse through deterministic static-flow steps while retaining canvas/source context;
- branches/failure possibilities are labeled as static possibilities, not observed execution;
- no runtime values, timing, frequency, confidence percentages, or chosen branch outcomes are fabricated;
- a representative multi-file repository case proves M4.1–M4.4 end-to-end;
- required focused tests and `pnpm check`/CI pass.

## Material Decisions

No new infrastructure, persistence, runtime, or trust boundary is authorized by M4.

The exact additive semantic schema for value/data relationships is an implementation design decision inside the existing universal semantic model. It must preserve evidence provenance, deterministic identity, API/web projection ownership, and the static-vs-runtime boundary. Any change that would break those architecture invariants remains a stop condition requiring explicit approval.

## Verification / Evidence

Not yet implemented.

Milestone verification will require:

- focused deterministic analysis tests for each supported semantic relationship/path;
- API contract/error/partial-state regression coverage;
- web behavior tests for new inspection/lens/step-through interactions;
- preservation of M2/M3 navigation, source/evidence, and repository-input behavior;
- repository `pnpm check` and required CI on the integrated milestone head;
- post-merge `master` CI before marking M4 `RELEASE READY`.

## Risks / Blockers

Main risk: presenting static approximation as runtime truth. Every slice must preserve explicit evidence and unsupported/partial states and must not infer concrete execution outcomes that the source cannot establish.

No product/architecture blocker exists for beginning M4.1 within the scope above.

## Next Action

Implement M4.1 — Function Inputs & Outputs vertically and continue through the approved slices without introducing a separate backend-only or frontend-only delivery phase.
