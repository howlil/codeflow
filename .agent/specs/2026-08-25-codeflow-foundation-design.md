# CodeFlow Foundation Design

## Status

Approved foundation for the initial implementation direction.

## Product Goal

CodeFlow should let a developer open an unfamiliar software repository and understand how the system works without first reconstructing the codebase mentally from files.

The core user journey is:

```text
repository
  -> choose scope/subdirectory
  -> analyze structure and semantics
  -> see system map
  -> choose a flow/entry point
  -> inspect execution/data/state relationships
  -> zoom toward modules/functions/source
  -> understand supporting evidence
```

The product must eventually support repositories that contain frontend, backend, workers, infrastructure, data pipelines, CLI applications, mobile code, ML code, and other software forms. That long-term breadth is achieved through a universal intermediate representation plus incremental adapters, not by trying to implement universal semantic analysis in the first milestone.

## Core Product Thesis

CodeFlow is not primarily documentation generation. It is an interactive program-understanding engine.

```text
IDE       -> what the code says locally
Debugger  -> what is happening in one runtime session
APM       -> what happened in deployed runtime
CodeFlow  -> how the whole software system fits and flows together
```

The strongest differentiator is progressive semantic navigation: system -> application -> module -> symbol -> control/data flow -> source evidence.

## Non-goals for the Foundation

The foundation does not attempt to deliver all of these immediately:

- every programming language
- every framework
- arbitrary code execution
- production runtime tracing
- collaborative whiteboarding
- diagram editing as a primary feature
- graph database infrastructure
- distributed analysis workers
- repository-wide LLM ingestion
- billing/subscription infrastructure
- organization/team permissions
- production Kubernetes deployment
- real-time collaborative cursors

The design must leave room for these where reasonable without paying their complexity cost now.

## Design Principles

### Evidence before explanation

Static semantic analysis and runtime evidence produce canonical facts. AI explains facts; it does not manufacture the canonical graph.

### Universal model, incremental implementation

Every adapter writes into the same semantic model. New languages/frameworks should extend coverage without forcing the UI and flow engine to understand parser-specific AST shapes.

### Meaning before files

A file tree is useful navigation, but users think in flows and responsibilities. The initial screen should prioritize detected applications, entry points, major dependencies, storage, events, and system boundaries.

### Progressive disclosure

The system should make a large repository understandable by hiding irrelevant detail until users ask for it.

### Truthful uncertainty

Dynamic languages, reflection, dependency injection, generated code, runtime configuration, and incomplete builds can prevent certainty. CodeFlow must expose the difference between verified, inferred, configured, and runtime-observed relationships.

### Pragmatic architecture

Start as a modular monolith with a web client and one API/analysis backend. Decompose only after measured bottlenecks or deployment constraints appear.

## High-Level Architecture

```text
Repository Input
  -> Project Discovery
  -> Language / Framework / Infra Detection
  -> Adapters
  -> Universal Semantic IR
  -> Call / Data / Dependency / State Graphs
  -> Derived Projections
  -> Canvas/API
  -> optional grounded AI explanation

Optional later:
Runtime instrumentation -> observed spans/events -> evidence merge
```

## Repository Shape

Keep the initial monorepo intentionally small:

```text
apps/
  web/
  api/
packages/
  analysis-core/
  contracts/   # only when genuinely shared
```

Prefer directories/modules inside `analysis-core` over creating packages for every concern.

## Technology Decisions

- TypeScript end-to-end initially.
- React + Vite + `@xyflow/react` for the interactive canvas.
- Fastify for the HTTP boundary.
- TypeScript compiler APIs for TS/JS semantics where useful.
- Tree-sitter as a pragmatic syntax baseline for other languages when stronger native tooling is not yet integrated.
- Established graph layout tooling before custom layout engines.
- In-memory/deterministic artifacts before graph databases.
- PostgreSQL only when durable product metadata is needed.
- No queue/Redis by default.

## Universal Semantic IR

The IR is the most important architectural boundary.

Entity concepts include repository, application, module, file, namespace/package, type/class/struct/interface, function/method, variable, endpoint, database/table/collection, queue/topic/event, external service, infrastructure resource, and runtime process/span.

Relationship concepts include `CONTAINS`, `DEFINES`, `IMPORTS`, `CALLS`, `RETURNS`, `READS`, `WRITES`, `MUTATES`, `IMPLEMENTS`, `EXTENDS`, `INJECTS`, `HANDLES`, `REQUESTS`, `RESPONDS`, `PUBLISHES`, `CONSUMES`, `DEPENDS_ON`, `DEPLOYS_TO`, `RUNS_ON`, and `CONNECTS_TO`.

Every uncertain relationship must preserve evidence provenance. Supported evidence classes are:

```text
verified-static
inferred-static
configured
observed-runtime
user-asserted
```

Parser-specific AST objects must not leak into the public IR/canvas contract.

## Adapter Model

Language adapters may implement parsing, symbol extraction, reference resolution, calls, types, control flow, data flow, and imports. Capabilities are optional; unsupported relationships should remain unknown rather than fabricated.

Framework adapters derive framework semantics such as routes, dependency injection, ORM relationships, component relationships, and event consumers.

Infrastructure adapters derive configuration/deployment semantics from Docker, Compose, Terraform, Kubernetes, CI, proxies, and cloud manifests as needed.

## Product Projections

The canonical graph may be larger than any useful screen. The product exposes bounded task-specific projections:

- System
- Flow
- Data
- Dependency
- Infrastructure
- Runtime

Projection generation must remain deterministic and independently testable from React.

## Entry Points

Supported entry-point concepts can include HTTP endpoints, UI actions, CLI commands, workers/jobs, event consumers, scheduled tasks, exported library functions, mobile actions, and pipeline stages. Each milestone implements only what its fixture/use case requires.

## Flow Semantics

CodeFlow distinguishes:

- **static flow** — derived from semantic relationships,
- **static simulation** — step-by-step presentation without executing code,
- **runtime trace** — observed execution evidence.

Never fabricate runtime values or latency from static analysis.

## Canvas UX

Desktop mental model:

```text
repository / flows | infinite semantic canvas | inspector / source
```

The canvas is a projection, not the source of truth. The UX should support semantic nodes/edges, focus mode, relationship lenses, semantic zoom, source evidence inspection, and fast navigation.

Target abstraction levels:

```text
L0 System/Ecosystem
L1 Applications/Services
L2 Modules/Features
L3 Types/Functions
L4 Control/Data Flow
L5 Source
```

## Visual Direction

Monochrome, compact, information-first, restrained glassmorphism. Use typography, spacing, line weight, shape, iconography, and opacity before saturated color. Maintain accessibility and non-color-only semantics.

## API Boundary

The initial API should expose semantic contracts rather than parser AST structures. Conceptual routes may include analysis creation/status, graph projection retrieval, and entity detail/evidence retrieval. Exact routes may evolve with implementation.

## Large Repository Strategy

Reduce complexity in this order:

1. ignore dependencies/generated/build outputs,
2. scope analysis,
3. incremental content-hash caches,
4. bounded projections,
5. lazy detail/source loading,
6. CPU isolation,
7. renderer virtualization,
8. only then consider distributed analysis/storage from measurements.

## Security and Privacy

Repository source is untrusted and may be confidential.

- Static analysis does not execute repository code.
- Bound file count/size/depth and handle traversal/symlink escape.
- Ignore vendor/build/dependency directories by default.
- Sanitize logs/errors and do not leak source/secrets.
- Minimize AI context.
- Any future code execution requires a dedicated sandbox design.

## Reliability and Observability

Prefer honest partial analysis over fake completeness. Surface unsupported/partial states explicitly.

Measure analysis duration by stage, files discovered/ignored/analyzed, parse/resolution failures, entity/relationship counts, projection size, layout duration, API latency/errors, and cache behavior when caching exists.

## Testing Strategy

Use tiny fixture repositories and small readable golden semantic fixtures. Protect semantic relationships, evidence provenance, API boundaries, UI projection behavior, and one end-to-end vertical flow.

First meaningful E2E:

```text
fixture repo
  -> analysis
  -> semantic IR
  -> flow projection
  -> API
  -> canvas nodes/edges
  -> inspector source/evidence
```

## Initial Vertical Slice

Recommended first slice:

```text
small TypeScript full-stack fixture
  React UI action
    -> HTTP request
    -> Fastify/Express-style endpoint
    -> service function
    -> simple persistence abstraction
```

The second adapter should preferably be Go to verify that the IR is actually language-agnostic.

## Rejected Foundation Alternatives

Rejected by default:

- LLM-first repository understanding,
- graph database from day one,
- microservice per analyzer/language,
- raw Canvas/WebGL renderer from day one,
- Tree-sitter as the only semantic strategy.

## Acceptance Criteria for the Foundation Architecture

The implementation is aligned when:

- parser/framework structures do not leak into canvas contracts,
- a universal entity/relationship/evidence model exists,
- verified and inferred relationships remain distinguishable,
- at least one fixture is analyzed end-to-end into a canvas flow,
- the canvas renders bounded semantic projections,
- selected nodes expose supporting source/evidence,
- adding another language is primarily an adapter/core-analysis task,
- AI is optional and outside the critical parsing path,
- graph DB, Redis, queues, microservices, and Kubernetes are unnecessary for the first vertical slice.

## Decision Summary

CodeFlow is a pragmatic TypeScript modular monolith centered on universal semantic IR and first-class evidence provenance. The product scales conceptually through adapters and projections, and visually through progressive disclosure, focus, lenses, and semantic zoom—not through premature infrastructure.
