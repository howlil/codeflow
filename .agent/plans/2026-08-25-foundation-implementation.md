# CodeFlow Foundation Implementation Plan

## Objective

Deliver the smallest end-to-end CodeFlow experience that proves the architecture instead of scaffolding the entire long-term platform.

The first proof must demonstrate:

```text
repository fixture
  -> discover source
  -> analyze semantic relationships
  -> universal IR + evidence
  -> derive one meaningful flow
  -> serve it through API
  -> render interactive canvas
  -> inspect supporting source/evidence
```

## Delivery Rule

Work vertically. Do not finish “all core”, then “all API”, then “all UI”. Each milestone should produce something a developer can run and verify.

Use one task branch/PR per coherent milestone. Keep review/CI fixes on the same branch.

## Milestone 0 — Repository Foundation

### Goal

Create the minimum executable monorepo and quality gates.

### Scope

- pnpm workspace
- `apps/web`
- `apps/api`
- `packages/analysis-core`
- `packages/contracts` only if a real shared contract appears during setup
- TypeScript strict configuration
- formatting/linting with the minimum dependency set
- unit test runner
- CI for typecheck/test/build
- tiny smoke route/page

### Do not add

- database
- auth
- queue
- Redis
- Docker orchestration beyond a simple local/release need
- component library
- global state library
- graph database
- AI SDK

### Exit evidence

```text
install
  -> typecheck
  -> test
  -> build web
  -> build api
```

all succeed in CI and locally.

## Milestone 1 — First Semantic Vertical Slice

### Goal

Analyze a tiny TypeScript fixture and render one useful flow on the canvas.

### Fixture

Create a deliberately small full-stack TypeScript fixture containing:

```text
React/TS UI action
  -> API client request
  -> backend endpoint
  -> handler/service function
  -> simple persistence boundary
```

The fixture is test data, not a second product application.

### Analysis-core tasks

Start with tests for the expected semantic output.

Implement only the IR concepts required by the fixture:

- repository/application/module/file
- function/method where needed
- endpoint
- persistence/storage entity if the fixture needs it
- relationships such as CONTAINS, DEFINES, CALLS, REQUESTS, HANDLES, READS/WRITES when proven
- evidence provenance with source locations

Use TypeScript compiler semantics where they materially improve symbol/reference resolution.

### Projection tasks

Create a deterministic flow projection from the fixture's entry point.

Expected shape:

```text
UI action
  -> HTTP request
  -> endpoint
  -> service
  -> persistence
```

Projection code must be independent of React.

### API tasks

Expose the smallest endpoint needed for the web client to obtain the analyzed summary/projection. Keep parser AST data private.

### Web tasks

Render the flow with `@xyflow/react`:

- pan/zoom
- automatic layout
- selectable semantic nodes
- labeled relationship edges
- basic fit-to-view

### Inspector tasks

Selecting a node should show:

- semantic kind/name
- relevant relationship summary
- evidence kind
- file/source range

No AI explanation yet.

### Exit evidence

A new developer can run CodeFlow, load the fixture, click the detected flow, see the canvas, select a node, and identify the source evidence that justifies it.

## Milestone 2 — Canvas Comprehension Features

### Goal

Make the graph useful beyond a demo without expanding language support yet.

### Scope

- focus/neighborhood mode
- relationship filters/lenses
- collapse/expand for groups where the fixture proves the need
- search/navigation to semantic entity
- source split view or source snippet inspection
- stable automatic layout
- empty/error/partial-analysis states
- monochrome design system polish
- keyboard accessibility for primary interactions

### Design constraint

Do not add freeform diagram editing. User repositioning may exist as view state, but semantic graph remains authoritative.

### Exit evidence

A graph with enough nodes to create clutter remains understandable using focus/filter/navigation without manual re-layout.

## Milestone 3 — Data Flow and Static Simulation

### Goal

Show how data shape/state moves through one supported flow.

### Analysis scope

Add only the data-flow concepts required by test fixtures:

- parameters/returns
- simple assignments/transforms
- request payload -> application value -> persistence/event shape
- read/write/mutation semantics
- branch/failure path metadata where deterministically available

### UI scope

- Data lens
- step-through static simulation
- visible distinction between verified and inferred relationships
- data shape summaries
- no fabricated runtime values

### Exit evidence

A user can step through a supported flow and explain how input data becomes persisted/output data, including which steps are inferred versus verified.

## Milestone 4 — Second Language Proof: Go

### Goal

Prove the core model is not accidentally TypeScript-specific.

### Scope

Implement a Go language adapter for a tiny backend fixture.

Start with:

- packages/files/functions/methods
- imports/calls where resolvable
- one HTTP framework adapter only if needed for the chosen fixture
- source evidence

Do not chase broad Go framework support.

### Architecture test

The existing canvas/projection/API must consume Go-derived IR without language-specific branches in UI components.

### Exit evidence

The same semantic projection contracts render both TypeScript and Go fixtures.

## Milestone 5 — Multi-Application Repository View

### Goal

Visualize a repository that contains frontend + backend + optional worker/infra boundaries.

### Scope

- application discovery
- cross-application request relationship
- System projection
- app/module grouping
- repository scope selection
- abstraction-level navigation

### Exit evidence

A user can start from repository overview, identify applications, then drill into one end-to-end flow crossing frontend/backend boundaries.

## Milestone 6 — Infrastructure Semantics

### Goal

Connect code to where it is built/run without becoming a cloud inventory platform.

### Initial adapters

Choose only manifests present in fixtures or real target repositories, such as:

- Dockerfile
- Compose
- GitHub Actions
- Terraform or Kubernetes later, not automatically both

### Exit evidence

System view can answer a narrow question such as “which application image/resource runs this backend and what does it connect to?” with configured evidence.

## Milestone 7 — AI Explanation Layer

### Goal

Add grounded explanation after deterministic navigation is already useful.

### Query pipeline

```text
selected entity / user question
  -> retrieve relevant graph path
  -> retrieve supporting evidence/source snippets
  -> LLM explanation
```

### Rules

- AI does not create canonical edges
- context is minimized
- uncertainty is reflected in prose
- private source handling is explicit
- model/provider integration stays behind one narrow application boundary

### Exit evidence

An explanation can cite the semantic path/source evidence used and remains useful when AI is disabled.

## Milestone 8 — Runtime Evidence Spike

### Goal

Validate whether runtime traces materially improve static understanding before building a runtime subsystem.

### Spike questions

- Can OpenTelemetry-style spans be mapped to existing semantic IDs reliably?
- What minimum instrumentation is needed for a representative fixture?
- How should runtime-observed edges coexist with static/inferred edges?
- What sensitive values must be excluded?

This milestone starts as a spike. Do not retain runtime infrastructure until the design is validated.

## Cross-Cutting Test Strategy

### Inner loop

Run the smallest fixture/unit tests affected by the change.

### Merge gates

By the time relevant packages exist, expect equivalent gates to:

```text
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Add browser/E2E gates when Milestone 1 introduces the meaningful canvas journey.

### Semantic regression discipline

Every newly supported relationship should have a minimal fixture proving:

- source input
- expected entities
- expected relationship
- evidence/provenance
- expected ambiguity when certainty is impossible

## Performance Gates

Do not set arbitrary large-scale targets before the vertical slice exists. Start recording:

- discovered files
- analyzed files
- parse/resolve duration
- entity/edge count
- projection size
- layout time

Optimize from measurements.

## Security Gates

Before analyzing user-controlled repository archives/paths beyond controlled fixtures:

- validate root/scope boundaries
- handle traversal and symlink escape
- add file count/size limits
- ignore vendor/build/dependency directories
- ensure analysis never executes repository code
- sanitize logs/errors

Before private GitHub integration, write a dedicated repository credential/data isolation design.

Before runtime execution, write a dedicated sandbox threat model/design. Static analysis work must not silently grow into code execution.

## UI Quality Bar

The canvas is successful when it reduces cognitive load, not when it displays maximum graph density.

For every UI change, evaluate:

- Can the user tell what level of abstraction they are viewing?
- Can they distinguish node/edge semantics without a rainbow palette?
- Can they focus on one flow/entity?
- Can they navigate back to source evidence?
- Are inferred/observed relationships clearly different?
- Does the graph remain readable at ordinary laptop sizes?

## Scope Control

When tempted to add another technology, first answer:

1. What current acceptance criterion cannot be met without it?
2. What measured bottleneck does it solve?
3. Can a local module or existing dependency solve the same problem?
4. What operational/testing cost does it add?

If those answers are weak, do not add it.

## Recommended Immediate Next Task

Implement **Milestone 0 only**, then begin Milestone 1 as a separate vertical feature.

Do not start Go, runtime tracing, AI, graph persistence, infrastructure adapters, or broad framework support before the first TypeScript end-to-end flow is trustworthy and interactive.
