# CodeFlow Backend Engineering Skill

Use this skill for changes owned by `apps/api`, `packages/analysis-core`, or backend portions of a vertical user-facing slice.

## Objective

Build deterministic, secure, explicit backend behavior that keeps CodeFlow semantic truth in the analysis/domain boundary and keeps HTTP transport thin.

Optimize for:

```text
correct semantics
-> explicit contracts
-> deterministic behavior
-> narrow transport
-> bounded untrusted input
-> focused verification
-> minimal architecture
```

## Stack Contract

Current installed backend stack is authoritative from package manifests.

Current backend shape:

- Node.js 24 / TypeScript / ESM;
- Fastify 5 in `apps/api`;
- semantic model, TypeScript analysis, evidence, and projection behavior in `packages/analysis-core`;
- Vitest for verification.

Do not add validation libraries, ORMs, queues, caches, databases, worker frameworks, DI containers, logging frameworks, or service layers without a current requirement that justifies them.

## Vertical Feature Delivery

For user-facing capabilities, backend work is one part of a vertical slice:

```text
analysis/domain behavior
-> projection/API contract
-> web interaction/presentation
-> verification
```

A semantic or API capability intended for the user is not considered delivered when only backend code exists. Pair it with the corresponding UI behavior in the same authorized milestone/slice unless the work is explicitly infrastructure-only, contract-only, migration-only, or an exploratory spike.

Likewise, backend must not implement speculative semantics solely because a UI might need them later.

## Responsibility Boundaries

### `packages/analysis-core`

Owns:

- semantic entities and relationships;
- evidence/provenance classification;
- deterministic semantic identity;
- language/framework analysis;
- projection/domain behavior;
- explicit unsupported/partial semantics.

It must not depend on HTTP, React, browser state, or transport-specific request shapes.

### `apps/api`

Owns:

- HTTP transport;
- request validation/parsing at the boundary;
- orchestration of analysis/domain calls;
- response/status mapping;
- transport-level error handling.

It must not become the owner of parser logic, semantic inference, or duplicated domain rules.

## Request Flow

Prefer the direct flow:

```text
request
-> validate boundary input
-> call owning analysis/domain function
-> map explicit projection/result
-> reply
```

Do not introduce controller -> service -> repository -> manager chains when each layer only forwards arguments.

Create a new abstraction only when it owns durable behavior, state, policy, integration, or a boundary that needs independent testing/replacement.

## Fastify Rules

- Keep route handlers small and explicit.
- Prefer Fastify's registration/plugin model when multiple routes or concerns genuinely share configuration/lifecycle; do not create a plugin for every trivial route.
- Use `app.inject()`/equivalent in API tests rather than binding real ports.
- Validate user-controlled input at the HTTP boundary when such input exists.
- Keep status codes and response semantics deliberate; do not return `200` for domain/validation failures merely for convenience.
- Normalize expected errors rather than leaking raw internal exceptions.
- Do not expose stack traces, arbitrary repository source, filesystem paths, secrets, or internal parser structures in normal API responses/errors.
- Keep health/readiness endpoints small and operationally meaningful.

## Contracts and Types

- HTTP contracts expose semantic/projection data, never parser AST objects.
- Prefer one deliberate contract owner over independently duplicated transport types that can drift.
- Do not create a shared package solely to remove a few duplicated types; introduce a shared contract boundary only when repeated cross-app change pressure justifies it or a milestone explicitly requires it.
- Material public-contract changes require explicit user approval.
- Keep optional/partial fields semantically honest. Absence is different from inferred data.

When runtime validation becomes necessary, prefer mechanisms that integrate cleanly with Fastify's schema/serialization pipeline before adding parallel validation ceremony. Any new library still requires a concrete need.

## Analysis-Core Rules

- Use the strongest practical language-native semantic tooling available.
- Parser/compiler objects stay private to adapters/analyzers.
- Emit the shared semantic model rather than language-specific UI shapes.
- Keep analysis deterministic for the same source/revision where feasible.
- Stable semantic IDs must not depend on canvas coordinates or incidental iteration order.
- Never fabricate relationships, runtime values, confidence, or source evidence to make output look complete.
- Unsupported semantics should remain explicit.
- Separate semantic extraction from presentation concerns.

## Repository Input and Security

Repository input is untrusted and may be confidential.

When real repository input is introduced:

- canonicalize and bound the allowed repository root;
- prevent `..` traversal and symlink escape;
- deliberately ignore dependency/vendor/build/generated directories where appropriate;
- bound file count, file size, total bytes, parse/analysis work, and time where practical;
- do not execute repository code during ordinary static analysis;
- avoid raw source in logs/analytics/errors by default;
- minimize source passed to future AI integrations;
- treat runtime execution as a separate sandboxed architecture requiring explicit approval.

Do not add a shell/process execution shortcut to obtain semantic results that static tooling can establish safely.

## Async and CPU Work

- Keep I/O asynchronous where it is naturally asynchronous.
- Do not add queues/workers for hypothetical scale.
- If analysis later creates measured event-loop pressure, first bound analysis scope and measure it; introduce worker-thread/process isolation only when evidence justifies the added boundary.
- Avoid unbounded `Promise.all` over repository files or external operations.
- Make cancellation/timeouts/resource limits explicit when long-running user-controlled analysis is introduced.

## Persistence

There is currently no production persistence requirement.

Do not introduce repositories/ORM/database abstractions until durable state is explicitly required.

If persistence becomes authorized:

- define ownership and transactional invariants first;
- prefer the simplest store that matches actual access patterns;
- keep migrations deterministic and reviewable;
- do not make storage records the semantic model by accident;
- keep graph-specific infrastructure unjustified until measured/product requirements demand it.

## Error Modeling

Distinguish at least conceptually:

```text
invalid request
unsupported analysis
partial analysis
not found
conflict/state issue
internal failure
```

Do not collapse expected partial/unsupported analysis into generic `500` responses when the product can represent the state truthfully.

Internal errors should retain enough diagnostics for engineering without exposing private source or secrets to clients.

## Clean Code

Prefer:

```text
clear function
-> cohesive module
-> small local helper
-> explicit boundary abstraction
-> new package/layer only after durable ownership exists
```

Rules:

- Name functions/types after domain responsibility, not implementation mechanism when possible.
- Keep functions focused, but do not fragment a coherent algorithm into tiny forwarding helpers.
- Avoid generic `utils`, `helpers`, `manager`, or `service` dumps.
- Keep dependencies directional: web -> API contract -> API -> analysis-core; analysis-core must not depend upward.
- Remove dead exports and stale paths rather than preserving compatibility without a requirement.
- Avoid comments that restate code; document invariants, trade-offs, security constraints, and non-obvious reasoning.
- Prefer explicit data flow over hidden global state, ambient mutation, or DI machinery without need.

## Testing

### Analysis/domain

Use small deterministic fixtures/tests to protect:

- entity and relationship correctness;
- symbol/reference resolution;
- evidence provenance;
- deterministic IDs where required;
- projection output;
- unsupported/partial behavior;
- regression cases.

A small representative fixture is preferred to a large external repository when it proves the semantic behavior more precisely.

### API

Protect:

- route status/response behavior;
- validation and error mapping;
- projection contract shape where material;
- privacy/security behavior at exposed boundaries.

Avoid testing Fastify/framework internals or trivial implementation details.

Run focused package tests first, then the repository gate defined by `.agents/QUALITY.md`.

## Performance

Do not design distributed infrastructure first.

Prefer in order:

1. ignore irrelevant/generated/dependency input;
2. bound repository/projection scope;
3. eliminate repeated parsing/work;
4. add content-hash/incremental caching when measured useful;
5. isolate CPU-heavy analysis when event-loop pressure is proven;
6. only then evaluate queues/distributed workers/storage from evidence.

## Done Criteria

Backend work is complete when:

- authorized semantics/contracts are correct;
- boundary validation/error behavior is explicit where applicable;
- evidence/partial states remain truthful;
- user-facing capabilities are connected through API to the corresponding UI unless explicitly scoped otherwise;
- no unnecessary abstraction/dependency/infrastructure was introduced;
- relevant focused tests pass;
- repository quality gates pass when required.
