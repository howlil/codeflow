# CodeFlow Agent Workspace

`.agent/` holds repository-local product/engineering context without turning delivery into documentation ceremony.

The workspace separates **durable product/system truth** from **temporary execution state** and uses progressive disclosure so agents load only the context needed for the current change.

## Source-of-truth hierarchy

1. Runtime code + tests — actual implemented behavior.
2. `.agent/requirements/` — durable product outcomes, scope, acceptance criteria, and non-goals.
3. `.agent/specs/` — durable material product/system design decisions and constraints.
4. `.agent/rules.md` — canonical engineering execution policy.
5. `AGENTS.md` — progressive entry-point adapter + CodeFlow-specific invariants.
6. `.agent/plan.md` — short-lived Feature Compass/current execution state.
7. `.agent/plans/` / `.agent/checkpoints/` — temporary sequencing/continuity evidence only when useful.

If code and old execution prose disagree because implementation has moved forward, update/supersede the stale execution prose. If the disagreement concerns product intent or a material design decision, surface it instead of silently choosing one source.

## Read progressively

Start with `AGENTS.md`, `.agent/plan.md`, and `.agent/rules.md`.

Then load only the concern-specific durable source that the change actually touches:

- requirements for product behavior/scope
- specs for material architecture/contracts/security/data decisions
- source/tests for implementation ownership and current behavior
- CI/release files only when integration/release mechanics matter

Do not perform repository-wide reconnaissance or load the entire `.agent/` tree by default.

## Durable knowledge

Do **not** delete durable product/system knowledge merely because:

- an iteration completed
- implementation moved forward
- workflow changed
- a document is old
- fewer process files would look cleaner

Durable knowledge includes:

- product goals/outcomes
- product requirements and user journeys
- acceptance criteria/non-goals
- semantic/domain constraints
- architecture decisions/invariants
- security/privacy constraints
- public/semantic/API contracts
- validated design decisions

When durable knowledge changes, update it or explicitly supersede it with the replacement needed to understand the current decision.

## Temporary execution artifacts

Temporary artifacts may be deleted when stale and when they contain no unique durable product/design truth, for example:

- duplicated task plans
- retry/final/review-fix plans
- stale checkpoints/status snapshots
- superseded process instructions
- task sequencing that no longer helps execution

For mixed documents:

```text
durable product/system knowledge?
 -> preserve or migrate

temporary execution/process only?
 -> delete when stale

mixed?
 -> migrate durable truth first, then remove obsolete shell
```

## Artifact creation rule

Create an artifact only when it reduces meaningful ambiguity, delivery risk, or repeated rediscovery.

- update requirements when product intent/scope/acceptance changes
- update a spec when a material architecture, contract, security, privacy, persistence, or data-ownership decision changes
- create a task plan only when sequencing across boundaries materially helps execution
- create a checkpoint only when another session would otherwise need to rediscover important evidence
- do not create a spec/plan/checkpoint merely because work is non-trivial

A small bounded change normally needs no new planning document.

## Feature Compass

`.agent/plan.md` is the preferred orientation surface.

Keep it compact enough to answer:

```text
Feature Shape
 -> Current Position
 -> Delta
 -> Next Move
```

It should make clear what the feature will become, what differs from current state, what is done/in progress, and the single next meaningful action. Do not duplicate the full requirement/specification there.

## Planning preference

When sequencing genuinely matters, prefer a small vertical slice:

```text
fixture/input
 -> analysis/domain behavior
 -> contract/boundary
 -> consumer/UI
 -> evidence/verification
```

over horizontal scaffolding such as building all parsers, then all APIs, then all UI before integration.

## Execution policy

The canonical lifecycle, authority boundary, minimum-change rule, testing-by-risk, documentation/dependency policy, Feature Compass behavior, retrospective rule, quality gates, and stop conditions live in `.agent/rules.md`.

Do not restate those rules in new process documents.
