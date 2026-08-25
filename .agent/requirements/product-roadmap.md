# CodeFlow Product Requirements & Roadmap

This file preserves product scope, milestone intent, acceptance criteria, and explicit non-goals. It is **durable product context**, not a workflow checklist.

## Product Outcome

A developer can open an unfamiliar repository and understand architecture, execution flow, data/state movement, dependencies, and supporting source evidence through an interactive semantic map.

## M0 — Executable Foundation

Required:
- pnpm workspace
- `apps/web`
- `apps/api`
- `packages/analysis-core`
- strict TypeScript
- lint/typecheck/test/build
- CI
- tiny executable smoke route/page

Non-goals:
- database
- auth
- queue/Redis
- graph DB
- AI SDK
- large component/design framework

Acceptance:
- install succeeds
- lint/typecheck/test/build succeed
- API/web boot successfully

## M1 — First Semantic Vertical Slice

Goal: analyze one tiny full-stack TypeScript fixture and render one evidence-backed flow.

Required flow:

```text
React UI action
  -> HTTP request
  -> backend endpoint
  -> service function
  -> simple persistence boundary
```

Required semantics:
- minimal universal IR entities needed by the fixture
- deterministic relationships needed by the fixture
- evidence provenance + source location
- one deterministic flow projection
- smallest API contract needed by the UI
- interactive canvas rendering
- selectable node
- inspector showing semantic identity + source/evidence

Acceptance:
- a new developer can run CodeFlow locally
- load/analyze the fixture
- see the flow
- select a node
- identify evidence/source supporting it
- distinguish verified from inferred evidence

Explicit non-goals for M1:
- AI explanation
- auth
- production persistence
- graph DB
- queues/Redis
- runtime tracing
- multi-language breadth
- generic plugin framework

## M2 — Canvas Comprehension

Required when M1 proves the basic journey:
- focus/neighborhood mode
- relationship filters/lenses
- search/navigation
- source split/snippet inspection
- stable automatic layout
- empty/error/partial states
- keyboard-accessible primary interactions

Acceptance: a graph large enough to create clutter remains understandable without manual diagram editing.

## M3 — Data Flow & Static Simulation

Requirements:
- parameters/returns
- simple assignments/transforms
- request payload -> application value -> persistence/event shape
- read/write/mutation semantics
- branch/failure metadata where deterministic
- step-through static simulation
- explicit verified vs inferred distinction
- no fabricated runtime values

## M4 — Go Adapter Proof

Goal: prove universal IR is not TypeScript-shaped.

Requirements:
- packages/files/functions/methods
- imports/calls where resolvable
- one HTTP framework adapter only if fixture requires it
- source evidence
- existing API/projection/UI consumes Go-derived IR without language-specific UI branches

## M5 — Multi-Application Repository View

Requirements:
- application discovery
- cross-application request relationships
- System projection
- app/module grouping
- repository scope selection
- abstraction-level navigation

## M6 — Infrastructure Semantics

Add only manifests proven relevant by fixtures or target repositories, such as Dockerfile, Compose, GitHub Actions, Terraform, or Kubernetes.

Acceptance: CodeFlow can answer a narrow deployment/connectivity question with configured evidence.

## M7 — Grounded AI Explanation

Requirements:
- selected entity/question -> relevant graph path -> supporting evidence/source -> explanation
- AI never creates canonical edges
- minimal context
- uncertainty preserved
- private-source handling explicit
- CodeFlow remains useful with AI disabled

## M8 — Runtime Evidence Spike

Questions to validate before building a runtime subsystem:
- can traces map reliably to semantic IDs?
- what minimum instrumentation is needed?
- how do observed and static/inferred edges coexist?
- what sensitive values must be excluded?

## Cross-cutting Requirements

### Semantic correctness
Every newly supported relationship should have a small fixture proving source input, expected entities, expected relationships, provenance, and ambiguity behavior.

### Security
Before user-controlled repository input expands beyond controlled fixtures:
- validate root/scope boundaries
- prevent traversal/symlink escape
- bound file count/size/depth
- ignore dependency/vendor/build directories
- never execute analyzed repository code during static analysis
- sanitize logs/errors

### Performance
Measure before optimizing:
- discovered/analyzed files
- parse/resolve duration
- entity/edge count
- projection size
- layout duration

### UI quality
The canvas should reduce cognitive load. Users must be able to identify abstraction level, relationship semantics, focused context, and source evidence.

## Preservation Rule

Product requirements, product behavior, architecture decisions, user journeys, domain constraints, acceptance criteria, and explicit non-goals are durable knowledge. They may be updated, superseded, or reorganized, but must not be deleted merely because an execution workflow changes.
