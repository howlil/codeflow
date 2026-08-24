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
                              |
                              v
                     Project Discovery
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
           Language         Framework        Infra
           Detection        Detection        Detection
              |               |               |
              v               v               v
        Language Adapters  Framework Adapters  Infra Adapters
              \               |               /
               +--------------+--------------+
                              |
                              v
                     Universal Semantic IR
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
         Call Graph        Data Flow      Dependency/State
             |                |                |
             +----------------+----------------+
                              |
                              v
                      Derived Projections
                              |
                +-------------+-------------+
                |                           |
                v                           v
           Canvas/API                 AI Explanation
                ^                           ^
                |                           |
                +---------- Evidence ------+

Optional later:
Runtime instrumentation -> observed spans/events -> evidence merge
```

## Repository Shape

Keep the initial monorepo intentionally small:

```text
apps/
  web/
    src/
      app/
      features/
      components/
      canvas/
      lib/

  api/
    src/
      http/
      analysis/
      repositories/
      app.ts
      server.ts

packages/
  analysis-core/
    src/
      model/
      discovery/
      adapters/
      graph/
      projections/
      evidence/
      fixtures/

  contracts/
    src/
```

Do not create one package per adapter or graph concern until there is a real independent ownership/build boundary. Prefer directories and modules inside `analysis-core`.

## Technology Decisions

### TypeScript end-to-end initially

Use TypeScript across web, API, and the first analysis adapters.

Reasons:

- shared type ecosystem reduces context switching in an early product
- strong fit for React canvas UI
- strong tooling access for TS/JS semantic analysis
- Node can orchestrate parser libraries and filesystem analysis effectively
- simpler deployment than introducing a second backend language before needed

This is not a declaration that every future analyzer must be implemented in TypeScript. Native helper processes are acceptable later when a language ecosystem gives materially better semantics.

### Web: React + Vite + @xyflow/react

React Flow provides the interaction primitives CodeFlow needs: nodes, edges, custom node components, selection, pan/zoom, grouping, minimap, and controls. Building the canvas interaction model from a raw HTML canvas/WebGL renderer would spend early engineering time on infrastructure rather than program understanding.

The renderer may evolve if measured graph scale exceeds what the chosen renderer handles comfortably.

### API: Fastify

Fastify gives a small, explicit HTTP boundary with mature TypeScript support and schema-oriented request handling. It should stay a transport layer; semantic analysis logic belongs in `analysis-core`.

### Parsing

Use the strongest practical semantic source per adapter:

- TS/JS: TypeScript compiler APIs for symbol/type/reference information where useful
- other languages: Tree-sitter is a pragmatic syntax baseline when language-native semantic tooling is not yet integrated
- framework semantics: explicit adapters on top of parsed/resolved code

Tree-sitter AST nodes must never leak into the universal IR public contract.

### Layout

Use an established layout library such as ELK or Dagre for automatic flow-oriented layout before considering a custom layout engine.

### Persistence

Do not add a graph database initially.

Initial analysis can be in-memory plus deterministic serialized artifacts as needed. When durable SaaS metadata becomes necessary, PostgreSQL is the default relational store. Graph traversal/query pressure must be measured before considering Neo4j or another graph-specific store.

### No queue/Redis by default

Analysis may initially execute within the backend process with concurrency/resource limits. Introduce background jobs only when real analysis duration, failure isolation, or user workflow requires asynchronous execution.

## Universal Semantic IR

The IR is the most important architectural boundary.

### Entity model

Initial conceptual union:

```text
Repository
Application
Module
File
Namespace
Package
Type
Class
Struct
Interface
Function
Method
Variable
Endpoint
Database
Table
Collection
Queue
Topic
Event
ExternalService
InfrastructureResource
RuntimeProcess
RuntimeSpan
```

Not every language maps naturally to every entity. The IR should represent semantic intent without forcing OOP terminology onto functional/procedural code.

### Base entity fields

Conceptually:

```text
id
kind
name
qualifiedName?
location?
parentId?
attributes
language?
framework?
```

IDs must be deterministic for the same analyzed revision when feasible so UI selection, caching, diffs, and evidence references remain stable.

### Relationship model

Conceptual relationship types:

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

Base relationship fields should include:

```text
id
kind
sourceId
targetId
attributes
evidence[]
```

### Evidence model

Evidence must support provenance:

```text
kind:
  verified-static
  inferred-static
  configured
  observed-runtime
  user-asserted

source:
  adapter/parser/config/runtime

location:
  file + range when available

reason:
  concise machine/human-readable rationale

confidence:
  optional coarse score/category for heuristics
```

Do not present heuristic confidence as scientific probability.

## Adapter Model

### Language adapter responsibilities

A language adapter may expose capabilities such as:

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

Capabilities are optional. An adapter reports what it can do instead of emitting fake relationships.

### Framework adapter responsibilities

Framework adapters derive semantics from code/config, for example:

- React component relationships and API-client usage
- Express/Fastify/Nest routes
- Spring controllers and DI bindings
- Django/FastAPI routes
- ORM model/table relationships
- message/event consumers

Framework adapters depend on universal semantic inputs and adapter-specific analysis helpers, not on UI concerns.

### Infrastructure adapter responsibilities

Infrastructure adapters derive configuration/deployment edges from:

- Dockerfile
- Compose
- Terraform
- Kubernetes manifests
- CI workflows
- reverse proxy config
- cloud-specific manifests

The goal is to eventually answer both “how does this code execute?” and “where does this component run/connect?”.

## Derived Graphs and Projections

The canonical graph may contain more information than any single UI should show. Projections transform IR into task-specific views.

### System projection

Shows applications/services, databases, events, external systems, and deployment boundaries.

### Flow projection

Starts from an entry point and follows meaningful execution edges such as UI action -> request -> handler -> business logic -> persistence/event.

### Data projection

Shows how data shape/state moves and transforms between inputs, domain values, storage, and emitted outputs/events.

### Dependency projection

Shows dependency direction around a selected module/symbol.

### Infrastructure projection

Shows build/deployment/runtime resources and connections.

### Runtime projection

Later overlays observed spans, latency, and concrete path evidence.

Projection generation should be deterministic and testable without React.

## Entry Points

A flow needs a starting point. Entry point kinds can include:

```text
HTTP endpoint
UI action/component event
CLI command
worker/job
message/event consumer
scheduled task
function exported as library API
mobile screen action
pipeline stage
```

The first milestone should support only the entry points required by its chosen fixture/repository type.

## Data Flow and Simulation

CodeFlow should distinguish three related concepts.

### Static flow

Derived from static semantic relationships.

### Static simulation

A step-by-step presentation of a derived path. This does not execute repository code and must not invent concrete runtime values.

Example:

```text
CreateOrderRequest
  -> validation
  -> OrderInput
  -> domain Order
  -> persistence write
  -> OrderCreated event
```

### Runtime trace

Observed execution from instrumentation. This may contain actual values only when explicitly safe and allowed, plus timing/span information.

The UI must make static/inferred/observed status visible.

## Programming Paradigm Analysis

CodeFlow may eventually describe style such as OOP, functional, procedural, event-driven, or declarative, but should not force a repository into one label.

Prefer evidence-backed profiles such as:

```text
OOP traits: classes/interfaces/polymorphic dependencies
Functional traits: pure transformations/composition/immutability patterns
Procedural traits: direct statement-oriented orchestration
Event-driven traits: publish/consume topology
Declarative traits: manifest/query/config-driven behavior
```

Any scoring is heuristic and must be labeled as such.

## Canvas UX

### Primary layout

Desktop default:

```text
+----------------+-----------------------------------------+----------------------+
| Repository /   |                                         | Inspector / Source   |
| Flows          |            Infinite Canvas              |                      |
|                |                                         | selected semantics   |
+----------------+-----------------------------------------+----------------------+
```

Responsive layouts may collapse side panels, but the canvas remains the main spatial interaction surface.

### Canvas is not a diagram editor

Graph coordinates are view state. Users may rearrange nodes for local comprehension, but manual positions must not replace semantic relationships as product truth.

### Semantic node types

Use monochrome shapes/icons/labels before saturated colors to communicate node type. Candidate categories:

- application/service
- module
- function/method
- endpoint
- database/storage
- event/queue
- external service
- infrastructure resource

### Semantic edge types

Use line style and labels:

```text
solid    verified/static/configured
 dashed  inferred
active animated emphasis  simulation/runtime trace
```

Actual runtime evidence should remain distinguishable from static simulation.

### Focus mode

Selecting a node can reduce unrelated context. Support a neighborhood depth model such as 1 hop / 2 hops / 3 hops / all where useful.

### Relationship filters

Allow users to choose lenses rather than rendering everything simultaneously:

```text
Calls
Data
State
Events
Dependencies
Infrastructure
Runtime
```

### Semantic zoom / abstraction levels

Target model:

```text
L0 System/Ecosystem
L1 Applications/Services
L2 Modules/Features
L3 Types/Functions
L4 Control/Data Flow
L5 Source
```

Zoom level alone should not blindly control abstraction. Semantic zoom can combine camera scale, explicit drill-down, and selected context so the user stays oriented.

### Inspector

For a selected node, show available evidence such as:

```text
purpose
kind
inputs/outputs
callers/callees
reads/writes
side effects
published/consumed events
failure paths
source location
relationship provenance
confidence/uncertainty
```

Purpose text can initially be deterministic metadata and later be AI-assisted.

### Source split mode

A user should eventually be able to open source alongside the canvas. Selecting a graph edge should reveal supporting source ranges where evidence exists; selecting a relevant source symbol should highlight its canvas relationships.

### Search and navigation

Support fast symbol/flow navigation similar to an IDE command palette. A search result should pan/focus the relevant node rather than simply opening a text result page.

## Visual Design System

The product workspace should look premium without competing with the information.

### Direction

Monochrome, black/white, minimal AI-SaaS, restrained glassmorphism.

### Rules

- black/near-black and white/near-white surfaces depending on theme
- neutral gray hierarchy
- thin borders
- subtle transparency/blur only for panels that spatially float over the canvas
- minimal shadows
- selection may use restrained glow/shine
- no rainbow semantic palette by default
- no decorative gradient blobs in the workspace
- no oversized marketing typography inside the engineering canvas
- avoid nested card-on-card-on-card layouts
- keep graph node visual language compact and information-dense

### Hierarchy

Use typography, spacing, line weight, opacity, shape, and grouping before color.

### Accessibility

- keyboard reachable primary controls
- visible focus states
- sufficient contrast
- touch targets appropriate on mobile/tablet surfaces
- relationship semantics must not depend only on color
- reduced-motion behavior for animated traces

## API Boundary

The first API can stay narrow:

```text
POST /analyses            create analysis from a supported local/imported repository source
GET  /analyses/:id        status/summary
GET  /analyses/:id/graph  projection by lens/scope/entry point
GET  /analyses/:id/entity/:entityId
```

Exact routes may change during implementation. The important rule is that HTTP schemas expose semantic contracts, not parser-specific AST structures.

Repository import/auth flows should be designed separately when private Git hosting integration is implemented.

## Analysis Lifecycle

Conceptual states:

```text
queued?       only if async jobs become necessary
scanning
parsing
resolving
projecting
ready
failed
```

The initial synchronous implementation can collapse states internally while keeping a clean domain model.

Partial adapter failure should be represented honestly. One unsupported file should not necessarily invalidate an entire repository analysis if useful partial results exist.

## Large Repository Strategy

Do not solve hypothetical scale with distributed infrastructure first.

Apply complexity reduction in this order:

1. ignore dependencies/generated/build outputs
2. scope analysis to selected directory/application
3. incremental content-hash caches
4. bounded projections around entry points/selections
5. lazy source/detail loading
6. CPU isolation/worker threads
7. renderer virtualization
8. only then evaluate separate analysis workers/storage architecture from measurements

The canvas should almost never render every symbol from a large repository simultaneously.

## Security and Privacy

Repository source is untrusted and may be confidential.

### Static analysis default

- read source/config only
- no arbitrary code execution
- bounded file size/count/depth
- ignore dependency/build/vendor directories by default
- defend against traversal/symlink escape
- sanitize parse errors/logs

### Secrets

Avoid sending arbitrary source to logs, analytics, or AI providers. Detecting secrets is not a license to collect them.

### AI

When AI explanation is implemented, retrieve the smallest supporting graph path and source snippets required. Private repository source must not be sent wholesale by default.

### Future execution

Runtime execution requires a dedicated sandbox design before implementation. The sandbox must address CPU, memory, process count, filesystem, network egress, timeout, and secret isolation.

## Reliability and Failure Semantics

Analysis errors should identify stage and adapter when possible without leaking sensitive source.

Examples:

```text
UNSUPPORTED_LANGUAGE
PARSE_PARTIAL
RESOLUTION_PARTIAL
INVALID_REPOSITORY_SCOPE
RESOURCE_LIMIT
ANALYSIS_FAILED
```

A partially useful analysis is preferable to a fake complete graph, but the UI must surface limitations.

## Observability

Keep observability local and actionable initially.

Measure:

- analysis duration by stage
- files discovered/ignored/analyzed
- parse/resolution failures by adapter
- entity/relationship counts
- projection size
- layout duration
- API errors/latency
- cache hit/miss when caching exists

Do not log raw repository contents.

## Testing Strategy

### Unit/fixture tests

Use tiny fixture repositories designed to prove one semantic behavior clearly.

Examples:

- function A calls B
- endpoint maps to handler
- handler writes a storage entity
- event publish/consume relationship
- dynamic call remains inferred/unknown rather than falsely verified

### Golden semantic fixtures

For stable IR/projection behavior, readable golden JSON fixtures can provide strong regression value. Keep them small and reviewable.

### API tests

Validate request boundaries, analysis state, projection schemas, and error mapping.

### UI tests

Protect graph projection mapping, filters, focus behavior, inspector evidence, semantic labels, and static-vs-runtime truthfulness.

### End-to-end vertical fixture

The first meaningful E2E should prove:

```text
fixture repo
  -> analysis
  -> semantic IR
  -> flow projection
  -> API
  -> canvas nodes/edges
  -> inspector source/evidence
```

## Initial Vertical Slice Recommendation

Do not begin with “support every language”. Begin with one high-confidence full vertical slice.

Recommended first slice:

```text
small TypeScript full-stack fixture
  React UI action
    -> HTTP request
    -> Fastify/Express-style endpoint
    -> service function
    -> simple persistence abstraction
```

Why TS/JS first:

- one implementation language across the initial product
- TypeScript semantic APIs can provide strong symbol information
- frontend + backend in one fixture proves cross-application visualization
- validates the universal IR before adding a second language

The second adapter should preferably be Go because it tests whether the IR really is language-agnostic rather than accidentally TypeScript-shaped.

## Rejected Foundation Alternatives

### LLM-first repository understanding

Rejected because it produces explanations without stable identity, deterministic calls/data relationships, or trustworthy provenance.

### Graph database from day one

Rejected because graph storage is not yet the bottleneck. It adds operations/query complexity before real workload exists.

### Microservice per analyzer/language

Rejected because adapters do not initially need independent deployment. A modular monolith provides faster iteration and simpler debugging.

### Raw canvas/WebGL renderer from day one

Rejected because the product risk is semantic understanding and interaction design, not low-level rendering. Use a mature node UI library until profiling proves otherwise.

### Universal Tree-sitter-only semantics

Rejected as the only semantic strategy. Tree-sitter is excellent syntax infrastructure, but stronger language-native tools should be used where they materially improve symbol/type/reference resolution.

## Acceptance Criteria for the Foundation Architecture

The implementation is aligned with this design when:

- parser/framework-specific structures cannot leak directly into canvas contracts
- a stable universal entity/relationship/evidence model exists
- static verified and inferred relationships are distinguishable
- at least one fixture is analyzed end-to-end into a canvas flow
- the canvas renders a bounded semantic projection rather than an entire raw AST/file graph
- selected nodes can expose supporting source/evidence
- adding the next language is primarily an adapter/core-analysis task, not a rewrite of UI architecture
- AI is optional and absent from the critical parsing path
- no graph DB, Redis, queue, microservices, or Kubernetes are required for the first vertical slice

## Decision Summary

CodeFlow will be built as a pragmatic TypeScript modular monolith with React/Vite + `@xyflow/react` for the interactive canvas, Fastify for the HTTP boundary, and a framework-independent `analysis-core` centered on a universal semantic IR and first-class evidence provenance.

The product scales conceptually through adapters and projections, not through premature infrastructure. It scales visually through progressive disclosure, focus, lenses, and semantic zoom, not by rendering every relationship at once.
