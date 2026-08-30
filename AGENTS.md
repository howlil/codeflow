# CodeFlow Agent Adapter

This file is the entry point for agent work in CodeFlow. It routes work into the repository's local sources of truth and preserves CodeFlow-specific invariants. It must not duplicate the full engineering policy.

## Read progressively

Always start with:

1. `.agent/plan.md` — current Feature Compass: feature shape, current position, delta, and next move.
2. `.agent/rules.md` — canonical lifecycle, authority, minimum-change, testing, quality, documentation, dependency, retrospective, and stop rules.

Load only when the current change touches the concern:

- `.agent/requirements/product-roadmap.md` — durable product outcomes, milestone requirements, acceptance criteria, and non-goals.
- `.agent/specs/2026-08-25-codeflow-foundation-design.md` — current foundation architecture, semantic model, UX direction, constraints, and trade-offs.
- source code/tests — actual implemented behavior and repository conventions.
- CI/release configuration — only when integration or release mechanics matter.

Do not load the entire repository or `.agent/` tree by default. Expand context only when the requested change or a discovered dependency materially requires it.

## Authority model

- The user owns WHY, WHAT, product scope/boundaries, product semantics, material architecture decisions, and final product/release decisions.
- The agent has high autonomy for ordinary local engineering execution once the bounded change is authorized.
- Do not ask for approval for routine implementation details.
- Evidence, best practices, or recommendations do not authorize product scope expansion.
- If a material product/architecture/security decision is not already authorized, surface it rather than silently crossing the boundary.

## Canonical execution loop

```text
USER INTENT
 -> UNDERSTAND
 -> BOUND
 -> SPECIFY
 -> DESIGN
 -> IMPLEMENT
 -> VERIFY
 -> QUALITY GATES
 -> RELEASE READY
 -> STOP
```

Operationally:

```text
understand explicit request/problem
 -> inspect only relevant existing implementation
 -> bound smallest coherent change
 -> derive only acceptance criteria needed to remove ambiguity
 -> choose smallest design using existing ownership/patterns
 -> implement minimum change
 -> identify realistic regression risk
 -> choose cheapest high-signal verification
 -> use TDD only when it is the best tool
 -> run mandatory repository gates + justified risk-specific checks
 -> declare release-ready only from observed evidence
 -> stop
```

`.agent/rules.md` is normative if this summary is incomplete.

## CodeFlow mission

CodeFlow turns a software repository into an evidence-backed semantic map of architecture, execution flow, data flow, dependencies, state changes, failures, infrastructure, and eventually observed runtime behavior.

The repository model is the source of truth. The canvas is a projection of that model. AI is an explanation layer over evidence, not a source of canonical graph structure.

## Locked CodeFlow product/architecture invariants

Preserve these unless the user explicitly authorizes a material change:

1. **Evidence before explanation.** Deterministic/static/configured/runtime evidence precedes LLM interpretation.
2. **Universal semantic IR.** Language, framework, infrastructure, and runtime adapters emit into one shared semantic model rather than separate product architectures.
3. **Truthful uncertainty.** Distinguish verified, inferred, configured, runtime-observed, and user-asserted relationships. Never present inference as observed fact.
4. **Canvas is a projection, not canonical state.** UI coordinates/grouping do not define repository truth.
5. **Static analysis is useful without executing untrusted code.** Runtime execution/tracing is a separately authorized, sandboxed capability.
6. **Pragmatic modular monolith first.** Do not introduce microservices, queues, Redis, graph databases, Kubernetes, or distributed coordination without measured current need and authorized scope.
7. **Progressive semantic disclosure.** Show system meaning first, then allow navigation toward modules, symbols, control/data flow, and source evidence.
8. **Private repository data is confidential.** Minimize source exposure in logs, telemetry, prompts, traces, and client payloads.

## Semantic evidence model

Relationships that can be uncertain retain provenance sufficient to answer where the edge came from and what supports it.

Preferred evidence classes:

```text
verified-static   deterministic semantic resolution
inferred-static   heuristic/static inference
configured        explicit config/manifest evidence
observed-runtime  captured runtime evidence
user-asserted     explicit user annotation, separate from analyzer truth
```

Do not convert heuristic scores into false precision.

## Analysis boundary

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

An LLM may explain an already-grounded path. It must not be the primary parser, symbol resolver, or source of canonical edges.

UI code must not parse source files directly. Parser/framework-specific objects must not leak into the core semantic contract when a stable IR representation can own the concept.

## Repository shape and architecture bias

Current direction is a small TypeScript monorepo:

```text
apps/
  web/
  api/
packages/
  analysis-core/
```

Use existing ownership before creating another package. A local module is cheaper than a package; a package is cheaper than a service.

Use stable, boring ecosystem tools when they satisfy the requirement. Do not build custom parser, graph layout, renderer, orchestration, persistence, or plugin infrastructure until a current requirement proves existing/simple approaches insufficient.

## Security boundary

Repository contents are untrusted input.

- handle path traversal and symlinks deliberately
- do not execute analyzed repository code during ordinary static analysis
- do not leak repository secrets/source into logs, analytics, prompts, errors, or client payloads without explicit need
- enforce reasonable resource limits and ignore common generated/dependency directories
- minimize LLM context to evidence needed for the question
- any future runtime execution requires an explicitly designed sandbox for CPU, memory, filesystem, network, process, and timeout limits

Security/privacy boundaries outrank delivery speed.

## UI/understanding contract

The product should help a developer move from system-level meaning to supporting evidence without fabricating certainty.

Core UX principles:

- system meaning before file structure
- automatic readable layout before manual arrangement
- selection reveals purpose, inputs/outputs, relationships, state/side effects, failures, evidence, and source when known
- focus/neighborhood views reduce unrelated graph noise
- relationship lenses may project calls, data, state, events, dependencies, infrastructure, and runtime
- large repositories use abstraction/collapse/focus rather than rendering the entire symbol graph by default
- static simulation and runtime-observed traces must be visibly distinguishable
- never fabricate runtime values or latency from static analysis

## CodeFlow-specific verification focus

When relevant, prioritize confidence in:

- semantic relationship correctness
- stable/deterministic graph identifiers where required
- evidence provenance and truthful uncertainty
- repository/project isolation and boundary validation
- graph/projection contracts across analysis core, API, and web
- source/evidence inspection flow
- static-vs-runtime labeling
- security/privacy behavior for untrusted/private repositories

A tiny representative fixture is preferable to a huge external repository when it proves the same regression risk more deterministically.

Testing mechanics and TDD policy are defined in `.agent/rules.md`.

## Git/integration

`master` is the current integration branch.

For implementation changes, keep one coherent task identity through branch, PR, CI, review, and fixes. Do not create retry/final/review-fix branches for the same work. Keep unrelated cleanup out of the PR. Prefer squash merge unless repository policy changes.

Do not treat commit count, branch count, PR count, or changed LOC as productivity metrics.

## Agent workspace

- `AGENTS.md` — progressive entry point + CodeFlow-specific invariants.
- `.agent/rules.md` — canonical engineering execution policy.
- `.agent/plan.md` — short-lived Feature Compass/current execution state.
- `.agent/requirements/` — durable product scope, outcomes, acceptance, and non-goals.
- `.agent/specs/` — durable material product/system design decisions.
- `.agent/plans/` — sequencing only when it genuinely reduces execution risk.
- `.agent/checkpoints/` — concise continuity evidence only when useful.

Do not create process artifacts as ceremony or duplicate the same truth across multiple files.

## Final decision filter

Before adding code, abstractions, dependencies, tests, instrumentation, or process, ask:

1. Does this directly satisfy or de-risk the authorized outcome?
2. Which existing owner/pattern can handle it?
3. What realistic failure/regression does it prevent?
4. Is there evidence the simpler option is insufficient?
5. Does it cross a product, architecture, data, privacy, permission, or public-contract boundary that requires user authority?

If the simpler bounded solution satisfies the current need and required gates, ship that solution and stop.
