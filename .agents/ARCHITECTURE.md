# CodeFlow Architecture

`ARCHITECTURE.md` is the canonical source of truth for where responsibilities live, how major boundaries interact, and which architectural invariants implementation must preserve.

## Current System Shape

CodeFlow is a small TypeScript monorepo.

```text
apps/
  web/            React/Vite user workspace
  api/            Fastify HTTP boundary and orchestration
packages/
  analysis-core/  semantic model, TypeScript analysis, evidence, projections
```

The current repository contains exactly those two applications and the `analysis-core` package. Do not assume historical proposed directories/packages exist until code creates them.

## High-Level Flow

The current architectural direction is:

```text
repository / fixture input
 -> deterministic analysis
 -> semantic entities + relationships + evidence
 -> bounded projection
 -> API boundary
 -> web semantic workspace
 -> source/evidence inspection
```

Future adapters and projections extend this model rather than bypassing it.

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
- supporting source location/range or runtime reference;
- concise rationale;
- semantic source/target identity.

Missing evidence must remain missing/partial rather than being silently relabeled as inferred evidence.

Heuristic confidence must not be presented as precise factual probability.

## Analysis Boundary

`packages/analysis-core` owns semantic analysis and model/projection behavior.

Current TypeScript analysis uses TypeScript semantic/compiler tooling. Future language adapters should use the strongest practical semantic source available while emitting the shared semantic model.

Adapter-specific parser objects must remain behind the analysis boundary.

An adapter may support only the capabilities it can establish honestly; unsupported semantics should not be fabricated for completeness.

## API Boundary

`apps/api` owns HTTP transport/orchestration.

The API consumes `analysis-core`; semantic analysis logic should not migrate into transport handlers merely for convenience.

HTTP contracts expose semantic/projection data rather than raw parser-specific AST structures.

Repository import/auth and durable analysis lifecycle APIs are not assumed to exist until explicitly implemented.

## Web Boundary

`apps/web` owns user-facing semantic workspace state and interaction.

The web application consumes semantic/API projections. It does not become a source parser or canonical semantic graph owner.

View state includes concerns such as:

- selected node/relationship;
- search/focus state;
- neighborhood presentation;
- inspector/source expansion;
- layout coordinates and visual grouping.

View state must not mutate semantic truth or evidence classification.

Durable interaction and visual behavior belongs in `.agents/DESIGN.md`.

## Static vs Runtime Boundary

Static analysis must remain useful without executing untrusted repository code.

Static flow/simulation and future runtime-observed execution are separate evidence domains.

Runtime observations may enrich projections but must retain `observed-runtime` provenance rather than silently rewriting static evidence.

Any future repository execution requires an explicitly approved sandbox architecture before implementation.

## Data and Persistence

There is no current production persistence or graph database requirement in the implemented architecture.

Semantic analysis may remain in-memory/deterministic for the current scope.

If durable SaaS metadata becomes necessary, persistence design is a new material decision. Historical preference is relational persistence such as PostgreSQL before graph-specific storage, but no persistence choice is activated merely by this document.

## Dependency and Infrastructure Boundaries

Current architecture does not require:

- Redis;
- a job queue;
- graph database;
- microservices;
- Kubernetes/service mesh;
- distributed coordination.

These are not forbidden forever; introducing them requires a current requirement and, when they materially change architecture/infrastructure boundaries, explicit user approval.

## Security / Trust Boundary

Repository source is untrusted input and may be confidential.

Architecture must preserve:

- no arbitrary repository code execution during ordinary static analysis;
- deliberate path/scope/symlink handling when repository input becomes user-controlled;
- bounded resource usage as analysis scope expands;
- no raw private source in logs/analytics by default;
- minimal source/context sent to future AI explanation;
- a separately designed sandbox before runtime execution.

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
7. architecture remains a modular monolith unless a measured current requirement justifies a material boundary change.

Material changes to these invariants, public contracts, data ownership, security/trust boundaries, persistence model, or runtime topology require explicit user approval.
