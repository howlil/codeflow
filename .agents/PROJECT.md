# CodeFlow Project

`PROJECT.md` is the canonical source of truth for CodeFlow product intent, observable behavior, scope, non-goals, product constraints, and deferred product work.

## Purpose

CodeFlow is an interactive program-understanding system for developers working with unfamiliar software repositories.

The product should let a developer move from a repository-level view toward architecture, execution flow, data/state movement, dependencies, and the source evidence that supports those relationships without first reconstructing the system manually from files.

CodeFlow is not primarily a diagram editor, documentation generator, or an LLM wrapper around repository chunks.

```text
repository semantic model = product truth
canvas = projection of that truth
AI = optional explanation over grounded evidence
```

## Intended User

A developer who needs to understand an unfamiliar or complex codebase quickly and wants system-level orientation before reading implementation details file by file.

## Core Product Behavior

### Committed

CodeFlow should:

- derive semantic entities and relationships from repository evidence;
- preserve provenance for relationships that may be verified, inferred, configured, observed at runtime, or user-asserted;
- render bounded semantic projections instead of exposing a raw AST or entire symbol graph by default;
- let users navigate from system meaning toward functions/source evidence;
- keep uncertainty visible rather than presenting inferred or missing information as fact;
- remain useful without AI explanation;
- keep static analysis useful without executing arbitrary repository code.

### Current Product Journey

```text
repository / fixture
 -> semantic analysis
 -> evidence-backed flow projection
 -> semantic workspace
 -> search/focus/navigation
 -> select node or relationship
 -> inspect source + provenance
```

## Current Milestone

M2 — Canvas Comprehension is the active committed milestone. Live execution state belongs only in `.agents/CURRENT_ITERATION.md`.

The committed M2 outcome is that a graph large enough to create clutter remains understandable without manual diagram editing.

M2 product capabilities are:

- focus/neighborhood mode;
- relationship filters/lenses when supported relationship kinds justify them;
- search/navigation;
- source split/snippet inspection;
- stable automatic layout;
- explicit loading/empty/partial/error states;
- keyboard-accessible primary interactions.

## Completed Product Foundations

### M0 — Executable Foundation

Established:

- pnpm workspace;
- `apps/web`;
- `apps/api`;
- `packages/analysis-core`;
- strict TypeScript;
- repository lint/typecheck/test/build gates;
- CI;
- executable web/API foundation.

### M1 — First Semantic Vertical Slice

Established one evidence-backed TypeScript flow from deterministic analysis through API projection to the web workspace and source/evidence inspection.

The product can distinguish verified and inferred semantic evidence in that flow.

## Deferred Product Work

The following direction is intentionally deferred until an explicit milestone makes it current scope.

### M3 — Data Flow & Static Simulation

Potential scope:

- parameters/returns;
- assignments/transforms;
- request payload through application values to persistence/event shape;
- read/write/mutation semantics;
- deterministic branch/failure metadata;
- step-through static simulation without fabricated runtime values.

### M4 — Go Adapter Proof

Goal: prove the semantic model is not accidentally TypeScript-shaped while preserving the same consumer model in API/UI.

### M5 — Multi-Application Repository View

Potential scope includes application discovery, cross-application relationships, System projection, grouping, repository scope selection, and abstraction-level navigation.

### M6 — Infrastructure Semantics

Add only infrastructure/configuration semantics justified by actual target repositories or fixtures.

### M7 — Grounded AI Explanation

AI explanation may use selected semantic context, graph paths, evidence, and minimal source snippets. AI must not become the source of canonical semantic edges, and CodeFlow must remain useful when AI is disabled.

### M8 — Runtime Evidence Spike

Validate whether runtime observations can map reliably to semantic IDs and how observed evidence coexists with static/inferred evidence before building a runtime subsystem.

## Product Constraints

- Evidence must precede explanation.
- Verified, inferred, configured, observed-runtime, and user-asserted evidence must remain distinguishable.
- The canvas is a semantic exploration surface, not the canonical model.
- Large repositories should use bounded projections, focus, and abstraction rather than rendering all symbols simultaneously.
- Static simulation and observed runtime traces must be visibly distinguishable.
- Runtime values or latency must not be fabricated from static analysis.
- Unsupported or partial analysis must remain explicit and useful where possible rather than being represented as fake completeness.

## Security and Privacy Expectations

Repository input is untrusted and may be confidential.

Committed expectations:

- ordinary static analysis does not execute arbitrary repository code;
- repository scope/path handling must prevent traversal or symlink escape when user-controlled repository input is supported;
- resource usage must be bounded as repository input expands;
- dependency/vendor/build directories should be ignored where appropriate;
- logs/errors/analytics/AI context must not expose arbitrary private source without explicit need;
- future runtime execution requires a separately approved sandbox design covering CPU, memory, filesystem, processes, network, timeout, and secret isolation.

## Non-Goals Unless Explicitly Activated

Do not treat these as current product scope merely because they appear in historical design material:

- universal language/framework coverage;
- production runtime tracing;
- collaborative diagram editing;
- graph database infrastructure;
- Redis/queue infrastructure;
- distributed analysis workers;
- repository-wide LLM ingestion;
- billing/subscriptions;
- organization/team permissions;
- production Kubernetes architecture;
- real-time collaborative cursors.

## Material Open Questions

No new material product decision is authorized by this document migration.

Future milestones may require explicit decisions about repository import/auth, durable persistence, runtime execution, AI/private-source handling, multi-user isolation, and production deployment. Those remain open until the user approves the relevant scope and boundary.
