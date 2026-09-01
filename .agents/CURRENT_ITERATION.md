# Current Iteration

Status: ACTIVE

Active Milestone: M3 — Real Repository Analysis

Last Completed: M2 — Canvas Comprehension (`RELEASE READY`)

Goal: Move CodeFlow from a sample-only semantic proof to an end-to-end workflow that analyzes a real TypeScript repository and opens the resulting evidence-backed projection in the existing semantic workspace.

Why: The largest current product gap was not richer semantics over the sample fixture; it was that a developer could not bring an actual repository into the product. M3 validates the current semantic model, API boundary, workspace, and evidence model before deeper data-flow semantics are added.

## Feature Compass

Shape:

```text
local repository selection
 -> bounded TypeScript source input
 -> cross-file semantic relationships + evidence
 -> bounded projection + analysis issues
 -> API
 -> existing semantic workspace
 -> search / focus / source / provenance inspection
```

Position:

- M0, M1, and M2 are integrated into `master`.
- Frontend/backend repo skills and vertical-delivery rules are integrated.
- D1 repository-input mode is resolved as local browser directory/file selection with bounded in-memory API analysis.
- M3.1–M3.4 runtime implementation is complete on PR #16 and PR CI run #82 passed the repository gate.

Delta: Integrate the verified M3 implementation, run the post-merge master gate, then close the milestone if acceptance remains satisfied.

Next Move: Merge PR #16 after its current documentation update passes CI, verify merged `master`, then record the M3 milestone gate.

## Scope

In scope:

- local browser directory/file selection as the M3 repository-input mode;
- bounded multi-file TypeScript repository input;
- deterministic cross-file analysis for the semantic capabilities CodeFlow already claims, starting with current function/call relationships;
- source/evidence provenance traceable to repository-relative source;
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
- remote repository authentication/import.

## Slices

### M3.1 — Repository Input Vertical Slice — IMPLEMENTED

A user can select a local repository directory, choose an entry source and exported function, send only the bounded supported TypeScript source set to the API, and receive a semantic projection in the current workspace.

```text
local repository input
 -> browser prefilter/bounds
 -> bounded API input
 -> analysis-core
 -> projection
 -> workspace
```

### M3.2 — Cross-File Semantics & Evidence — IMPLEMENTED

The TypeScript analyzer builds a multi-file in-memory program, resolves supported imported function calls across selected files/modules, preserves repository-relative source/evidence locations, and exposes all analyzed sources required by the inspector.

### M3.3 — Scope Safety & Partial Analysis UX — IMPLEMENTED

The API rejects unsafe repository paths and bounds request/file/count/total-source input. Dependency/build/VCS paths, unsupported source, invalid syntax, unresolved relative imports, and resource-limit omissions can remain explicit through analysis issues/partial state. The UI prefilters/bounds local input for UX/data minimization and renders API partial/error state without fabricating completeness.

### M3.4 — Real-Repository Acceptance & Sample Demotion — IMPLEMENTED

The web app now starts from local repository input rather than auto-loading the sample. A representative multi-file TypeScript case is covered end-to-end across web/API tests, while `/api/flows/sample` remains only as a deterministic fixture/demo path.

## Material Decision

### D1 — Repository Input Mode: RESOLVED

Approved and implemented:

- **Local directory/file selection in the browser** -> bounded supported TypeScript source set -> `POST /api/flows/analyze` -> request-scoped in-memory analysis.

This intentionally avoids Git hosting auth, server-side clone/process execution, persistence, and remote-network repository acquisition in M3. Durable rationale lives in `.agents/DECISIONS.md` D-009.

## Verification / Evidence

PR #16 implementation verification:

- standard `pnpm check` CI run #82 passed;
- formatting and lint passed;
- `analysis-core`, API, and web builds passed;
- web regression suite: 10/10 passed;
- API suite: 7/7 passed, including cross-file calls, partial unsupported input, resource bounds, unsafe path rejection, and missing entry-point handling.

Post-merge `master` verification is still required before the milestone gate can be marked `RELEASE READY`.

## Acceptance / Milestone Gate

M3 is release ready only when:

1. a developer can use the approved local input flow on a real multi-file TypeScript repository;
2. analysis produces a bounded semantic projection rather than exposing raw parser/AST structures;
3. supported cross-file call relationships and evidence/source provenance are correct for the tested repository input;
4. the web workspace consumes that projection and preserves the existing M2 comprehension interactions;
5. ignored, unsupported, partial, invalid, bounded, and failure cases are represented truthfully where applicable;
6. ordinary analysis does not execute repository code and approved resource/scope bounds are verified;
7. relevant API and web tests pass while analysis behavior is exercised through the API boundary;
8. `pnpm check` and required CI pass;
9. no unapproved persistence, auth, infrastructure, runtime, or semantic scope is introduced.

## Risks / Blockers

No product/architecture blocker remains inside the approved M3 scope.

Remaining gate work is integration verification: merge PR #16, verify the resulting master commit, then record the milestone as complete.

## Next Action

Integrate PR #16 after CI, verify merged `master`, then perform the M3 milestone gate and STOP.
