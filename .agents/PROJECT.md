# CodeFlow Project

`PROJECT.md` is the canonical source of truth for CodeFlow product intent, observable behavior, scope, constraints, non-goals, deferred product directions, and open product questions. Active execution state belongs only in `CURRENT_ITERATION.md`.

## Purpose

CodeFlow is an interactive program-understanding system for developers working with unfamiliar software repositories.

It should help a developer move from repository-level orientation toward architecture, execution flow, data/state movement, dependencies, and the source evidence that supports those relationships without first reconstructing the system manually from files.

CodeFlow is not primarily a diagram editor, documentation generator, or an LLM wrapper around repository chunks.

```text
repository semantic model = product truth
canvas = projection of that truth
AI = optional explanation over grounded evidence
```

## Intended User

A developer who needs to understand an unfamiliar or complex codebase quickly and wants system-level orientation before reading implementation details file by file.

## Core Product Journey

```text
public GitHub repository URL or explicit local repository selection
 -> bounded supported source input
 -> deterministic entry-point discovery
 -> deterministic semantic analysis
 -> evidence-backed semantic/data-flow projection
 -> semantic workspace
 -> search/focus/navigation
 -> inspect calls + data movement + source provenance
 -> deterministic static step-through where supported
```

The product must remain useful without AI explanation and without executing arbitrary repository code.

## Current Product Capability

The implemented TypeScript path currently supports:

- bounded public GitHub repository acquisition with authoritative URL/tree/source validation;
- explicit browser-selected local repository input as a secondary path;
- deterministic exported-function entry-point discovery with confidence labels;
- request-scoped/in-memory multi-file TypeScript analysis;
- evidence-backed functions and supported cross-file call relationships;
- repository-relative source/evidence provenance;
- search, neighborhood focus, selection, keyboard navigation, source inspection, relationship inspection, and responsive layout;
- explicit loading, empty, partial, unsupported, invalid, and error behavior where applicable;
- declared function parameters and explicit return paths;
- supported caller argument to callee parameter mapping;
- source-backed declarations, aliases, lexical reads/writes, transforms, mutations, and value dependencies;
- `CALLS`, `READS`, `WRITES`, `MUTATES`, `PASSES_ARGUMENT`, `FLOWS_TO`, and `RETURNS_TO` semantic/static-flow relationships where supported by evidence;
- relationship lenses derived only from semantic kinds actually present;
- deterministic static step-through with branch/failure possibilities represented as possibilities rather than observed execution;
- production Docker Compose packaging with a public `web` container on exposed port `8080`, internal `api:3001`, and platform-managed external routing suitable for MyPaaS.

The deterministic sample API remains a fixture/demo compatibility path rather than the primary product journey.

## Product Constraints

- Evidence precedes explanation.
- Verified, inferred, configured, observed-runtime, and user-asserted evidence remain distinguishable.
- Missing evidence remains missing/partial; visual completeness must not fabricate semantics.
- The canvas is a semantic exploration surface, not canonical repository state.
- Parser/framework-specific objects do not become cross-system contracts.
- Large repositories use bounded projections, focus, and abstraction rather than rendering every symbol by default.
- Static simulation and observed runtime traces remain distinct evidence domains.
- Static analysis must not invent concrete runtime values, branch outcomes, timing, frequency, latency, or probability.
- Ordinary static analysis does not execute arbitrary repository code.

## Security and Privacy Expectations

Repository input is untrusted and may be confidential.

- Browser filtering may minimize source sent, but API validation remains authoritative.
- Repository-relative path handling must reject traversal and unsafe paths.
- File count, per-file size, total source size, request size, and expensive work remain bounded.
- Dependency/vendor/build/VCS/generated directories should be excluded where appropriate.
- Repository source and analysis remain request-scoped/in-memory unless persistence is explicitly authorized.
- Logs, errors, analytics, and future AI context must not expose arbitrary private source without explicit need.
- Runtime repository execution requires a separately approved sandbox design covering resource, filesystem, process, network, timeout, and secret isolation.

## Non-Goals Unless Explicitly Authorized

Do not infer current scope from historical ideas or generic best practices. In particular, the following are not automatically authorized:

- universal language/framework coverage;
- production runtime tracing or repository execution;
- Git-host authentication/import;
- saved analyses or product persistence;
- collaborative diagram editing;
- graph database, Redis, queue, distributed workers, or Kubernetes architecture;
- repository-wide LLM ingestion;
- billing, subscriptions, organization/team permissions, or collaborative cursors.

## Deferred Product Directions — Not a Roadmap

These are possible future directions, not ordered milestones, commitments, or default next work:

- prove the shared semantic model with another language adapter such as Go;
- understand multi-application/service repositories and cross-application relationships;
- add infrastructure/configuration semantics where target repositories justify them;
- add grounded AI explanation over selected semantic/evidence context;
- validate runtime observations and how `observed-runtime` evidence maps to stable semantic identity;
- add Git-host import/auth or durable saved analyses if a future product requirement requires them.

Do not auto-activate a deferred direction because it appeared in an older milestone sequence. Future milestone shaping starts from current user intent and the highest-value core journey gap.

## Material Open Questions

The following remain undecided until an authorized requirement makes them necessary:

- Git-host authentication and private repository acquisition;
- saved analyses, persistence model, and data retention;
- runtime repository execution and sandboxing;
- AI/private-source handling;
- multi-user isolation and collaboration;
- ownership of framework-specific persistence/event semantics.
