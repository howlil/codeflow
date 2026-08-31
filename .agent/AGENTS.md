# AGENTS.md

## Project Mission

CodeFlow is an interactive program-understanding system. It turns a software repository into a navigable semantic map that helps a developer understand how the system works: architecture, execution flow, data flow, dependencies, state changes, failures, infrastructure, and eventually observed runtime behavior.

The product is not a diagram editor and not an LLM wrapper around repository chunks. The repository model is the source of truth; the canvas is a projection of that model; AI is an explanation layer over evidence.

## Product Principles

Preserve these principles unless a demonstrated requirement proves them insufficient:

1. **Evidence before explanation.** Deterministic analysis and runtime evidence come before LLM interpretation.
2. **Universal model, incremental adapters.** Support additional languages/frameworks through adapters into one semantic IR; never build a separate product architecture per language.
3. **Progressive disclosure.** A new user should see system-level meaning first and zoom toward modules, symbols, control flow, and source only when needed.
4. **Truthful uncertainty.** Distinguish statically verified, inferred, and runtime-observed relationships. Never present an inference as observed fact.
5. **Canvas is a view, not state.** Node coordinates and UI grouping must not become the canonical repository model.
6. **Pragmatic modular monolith first.** One deployable backend and one web application are the default. Do not introduce microservices, queues, graph databases, Kubernetes, or distributed coordination without measured need.
7. **Fast verified delivery.** Prefer small vertical slices with tests and observable acceptance criteria over broad framework scaffolding.

## Engineering Priority Order

When trade-offs conflict, optimize in this order:

1. Correctness of semantic relationships
2. Security and repository isolation
3. Truthful evidence/confidence representation
4. Data integrity and reproducibility
5. Maintainability
6. User comprehension and interaction quality
7. Observability
8. Performance
9. Extensibility

Do not sacrifice semantic correctness to make a graph look complete.

## Delivery Operating Model

Default loop:

```text
goal
  -> acceptance criteria
  -> smallest vertical slice
  -> RED
  -> GREEN
  -> REFACTOR
  -> focused verification
  -> PR / CI
  -> review and fixes on the same branch
  -> merge
  -> observe
```

Rules:

- Use TDD for behavior changes when an executable test seam exists.
- Reproducible bugs should leave regression tests.
- Prefer one coherent task, one branch, and one PR through review/CI feedback.
- Keep changes small enough to reason about, review, revert, and verify.
- Do not create architecture, wrappers, packages, or infrastructure solely for hypothetical future scale.
- Do not optimize commit count, branch count, lines changed, or PR count as productivity metrics.
- Do not split a vertical feature into artificial layer-by-layer PRs when one small coherent slice is safer.

## Architecture Invariants

### 1. Universal Semantic IR is the core boundary

All language, framework, infrastructure, and runtime adapters emit a shared semantic model. UI code must not parse source files directly. LLM code must not invent graph structure directly.

Canonical conceptual entities include:

```text
Repository
Application
Module
File
Namespace/Package
Type/Class/Struct/Interface
Function/Method
Variable/Value
Endpoint
Database/Table/Collection
Queue/Topic/Event
ExternalService
InfrastructureResource
RuntimeProcess/Span
```

Canonical conceptual relationships include:

```text
CONTAINS
DEFINES
IMPORTS
CALLS
RETURNS
READS
WRITES
MUTATES
IMPLEMENTS
EXTENDS
INJECTS
HANDLES
REQUESTS
RESPONDS
PUBLISHES
CONSUMES
DEPENDS_ON
DEPLOYS_TO
RUNS_ON
CONNECTS_TO
```

The actual schema may evolve, but additions must preserve stable identifiers, evidence provenance, and compatibility with existing graph consumers where practical.

### 2. Evidence is first-class

Every relationship that can be uncertain must carry provenance/confidence metadata sufficient to answer:

- Where did this edge come from?
- Was it parsed, resolved, inferred, configured, or observed at runtime?
- Which file/range/runtime span supports it?
- How confident are we?

Preferred evidence classes:

```text
verified-static   deterministic semantic resolution
inferred-static   heuristic/static inference
configured        explicit config/manifest evidence
observed-runtime  captured runtime evidence
user-asserted     explicit user annotation, kept separate from analyzer truth
```

Do not convert heuristic scores into false precision. Confidence is a communication aid, not fabricated probability.

### 3. Analysis pipeline stays deterministic where possible

Preferred pipeline:

```text
repository input
  -> project discovery
  -> language/framework/infra detection
  -> parsing
  -> symbol extraction
  -> reference resolution
  -> control/data/dependency extraction
  -> semantic IR
  -> derived graph projections
  -> optional runtime evidence merge
  -> optional AI explanation
  -> canvas/API consumers
```

An LLM may summarize or explain an already-grounded path. It must not be the primary parser, symbol resolver, or source of canonical edges.

### 4. Adapters are narrow plugins, not mini-platforms

A language adapter should implement only the capabilities the core needs, for example:

```text
parse
extractSymbols
resolveReferences
extractCalls
extractTypes
extractControlFlow
extractDataFlow
extractImports
```

Framework adapters add framework semantics such as HTTP routes, dependency-injection bindings, component boundaries, ORM relationships, or event wiring.

Infrastructure adapters add deployment/config semantics such as Docker, Compose, Terraform, Kubernetes, CI, reverse proxies, and cloud resources.

Do not require every adapter to implement every capability. Capability discovery is preferable to fake completeness.

### 5. Static and runtime models remain separable

Static analysis must be useful without executing untrusted repositories.

Runtime tracing is an optional enhancement. Runtime-observed paths may strengthen or override a view of execution, but they must retain their provenance rather than silently mutating static evidence.

Never execute arbitrary repository code as part of ordinary analysis without an explicit sandboxed execution design and user action.

## Initial Technology Direction

Use stable, boring tools with good ecosystem fit. Versions belong in package manifests, not this policy.

### Web

- React + TypeScript + Vite
- `@xyflow/react` for the interactive node canvas
- plain CSS/CSS modules or a small utility layer; avoid a large design-system dependency initially
- local component state first; add a dedicated state library only after state ownership becomes demonstrably painful

React Flow is selected because the product needs custom nodes, edges, pan/zoom, selection, grouping, minimap, and interaction primitives rather than low-level canvas rendering from scratch.

### Backend / analysis host

- Node.js + TypeScript
- Fastify for the HTTP boundary
- worker threads/process isolation for CPU-heavy parsing only when profiling shows event-loop pressure
- Tree-sitter as a pragmatic baseline parser where a stronger language-native semantic API is not yet integrated
- use language-native semantic tooling when it materially improves resolution accuracy (for example, TypeScript compiler APIs for TS/JS)

### Persistence

Start simple:

- PostgreSQL for SaaS product metadata only when durable multi-user/project metadata is introduced
- analysis artifacts/IR may initially be deterministic files or compact persisted blobs if that keeps the MVP simpler
- do **not** add Neo4j or another graph database by default; graph traversal can live in memory/application code until actual dataset/query pressure proves otherwise
- do **not** add Redis or a queue by default

### Package management / repository shape

Prefer pnpm workspaces with a small monorepo. Keep package count low. A reasonable starting shape is:

```text
apps/
  web/            React canvas UI
  api/            Fastify API + orchestration
packages/
  analysis-core/  semantic IR, graph derivation, analysis contracts/adapters
  contracts/      shared API schemas/types when sharing is genuinely useful
```

Do not split adapters, graph utilities, parsers, or every domain concept into separate packages until independent ownership/build boundaries justify it. Directories/modules inside `analysis-core` are cheaper than packages.

## UI / Canvas Product Contract

The canvas is the primary spatial workspace, supported by repository navigation and an inspector/source panel.

Default desktop composition:

```text
repository / flows | infinite semantic canvas | inspector / source
```

Core interaction principles:

- System meaning before file structure.
- Automatic layout must produce a readable default; users should not need to manually arrange generated graphs.
- Selecting a node reveals purpose, inputs/outputs, callers/callees, reads/writes, side effects, failures, evidence, and source location when known.
- Focus/neighborhood mode reduces unrelated graph noise.
- Users can filter relationship lenses: calls, data, state, events, dependencies, infrastructure, runtime.
- Entry points such as endpoints, CLI commands, UI actions, jobs, or consumers can drive trace views.
- The same IR can render different projections: System, Flow, Data, Dependency, Infrastructure, Runtime.
- Large repositories require abstraction levels and collapse/expand. Never render the entire symbol graph by default.

### Abstraction levels

Target mental model:

```text
L0 ecosystem/system
L1 applications/services
L2 modules/features
L3 types/functions
L4 control/data flow
L5 source
```

Exact level names may evolve, but progressive semantic zoom is a core product invariant.

### Simulation / trace UX

Static simulation means deterministic/inferred stepping through a derived flow; runtime trace means observed execution. The UI must label which one is being shown.

A trace may visualize:

- step order
- data shape/value transformations when safely available
- state reads/writes
- external calls
- events
- branch/failure paths
- optional observed latency when runtime evidence exists

Never fabricate runtime values or latency from static analysis.

## Visual Design Direction

CodeFlow uses a restrained monochrome AI-SaaS aesthetic:

- black/white/neutral gray palette
- minimal, high-contrast, information-first composition
- subtle glass surfaces only where they create hierarchy; no glassmorphism everywhere
- thin neutral borders and restrained blur
- generous negative space
- typography and alignment carry hierarchy more than decoration
- glow/shine is rare and reserved for selection, active trace, or focus state
- no rainbow graph by default; semantics should rely on labels, shape, line style, iconography, and contrast before color
- avoid giant gradients, decorative blobs, excessive shadows, and marketing-style visual noise inside the engineering workspace

### Suggested semantic styling

- solid edge: verified/static or explicit relationship
- dashed edge: inferred relationship
- animated/trace treatment: runtime-observed or active simulation path
- selected node: high-contrast outline plus subtle restrained shine
- external system: visually distinct boundary, not a saturated color
- database/event/API/function nodes may use different geometry/iconography while staying monochrome

Accessibility beats aesthetic purity. Maintain visible focus states, keyboard navigation for important actions, readable contrast, and non-color-only semantics.

## Architecture and Code Design Rules

Apply SOLID as a reasoning tool, not a mandate to create interfaces everywhere.

### SRP

A module should have one coherent reason to change. Parsing, semantic resolution, graph derivation, persistence, HTTP transport, and UI rendering are separate responsibilities.

### OCP

Language/framework support should usually extend through adapter registration rather than edits across the entire core. Do not build a generic plugin framework beyond the minimum registration/capability contract required.

### LSP / ISP

Prefer small capability interfaces. Do not force an adapter to implement fake methods for unsupported analysis features.

### DIP

Core semantic logic depends on narrow analyzer/evidence contracts, not Fastify, React, Tree-sitter node objects, or a specific database API.

### KISS

Prefer explicit functions, discriminated unions, plain data, and direct control flow. Avoid factories, DI containers, command buses, mediator frameworks, or meta-programming unless there is a concrete problem they solve.

### DRY

Remove duplicated knowledge, not merely repeated syntax. Two small explicit functions are often better than a premature generic abstraction.

### YAGNI

Do not build multi-language completeness, SaaS billing, collaboration, graph persistence infrastructure, runtime sandboxing, or production-scale distributed analysis before the current milestone requires them.

## Anti-Over-Engineering Rules

Do not add these by default:

- microservices
- Kafka/RabbitMQ/BullMQ
- Redis
- Neo4j/graph database
- Kubernetes/service mesh
- event sourcing/CQRS
- generic repository/service/controller layers for every feature
- dependency-injection frameworks
- a custom parser when reliable parser tooling exists
- WebGL renderer before DOM/SVG canvas performance is measured insufficient
- a custom graph layout engine before ELK/Dagre-like approaches are proven insufficient
- embeddings/vector DB for relationships that deterministic semantic analysis can represent directly
- LLM calls in the critical path of repository parsing

A small explicit module is preferable to an internal framework.

## Security Boundaries

Repository contents are untrusted input.

- Path traversal and symlink behavior must be handled deliberately.
- Never expose repository secrets in logs, analytics, traces, prompts, error messages, or client payloads without explicit need.
- Ignore common dependency/build directories by default and enforce resource limits.
- Do not execute repository code during static analysis.
- Any future runtime execution must use a separately designed sandbox with CPU, memory, filesystem, network, process, and timeout limits.
- Treat private repository source as confidential tenant data.
- LLM context must be minimized to the evidence needed for the answer; do not upload an entire private repository to a model by default.
- Log metadata, timings, counts, and sanitized identifiers rather than source contents.

## Performance Model

Optimize based on measurements.

Expected pressure points:

- parsing many files
- reference/symbol resolution
- derived graph size
- layout of large projections
- repeated analysis after small changes

Prefer these optimizations in order:

1. ignore irrelevant/generated/dependency directories
2. incremental/cached analysis keyed by content hash
3. bounded graph projections rather than whole-repository rendering
4. lazy inspector/source loading
5. background CPU isolation for parsing/resolution
6. renderer virtualization/WebGL only when measured necessary

Do not introduce distributed analysis solely because repositories can theoretically be large.

## Testing Strategy

Tests should protect semantic correctness and user-visible understanding.

### Analysis core

- small fixture repositories
- golden IR/graph fixtures where stable and readable
- symbol resolution tests
- call/data/control relationship tests
- unsupported/dynamic-language ambiguity tests
- evidence provenance tests
- deterministic graph ID tests

### API

- boundary validation
- repository/project isolation
- analysis lifecycle/error mapping
- contract tests for graph/projection payloads

### Web

- node/edge projection mapping
- filter/focus behavior
- inspector evidence rendering
- static-vs-runtime labeling
- keyboard/accessibility behavior where practical

### End-to-end

Prefer a tiny representative full-stack fixture before a huge external repository. Prove the vertical journey:

```text
fixture repo -> analyze -> semantic IR -> flow projection -> canvas -> inspect source/evidence
```

## Observability

At minimum, analysis operations should eventually expose structured metrics/logs for:

- repository/file counts and ignored counts
- parse success/failure by adapter
- analysis duration by stage
- graph node/edge counts by projection
- cache hit/miss
- layout duration
- API latency/error class
- model calls/tokens only when AI explanation is added, without source leakage

Observability must help diagnose correctness/performance, not become a distributed telemetry platform.

## AI Explanation Rules

AI is optional and layered over deterministic context.

Preferred query flow:

```text
user question / selected node
  -> graph/evidence retrieval
  -> minimal relevant source snippets
  -> grounded explanation
```

The explanation should identify uncertainty when the graph itself is uncertain. Never allow generated prose to write canonical graph edges without a separate explicit validation path.

## Git Workflow

The repository's current default branch is `master`; treat it as the integration branch unless it is intentionally renamed.

Normal lifecycle:

```text
master
  -> feat|fix|docs|chore/<task>
  -> work/test/review/fix on same branch
  -> one PR
  -> verify current head
  -> squash merge
  -> clean branch
```

- Do not perform normal feature work directly on the integration branch.
- Do not create `iteration-*`, `final-*`, `retry-*`, or review-fix branches for the same task.
- Failed tests and CI are feedback, not new task identity.
- Keep unrelated cleanup out of feature PRs.
- Prefer squash merge for a clean integration history.

## Agent Workspace

- `AGENTS.md` — repository-wide execution and architecture policy.
- `.agent/README.md` — how internal agent artifacts are organized.
- `.agent/specs/` — decision-oriented designs for material architectural work.
- `.agent/plans/` — executable implementation plans when sequencing matters.
- `.agent/checkpoints/` — concise evidence/status when useful.
- `plan.md` — short product/engineering roadmap and current milestone state.

Do not create planning artifacts as ceremony. A trivial low-risk change needs no heavyweight spec.

## Definition of Done

A change is not done merely because code exists. Depending on scope, completion requires:

- acceptance criteria satisfied
- relevant tests passing
- type/lint/build gates passing
- semantic evidence preserved correctly
- no known misleading UI state
- security/privacy implications considered for repository data
- documentation/spec updated when architecture or public behavior changed
- PR review/CI resolved on the same task branch

The core quality bar is simple: a developer should be able to trust what CodeFlow shows, understand why it shows it, and move from system-level meaning to supporting source evidence without the tool inventing certainty.