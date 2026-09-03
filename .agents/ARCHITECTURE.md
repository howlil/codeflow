# CodeFlow Architecture

`ARCHITECTURE.md` is the canonical source of truth for where responsibilities live, how major boundaries interact, and which architectural invariants implementation must preserve.

## Current System Shape

CodeFlow is a small TypeScript monorepo.

```text
apps/
  web/            React/Vite user workspace + local repository selection
  api/            Fastify HTTP boundary, repository-input validation, orchestration
packages/
  analysis-core/  semantic model, TypeScript analysis, evidence, projections
```

The current repository contains exactly those two applications and the `analysis-core` package. Do not assume historical proposed directories/packages exist until code creates them.

## High-Level Flow

The current real-repository path is:

```text
local directory/file selection
 -> browser filters/bounds supported TypeScript source
 -> bounded POST /api/flows/analyze
 -> API validates paths + resource scope
 -> deterministic multi-file TypeScript analysis
 -> function/call semantic graph + evidence
 -> source-backed function data + static data-flow projection
 -> bounded projection + analysis issues
 -> web semantic workspace
 -> search/focus/navigation
 -> source/evidence + data-flow inspection
 -> relationship lenses / deterministic static step-through
```

`GET /api/flows/sample` remains a deterministic fixture/demo path; it is not the primary user-facing product path.

Future adapters and projections extend the semantic model rather than bypassing it.

## Core Boundary — Universal Semantic Model

The semantic model is the central architecture boundary.

Language/framework/infrastructure/runtime analysis must converge on stable semantic concepts rather than leaking parser-specific structures to consumers.

Representative semantic concepts include repositories, applications, files/modules, functions/types, endpoints, storage, events, external services, infrastructure resources, and runtime observations as support expands.

Representative relationship concepts include containment/definition/import, calls, reads/writes/mutation, implementation/inheritance, request/response, publish/consume, dependency, deployment, and connectivity.

Exact schema evolves with implemented requirements; consumers should not depend directly on parser AST objects.

## Evidence Boundary

Relationships that can be uncertain retain provenance.

Current evidence classes are:

```text
verified-static
inferred-static
configured
observed-runtime
user-asserted
```

Evidence should retain, when available:

- analyzer/config/runtime source;
- supporting repository-relative source location/range or runtime reference;
- concise rationale;
- semantic source/target identity.

Missing evidence must remain missing/partial rather than being silently relabeled as inferred evidence.

Heuristic confidence must not be presented as precise factual probability.

## Analysis Boundary

`packages/analysis-core` owns semantic analysis and model/projection behavior.

Current TypeScript analysis builds an in-memory multi-file TypeScript program from the bounded source set supplied by the API. It resolves supported function/call relationships across selected files/modules and can additionally project source-backed static data semantics for reachable functions, including:

- declared parameters and explicit return paths;
- supported caller argument -> callee parameter mappings;
- supported local declarations, lexical reads/writes, value dependencies, and transforms;
- explicit property/index mutation where source establishes it;
- conditional and throw possibilities required for deterministic static exploration.

The existing function/call graph remains intact. The current projection also exposes `functionData` and `staticFlow` rather than turning parser AST/control-flow objects into the cross-system contract.

A static-flow relationship may connect supported source-backed steps with verified or inferred-static evidence. Lexical value dependencies that cannot prove runtime branch selection remain inferred rather than being presented as executed facts.

Future language adapters should use the strongest practical semantic source available while emitting the shared semantic model/projection concepts. Adapter-specific compiler/parser objects must remain behind the analysis boundary.

An adapter may support only the capabilities it can establish honestly; unsupported semantics should not be fabricated for completeness.

## API Boundary

`apps/api` owns HTTP transport/orchestration and authoritative validation of user-controlled repository input.

The API consumes `analysis-core`; semantic analysis logic should not migrate into transport handlers merely for convenience.

Current repository analysis is `POST /api/flows/analyze`: it accepts a bounded set of repository-relative TypeScript source records plus an exported entry-point identity, rejects unsafe paths/invalid input, applies file/count/byte scope limits, and returns a semantic projection with explicit complete/partial analysis metadata.

The projection may include the existing function nodes/`CALLS` edges plus `functionData` and `staticFlow` data. The API exposes semantic/projection data rather than raw parser-specific AST structures.

The API does not clone repositories, authenticate to Git hosts, persist source/analyses, or execute repository code in the current architecture.

## Web Boundary

`apps/web` owns user-facing semantic workspace state, local repository selection, and interaction.

The browser filters the selected local directory to the supported bounded TypeScript source set before reading/sending source. These client checks improve UX and data minimization; they are not a security boundary and do not replace API validation.

The web application consumes semantic/API projections. It does not become a source parser, static-flow analyzer, or canonical semantic graph owner.

View state includes concerns such as:

- selected node/relationship;
- search/focus state;
- neighborhood presentation;
- inspector/source expansion;
- selected relationship lens;
- current static step-through position;
- layout coordinates and visual grouping.

Relationship-lens availability is derived from semantic kinds actually present in the projection. The UI must not fabricate an unavailable relationship category merely to provide a fixed filter set.

Static step-through is navigation over ordered source-backed projection steps. Advancing/reversing a step can synchronize semantic selection, but the web layer does not choose branch outcomes or calculate runtime values.

View state must not mutate semantic truth or evidence classification.

Durable interaction and visual behavior belongs in `.agents/DESIGN.md`.

## Production Deployment Topology

The production baseline is one Docker Compose stack that packages the existing web and API process boundaries without introducing a new product/service architecture.

```text
platform-managed public route
      |
      v
web container (Nginx 0.0.0.0:8080)
  - serves Vite static build
  - /api/* -> api:3001
  - /health -> api:3001/health
      |
      v
api container (Node/Fastify :3001, Compose network only)
      |
      v
analysis-core in the API process
```

The web container listens on and exposes container port `8080`, but the repository Compose file does not publish a host port. External host-port assignment and the public route are owned by the deployment platform; on MyPaaS the public service is `web` on container port `8080`. The API binds to `0.0.0.0:3001` inside the Compose network and is intentionally not exposed as a public service. `CODEFLOW_PORT` remains preserved in `.env.example` for deployment compatibility and should remain `8080` on MyPaaS.

This packaging keeps browser requests same-origin and avoids creating a separate public CORS/API surface. It does not change D-003: CodeFlow remains a modular monolith with two deployable process roles, not independently evolved microservices.

The Nginx request-body limit must stay at or above the API request limit so the reverse proxy does not reject requests that the authoritative API boundary would otherwise accept.

Production deployment verification must exercise the actual Compose path: configuration rendering, image builds, stack startup, and a health request through the web container to the internal API without requiring repository-owned host-port publishing.

## Static vs Runtime Boundary

Static analysis must remain useful without executing untrusted repository code.

Static flow/simulation and future runtime-observed execution are separate evidence domains.

Current static step-through represents source-backed parameters, value dependencies, calls, reads/writes/mutations, returns, branches, and failure possibilities. It does **not** claim:

- a concrete runtime value;
- which branch/return/failure path executed;
- execution frequency;
- latency/timing;
- probability/confidence of a path being taken.

Runtime observations may enrich projections later but must retain `observed-runtime` provenance rather than silently rewriting static evidence.

Any future repository execution requires an explicitly approved sandbox architecture before implementation.

## Data and Persistence

There is no current production persistence or graph database requirement in the implemented architecture.

Repository source and analysis are request-scoped/in-memory. The browser sends the selected bounded source set for analysis; CodeFlow does not persist repository source or analysis history as part of the current product path.

If durable SaaS metadata becomes necessary, persistence design is a new material decision. Historical preference is relational persistence such as PostgreSQL before graph-specific storage, but no persistence choice is activated merely by this document.

## Dependency and Infrastructure Boundaries

Current architecture does not require:

- Redis;
- a job queue;
- graph database;
- microservices;
- Kubernetes/service mesh;
- distributed coordination.

Docker Compose is the current production packaging baseline for the existing web/API roles. It does not authorize additional services or distributed ownership by itself.

These are not forbidden forever; introducing them requires a current requirement and, when they materially change architecture/infrastructure boundaries, explicit user approval.

## Security / Trust Boundary

Repository source is untrusted input and may be confidential.

Current repository input applies bounded file count, per-file bytes, total source bytes, supported extensions, ignored dependency/build/VCS directories, and repository-relative path validation. The server revalidates scope even when the browser prefilters input.

Architecture must preserve:

- no arbitrary repository code execution during ordinary static analysis;
- deliberate path/scope handling for user-controlled repository input;
- bounded resource usage as analysis scope expands;
- no raw private source in logs/analytics by default;
- minimal source/context sent to future AI explanation;
- a separately designed sandbox before runtime execution;
- no direct public exposure of the API in the default Compose deployment.

## Performance Direction

Do not solve hypothetical scale by changing the architecture first.

When measured pressure appears, prefer in order:

1. ignore irrelevant/generated/dependency input;
2. scope/bound projections;
3. incremental content-hash caching;
4. lazy source/detail loading;
5. CPU isolation for analysis work;
6. renderer specialization/virtualization;
7. only then evaluate distributed analysis/storage from evidence.

## Architecture Invariants

The following are material and should not change casually:

1. semantic relationships are grounded in evidence rather than generated prose;
2. parser/framework-specific structures do not become the cross-system contract;
3. canvas/view state is not canonical semantic state;
4. static and runtime evidence remain distinguishable;
5. API/web consume semantic projections rather than independently reconstructing source semantics;
6. ordinary static analysis does not execute arbitrary repository code;
7. static step-through never presents possible source paths as observed runtime execution;
8. architecture remains a modular monolith unless a measured current requirement justifies a material boundary change;
9. default production deployment exposes one public web origin through the deployment platform and keeps the API internal to the Compose network.

Material changes to these invariants, public contracts, data ownership, security/trust boundaries, persistence model, or runtime topology require explicit user approval.
