# CodeFlow Project Truth

This file is the concise durable project-context entry point for agents. It describes what CodeFlow is and the product/system invariants that implementation must preserve.

Detailed milestone requirements live in `.agent/requirements/product-roadmap.md`.
Material foundation architecture lives in `.agent/specs/2026-08-25-codeflow-foundation-design.md`.
Durable visual/interaction language lives in root `DESIGN.md`.

## Mission

CodeFlow is an interactive program-understanding system. It turns a software repository into a navigable semantic map that helps developers understand architecture, execution flow, data/state movement, dependencies, failures, infrastructure, and supporting source evidence.

The product is not a diagram editor and not an LLM wrapper around repository chunks.

```text
repository model = canonical truth
canvas = projection of that model
AI = optional grounded explanation layer
```

## Product principles

1. **Evidence before explanation.** Deterministic/static/configured/runtime evidence precedes LLM interpretation.
2. **Universal model, incremental adapters.** Language/framework/infra/runtime adapters emit into one shared semantic IR rather than separate architectures.
3. **Truthful uncertainty.** Verified, inferred, configured, runtime-observed, and user-asserted evidence remain distinguishable.
4. **Canvas is a view, not canonical state.** Layout/grouping does not define repository truth.
5. **Progressive semantic disclosure.** Show system meaning first, then modules, symbols, control/data flow, and source evidence as needed.
6. **Static analysis must be useful without executing untrusted repository code.** Runtime execution is a separate explicitly designed capability.
7. **Pragmatic modular monolith first.** Do not introduce distributed architecture without measured current need and authorized scope.
8. **Fast verified delivery.** Prefer coherent vertical slices and deterministic evidence over broad scaffolding.

## Core architecture invariants

### Universal semantic IR

All analyzers/adapters converge on one semantic model. UI code does not parse source directly. LLM code does not invent canonical graph structure.

Representative entities include repositories, applications, modules/files, functions/types, endpoints, data stores, events/queues, external services, infrastructure resources, and runtime observations.

Representative relationships include containment, definition/import, calls, reads/writes/mutation, inheritance/implementation, request/response, publish/consume, dependency, deployment, and runtime connectivity.

Schema evolution must preserve stable identity, evidence provenance, and consumer compatibility where practical.

### Evidence is first-class

Uncertain relationships retain provenance sufficient to answer:

- where did this relationship come from;
- was it parsed/resolved/inferred/configured/runtime-observed/user-asserted;
- which file/range/runtime evidence supports it;
- what uncertainty remains.

Preferred evidence classes:

```text
verified-static
inferred-static
configured
observed-runtime
user-asserted
```

Never convert heuristic confidence into false factual certainty.

### Deterministic analysis first

Preferred conceptual flow:

```text
repository input
 -> project discovery
 -> language/framework/infra detection
 -> parsing
 -> symbol extraction
 -> reference resolution
 -> control/data/dependency extraction
 -> semantic IR
 -> graph projections
 -> optional runtime evidence merge
 -> optional grounded AI explanation
 -> API/canvas consumers
```

AI may explain grounded evidence. It is not the primary parser, symbol resolver, or canonical edge generator.

### Narrow adapters

Adapters implement only the capabilities needed by the core. Capability discovery is preferable to fake completeness.

Framework adapters add framework semantics; infrastructure adapters add manifest/deployment semantics. Do not turn adapters into independent mini-platforms.

### Static and runtime evidence stay separable

Runtime observations may enrich understanding but retain provenance. Runtime evidence must not silently rewrite static evidence into a different truth class.

Ordinary repository analysis must not execute arbitrary repository code.

## Current architecture direction

CodeFlow is a small TypeScript monorepo:

```text
apps/
  web/            React/Vite semantic workspace
  api/            Fastify HTTP/orchestration boundary
packages/
  analysis-core/  semantic IR, analysis, evidence, graph projections
```

Use the existing owner before adding another package. A local module is cheaper than a package; a package is cheaper than a service.

Current baseline technologies include React, TypeScript, Vite, `@xyflow/react`, Node.js, Fastify, and language-semantic tooling appropriate to each adapter. Versions belong in package manifests.

Do not add by default:

- microservices
- Redis/queues
- graph databases
- Kubernetes/service mesh
- CQRS/event sourcing
- generic DI/framework layers
- custom parser/layout/renderer infrastructure when mature tooling is sufficient
- embeddings/vector DB for deterministic relationships
- LLM calls in the critical repository-analysis path

## Security/privacy boundary

Repository contents are untrusted input and private repository source is confidential tenant data.

- handle path traversal/symlinks deliberately;
- do not execute analyzed repository code during static analysis;
- minimize source exposure in logs, telemetry, prompts, traces, errors, and client payloads;
- enforce reasonable resource limits and ignore generated/dependency directories;
- future runtime execution requires an explicitly designed sandbox for CPU, memory, filesystem, network, process, and timeout limits.

Security/privacy boundaries outrank delivery speed.

## UX contract

The workspace should help a developer move from system-level meaning to supporting evidence without fabricating certainty.

Core principles:

- system meaning before file structure;
- readable automatic layout before manual arrangement;
- selection reveals semantic identity, relationships, effects/failures, evidence, and source when known;
- focus/neighborhood views reduce graph noise;
- relationship lenses project relevant semantic views;
- large repositories use abstraction/collapse/focus rather than rendering everything;
- static simulation and runtime-observed traces are visibly distinct;
- runtime values or latency are never fabricated from static analysis.

Root `DESIGN.md` is authoritative for durable visual/interaction decisions.

## Durable product roadmap

Milestones M0-M8 and their acceptance/non-goals are maintained in `.agent/requirements/product-roadmap.md`. Do not duplicate milestone requirement detail here.

When product scope, semantics, architecture, security/privacy boundary, or durable interaction language changes, update the owning durable source in the same logical change.
