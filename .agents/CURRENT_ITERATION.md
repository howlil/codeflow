# Current Iteration

Status: ACTIVE

Active Milestone: M3 — Real Repository Analysis

Last Completed: M2 — Canvas Comprehension (`RELEASE READY`)

Goal: Move CodeFlow from a sample-only semantic proof to an end-to-end workflow that analyzes a real TypeScript repository and opens the resulting evidence-backed projection in the existing semantic workspace.

Why: The largest current product gap is not richer semantics over the sample fixture; it is that a developer still cannot bring an actual repository into the product. Real repository analysis should validate the current semantic model, API boundary, workspace, and evidence model before deeper data-flow semantics are added.

## Feature Compass

Shape:

```text
repository input
 -> bounded TypeScript repository analysis
 -> cross-file semantic relationships + evidence
 -> bounded projection
 -> API
 -> existing semantic workspace
 -> search / focus / source / provenance inspection
```

Position:

- M0, M1, and M2 are integrated into `master`.
- Frontend/backend repo skills and vertical-delivery rules are integrated.
- Current production path still exposes the sample flow rather than user-provided repository analysis.

Delta: Replace the sample-only product path with one real-repository vertical path while preserving the existing modular-monolith, semantic-model, evidence, and workspace boundaries.

Next Move: Resolve the repository-input boundary, then execute M3 slices continuously.

## Scope

In scope:

- one explicitly approved user-facing repository-input mode;
- bounded multi-file TypeScript repository input;
- deterministic cross-file analysis for the semantic capabilities CodeFlow already claims, starting with current function/call relationships;
- source/evidence provenance that remains traceable to repository-relative source;
- API/projection behavior required to deliver the capability to the web workspace;
- reuse of M2 search, focus, selection, source inspection, evidence inspection, keyboard navigation, and explicit analysis states;
- truthful ignored/unsupported/partial/error behavior;
- resource and repository-scope bounds appropriate to untrusted input;
- focused semantic/API/web regression tests and the repository quality gate.

Out of scope unless separately authorized:

- data-flow/read/write/mutation semantics;
- Go or other language adapters;
- durable persistence, accounts, repository history, or saved analyses;
- queues, distributed workers, graph databases, Redis, or microservices;
- runtime execution/tracing;
- AI explanation;
- remote repository authentication/integration unless it is the explicitly approved M3 input mode.

## Slices

### M3.1 — Repository Input Vertical Slice

Outcome: A user can initiate analysis of a real repository through the approved input boundary and see an evidence-backed projection in the current workspace.

Required path:

```text
user repository input
 -> bounded API input
 -> analysis-core
 -> projection
 -> workspace
```

Do not implement the observable input contract until the material input-mode decision below is approved.

### M3.2 — Cross-File Semantics & Evidence

Outcome: Existing supported TypeScript call semantics work across repository files/modules rather than only inside the current sample source, with deterministic identity and repository-relative source/evidence locations.

UI inspection must expose the same grounded source/provenance rather than inventing missing relationships.

### M3.3 — Scope Safety & Partial Analysis UX

Outcome: Real repository input remains bounded and useful when parts of a repository are ignored, unsupported, invalid, or too large.

Backend must enforce the approved scope/resource policy; UI must surface partial/unsupported/error state truthfully in the same slice.

### M3.4 — Real-Repository Acceptance & Sample Demotion

Outcome: A representative multi-file repository case proves the end-to-end product path, regression coverage protects it, and the sample flow is no longer the primary user-facing path while remaining only where it still has clear fixture/demo value.

## Material Decision Gate

### D1 — Repository Input Mode: OPEN

This changes product behavior plus API/security boundaries and requires explicit user approval before M3.1 locks the contract.

Preferred minimal option:

- **Local directory/file selection in the browser** -> send a bounded supported file set to the API for in-memory analysis. This avoids Git hosting auth, server-side clone/process execution, and persistence in M3.

Alternative:

- **Public Git repository URL** -> backend fetch/clone/import. This adds network/remote-host input behavior and a larger trust/resource boundary; private repository auth would remain a separate decision.

No repository input mode is authorized merely by this milestone plan.

## Acceptance / Milestone Gate

M3 is release ready only when:

1. a developer can use the approved input flow on a real multi-file TypeScript repository;
2. analysis produces a bounded semantic projection rather than exposing raw parser/AST structures;
3. supported cross-file call relationships and evidence/source provenance are correct and deterministic for the tested revision;
4. the web workspace consumes that projection and preserves the existing M2 comprehension interactions;
5. ignored, unsupported, partial, invalid, and failure cases are represented truthfully where applicable;
6. ordinary analysis does not execute repository code and approved resource/scope bounds are verified;
7. relevant analysis-core, API, and web tests pass;
8. `pnpm check` and required CI pass;
9. no unapproved persistence, auth, infrastructure, runtime, or semantic scope is introduced.

## Risks / Blockers

- D1 repository-input mode is the only current material blocker to implementing M3.1.
- Multi-file analysis may expose pressure in semantic IDs or the duplicated web/API projection types; fix only what M3 correctness requires rather than broad contract rearchitecture.
- Large-repository performance must be bounded first, not solved preemptively with distributed infrastructure.

## Next Action

Approve D1 repository-input mode, then execute M3.1 as the first vertical slice.
