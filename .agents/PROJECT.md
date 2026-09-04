# CodeFlow Project

`PROJECT.md` is the canonical source of truth for CodeFlow product intent, observable behavior, scope, constraints, non-goals, deferred product directions, and open product questions. Active execution state belongs only in `CURRENT_ITERATION.md`.

## Purpose

CodeFlow is an interactive program-understanding system for developers working with unfamiliar software repositories.

It should help a developer move from repository-level orientation toward architecture, execution flow, data/state movement, dependencies, actual code changes, and the source evidence that supports those relationships without first reconstructing the system manually from files.

CodeFlow is not primarily a diagram editor, documentation generator, generic pull-request dashboard, or an LLM wrapper around repository chunks.

```text
repository semantic model = product truth
canvas = projection of that truth
AI = optional explanation over grounded evidence
```

## Intended User

A developer who needs to understand an unfamiliar or complex codebase quickly and wants system-level orientation before reading implementation details file by file or reviewing a concrete change.

## Core Product Journey

```text
public GitHub repository URL, public GitHub pull request URL, or explicit local repository selection
 -> bounded supported source + architecture metadata input
 -> configured workspace/package topology where repository evidence exists
 -> deterministic repository/module/file architecture projection
 -> package, symbol, and dependency exploration
 -> deterministic entry-point discovery
 -> deterministic semantic analysis
 -> evidence-backed semantic/data-flow projection
 -> semantic workspace
 -> search/focus/navigation
 -> inspect package dependencies + definitions + references + calls + data movement + source provenance
 -> define a hypothetical change scope and inspect bounded evidence-backed downstream impact where useful
 -> or freeze a public pull request base/head revision pair, map actual diff hunks to changed semantic entities, and inspect downstream impact plus relationship deltas
 -> deterministic static step-through where supported
```

The product must remain useful without AI explanation and without executing arbitrary repository code.

## Current Product Capability

The implemented TypeScript path currently supports:

- bounded public GitHub repository acquisition with authoritative URL/tree/source validation;
- bounded public GitHub pull-request acquisition with exact base/head SHA identity, changed-file metadata, patch limits, and change-aware source prioritization;
- dual-revision request-scoped analysis for pull requests so added/current semantics can use HEAD while removed/previous semantics can use BASE;
- actual Git diff hunk mapping to analyzed TypeScript/TSX file and symbol locations where evidence exists, with file-level fallback when precise semantic mapping is unavailable;
- semantic change projection for added, modified, and removed entities without fabricating rename semantics from name similarity;
- automatic reuse of the M8 impact engine for bounded changed-entity scopes, keeping impact derived from canonical semantic facts rather than inventing a second impact model;
- explicit base/head relationship deltas for supported `CALLS`, `REFERENCES`, `IMPORTS`, `DEPENDS_ON`, `EXTENDS`, and `IMPLEMENTS` relationships;
- a compact change workspace connecting changed semantic code, actual patch text, package/directory grouping, downstream impact, evidence paths, relationship deltas, and existing function-flow drill-down;
- truthful pull-request partial coverage when GitHub omits a patch, a changed file is unsupported, repository/tree/source limits truncate semantic coverage, or automatic impact scope is bounded;
- explicit browser-selected local repository input as a secondary repository-analysis path;
- separately bounded acquisition of `package.json`, `pnpm-workspace.yaml`, and `tsconfig*.json` architecture metadata without consuming the TypeScript source budget;
- configured Workspace and Package entities with package identity and workspace membership derived from repository metadata rather than directory naming alone;
- deterministic source-file ownership by the deepest configured package boundary;
- internal package `DEPENDS_ON` relationships from manifests, with supported source imports adding verified-static evidence to the same relationship;
- declared external package dependencies as secondary package context without expanding external dependencies into the primary internal topology graph;
- bounded TypeScript `baseUrl`/`paths` alias resolution for supported cross-package static dependency evidence;
- system topology exploration with incoming/outgoing package dependencies and package -> file -> symbol -> function-flow drill-down in the existing semantic workspace;
- topology orientation to the package that owns the active entry point where ownership evidence is available;
- explicit partial topology behavior when metadata is invalid, unsupported, unresolved, or outside metadata limits while valid source analysis remains usable;
- deterministic repository/module/file hierarchy from analyzed repository-relative source paths;
- source-backed file imports and derived cross-module dependencies;
- bounded TypeScript symbol projection for functions, methods, classes, interfaces, type aliases, enums, and variables;
- source-backed `CONTAINS`, `DEFINES`, `IMPORTS`, `DEPENDS_ON`, `EXPORTS`, `REFERENCES`, `EXTENDS`, and `IMPLEMENTS` repository/symbol relationships where supported;
- repository architecture search, hierarchy expand/collapse, relationship inspection, focused direct-neighborhood exploration, and supported architecture-to-function-flow drill-down;
- explicit hypothetical impact-scope selection across package, module, file, symbol, and function entities, bounded to a small number of change targets;
- deterministic direct and bounded transitive downstream impact derived from existing semantic relationships rather than stored as a fabricated canonical `IMPACTS` relationship;
- cycle-safe multi-seed impact traversal with evidence paths, affected file/module/package aggregation, filtering/focus, and truthful partial coverage including zero-result cases;
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
- A Git diff/change observation is not itself a semantic relationship evidence kind; pull-request change state remains a separate derived projection over frozen repository revisions.
- Pull-request analysis must preserve exact base/head revision identity for the analyzed session rather than silently following moving branch refs.
- Workspace/package metadata describes configured software boundaries and dependencies; it must not be relabeled as observed runtime service topology.
- Impact is a bounded derived query over canonical semantic facts; it must not become an unsupported canonical relationship or a prediction of runtime failure.
- Missing impact results do not prove safety; incomplete source, unsupported semantics, missing patches, or bounded traversal remain explicit partial coverage.
- Missing evidence remains missing/partial; visual completeness must not fabricate semantics.
- The canvas and change workspace are semantic exploration surfaces, not canonical repository state.
- Parser/framework-specific objects do not become cross-system contracts.
- Large repositories and large changes use bounded projections, focus, and abstraction rather than rendering every symbol by default.
- Static simulation and observed runtime traces remain distinct evidence domains.
- Static analysis must not invent concrete runtime values, branch outcomes, timing, frequency, latency, risk, breakage, safety, or probability.
- Ordinary static analysis does not execute arbitrary repository code.

## Security and Privacy Expectations

Repository input is untrusted and may be confidential.

- Browser filtering may minimize source sent, but API validation remains authoritative.
- Public GitHub pull-request acquisition is read-only and bounded; private Git-host authentication is not part of current scope.
- Repository-relative path handling must reject traversal and unsafe paths.
- File count, per-file size, total source size, metadata count/size, pull-request changed-file count, patch size, request size, and expensive work remain bounded.
- Source, architecture-metadata, and pull-request diff budgets remain explicit so change acquisition cannot silently create unbounded repository ingestion.
- Dependency/vendor/build/VCS/generated directories should be excluded where appropriate.
- Repository source, metadata, pull-request revisions, diffs, and analysis remain request-scoped/in-memory unless persistence is explicitly authorized.
- Logs, errors, analytics, and future AI context must not expose arbitrary private source without explicit need.
- Runtime repository execution requires a separately approved sandbox design covering resource, filesystem, process, network, timeout, and secret isolation.

## Non-Goals Unless Explicitly Authorized

Do not infer current scope from historical ideas or generic best practices. In particular, the following are not automatically authorized:

- universal language/framework coverage;
- production runtime tracing or repository execution;
- private Git-host authentication/import;
- pull-request comments, approvals, reviewer assignment, or CODEOWNERS workflow;
- AI pull-request summaries, AI code review, risk scores, or automated refactor recommendations;
- saved analyses or product persistence;
- collaborative diagram or review editing;
- graph database, Redis, queue, distributed workers, or Kubernetes architecture;
- repository-wide LLM ingestion;
- billing, subscriptions, organization/team permissions, or collaborative cursors.

## Deferred Product Directions — Not a Roadmap

These are possible future directions, not ordered milestones, commitments, or default next work:

- prove the shared semantic model with another language adapter such as Go;
- understand multi-application/service repositories and cross-application relationships beyond configured package topology;
- add infrastructure/configuration semantics where target repositories justify them;
- add grounded AI explanation over selected semantic/evidence/change context;
- validate runtime observations and how `observed-runtime` evidence maps to stable semantic identity;
- add private Git-host import/auth or durable saved analyses if a future product requirement requires them.

Do not auto-activate a deferred direction because it appeared in an older milestone sequence. Future milestone shaping starts from current user intent and the highest-value core journey gap.

## Material Open Questions

The following remain undecided until an authorized requirement makes them necessary:

- private Git-host authentication and acquisition;
- saved analyses, persistence model, and data retention;
- runtime repository execution and sandboxing;
- AI/private-source handling;
- multi-user isolation and collaboration;
- ownership of framework-specific persistence/event semantics.
