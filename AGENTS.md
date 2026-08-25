# CodeFlow Engineering Rules

## Mission
CodeFlow turns a repository into an evidence-backed semantic map of architecture, execution flow, data flow, dependencies, state, failures, and infrastructure.

Canonical truth comes from deterministic/static/configured/runtime evidence. The canvas is a projection. AI explains evidence; it does not invent canonical graph structure.

## Knowledge Preservation Rule
Separate **durable product knowledge** from **temporary delivery workflow**.

Durable product knowledge includes:
- product goals and project detail,
- requirements and user journeys,
- acceptance criteria and explicit non-goals,
- domain constraints,
- architecture decisions/invariants,
- security/privacy constraints,
- API/semantic contracts,
- validated design decisions.

These artifacts must **never be deleted merely because a workflow changes or an iteration finishes**. They may be updated, reorganized, or explicitly superseded only when the underlying product decision changes. When superseding them, preserve the replacement and decision history needed to understand why.

Temporary workflow artifacts include:
- obsolete execution checklists,
- duplicated milestone/task plans,
- retry/final/review-fix plans,
- stale checkpoints,
- redundant status notes,
- process documents that duplicate this file.

Only temporary workflow artifacts should be removed when they become stale.

## Delivery North Star
Optimize for **validated user value reaching `master` quickly and safely**.

Default loop:

```text
problem -> acceptance criteria -> smallest vertical slice -> implement/test -> PR -> CI -> merge -> observe
```

Rules:
- Ship the smallest end-to-end behavior that proves value.
- Prefer hours-to-1-day slices. Split work when a change cannot be reviewed or reverted easily.
- One task = one short-lived branch = one PR.
- Keep WIP low: finish/merge before starting adjacent cleanup.
- Fix review/CI feedback on the same branch; never create retry/final/review branches.
- Refactor only what blocks the current slice or removes measured pain.
- Do not create process documentation that duplicates existing rules.
- For reversible implementation decisions, implement first and learn. Record a durable decision only for product/architecture/security boundaries that future work must preserve.

## Requirement Rule
Before coding, identify:
1. user/problem statement,
2. observable acceptance criteria,
3. explicit non-goals,
4. material constraints/risks.

Requirements are durable product context. Keep them in `.agent/requirements/` or the appropriate product/design document. Never delete requirements because implementation is complete; update their status or supersede them when product intent changes.

Avoid duplicating the same requirement across multiple documents. If acceptance cannot be observed by a test, behavior, metric, or manual check, tighten it.

## Iteration Rule
Use thin vertical slices rather than horizontal scaffolding.

Good:
```text
fixture repo -> analyze -> semantic IR -> API projection -> canvas -> evidence inspector
```

Bad:
```text
all parsers -> all abstractions -> all APIs -> all UI -> integration later
```

Each iteration should leave `master` buildable and preferably usable. Iteration/task plans are disposable; product requirements and design decisions are not.

## System Design Rules
Preserve these invariants:
- **Universal semantic IR** is the core boundary.
- Every uncertain edge carries provenance: `verified-static`, `inferred-static`, `configured`, `observed-runtime`, or `user-asserted`.
- Static and runtime evidence remain distinguishable.
- UI never parses source directly.
- LLM output never becomes canonical graph truth without explicit validation.
- Repository contents are untrusted input; do not execute arbitrary analyzed code by default.
- Start as a modular monolith. Add services, queues, graph DBs, Redis, workers, or Kubernetes only from measured need.

Preferred initial shape:
```text
apps/web
apps/api
packages/analysis-core
```

A directory/module is cheaper than a new package. A package is cheaper than a service.

## Code Pattern Rules
Apply KISS/YAGNI first; SOLID and DRY are reasoning tools, not abstraction quotas.

Prefer:
- plain functions and data,
- explicit control flow,
- discriminated unions/types,
- narrow modules,
- dependency direction toward domain/IR,
- regression tests for reproducible bugs.

Avoid unless evidence requires them:
- generic repository/service/controller layers,
- DI containers,
- factories for one implementation,
- command/event buses for local calls,
- speculative plugin frameworks,
- premature shared packages,
- custom parser/layout/renderer when mature tooling works,
- microservices, CQRS/event sourcing, Kafka/RabbitMQ, Redis, Neo4j, Kubernetes.

Rule of three: tolerate small duplication until a stable shared concept is visible. Remove duplicated knowledge, not every repeated line.

## Testing and Quality
Tests protect behavior and semantic correctness, not implementation shape.

Priority:
1. focused unit/fixture test for changed semantics,
2. API/component test when crossing a boundary,
3. one tiny end-to-end journey for critical flows.

Do not chase coverage percentages. Add tests where regression cost is real.

Definition of done:
- acceptance criteria satisfied,
- relevant tests pass,
- lint/type/build pass,
- no known misleading evidence/UI state,
- security boundary preserved,
- branch is mergeable.

## Git Strategy
`master` is the integration/release branch.

```text
master -> feat|fix|chore/<short-task> -> PR -> squash merge -> delete branch
```

Rules:
- Branch lifetime target: < 1 working day; > 2 days is a signal to split scope.
- PR target: one coherent behavior; prefer < ~400 changed LOC excluding generated/lock files. This is a diagnostic, not a hard blocker.
- Squash merge by default.
- Delete merged branches.
- Rebase/update only when needed to resolve real conflicts or stale checks.
- No long-lived develop/release branches.
- Hotfix: branch from `master`, smallest fix + regression test, merge, release.

## Release Strategy
Release from `master`; do not accumulate artificial release batches.

A release is allowed when:
- required CI is green,
- the shipped path meets acceptance criteria,
- rollback is understood.

Versioning:
- pre-1.0: `0.MINOR.PATCH`; MINOR = usable capability, PATCH = compatible fix/improvement.
- after stable public contracts: use SemVer normally.

Rules:
- Tag releases from `master`.
- Generate concise release notes from shipped user-visible changes.
- Prefer forward fix for trivial low-risk defects; use revert when impact is active or root cause is uncertain.
- Never block a release on unrelated cleanup, refactor, docs polish, or speculative hardening.

## Agent Skills / Tool Rule
Agents should use the cheapest tool that can prove the next decision:
- inspect/search before designing,
- run the narrowest relevant test before full-suite verification,
- use existing project tooling before adding dependencies,
- prefer repository evidence over generic best-practice assumptions.

Do not create duplicate process artifacts. Do create/update durable requirement or design documentation when product intent, architecture invariants, public contracts, or security constraints materially change.

## Delivery Metrics
Track trends, not vanity targets.

Primary:
- **Lead time:** task start -> merged to `master`.
- **Cycle time:** first implementation commit -> merge.
- **PR pickup/review latency.**
- **CI feedback time and failure rate.**
- **Change failure:** revert/hotfix/regression after merge.
- **WIP:** simultaneously open implementation PRs.

Diagnostic:
- PR changed LOC/files,
- rework/churn before merge,
- flaky test rate,
- build/test duration,
- hotspot complexity/coupling when actual code exists.

Never optimize commit count, LOC produced, number of plans, or number of abstractions.

When delivery slows, inspect in this order:
```text
scope too large?
-> waiting/review?
-> CI too slow/flaky?
-> unclear acceptance?
-> architecture coupling?
-> environment/tool friction?
-> only then add process/tooling
```

## Product Metrics
Engineering speed is useful only if it advances product learning. For each meaningful slice, identify one observable outcome when possible: successful repository analysis, time-to-first-map, analysis error rate, graph/evidence correctness issues, user completion of a flow inspection, or performance on a representative fixture.

Do not build analytics infrastructure before there is a real user path to measure.

## Agent Workspace
`.agent/` separates durable product context from temporary execution state.

Durable:
- `.agent/requirements/` — product requirements, scope, acceptance, non-goals,
- `.agent/specs/` — product/system design and architectural decisions that still describe intended behavior,
- `.agent/decisions/` — costly-to-reverse decisions and supersession history.

Temporary:
- `.agent/plan.md` — current state / next 1-3 slices,
- `.agent/plans/` — task execution sequencing only when genuinely necessary,
- `.agent/checkpoints/` — concise continuity evidence.

Delete stale temporary workflow artifacts. **Do not delete durable requirements/project detail/design context as cleanup.**

## Final Decision Filter
Before adding anything, ask:
1. Does this directly help the current acceptance criteria?
2. Is there evidence the simpler option fails?
3. Can this decision be reversed cheaply later?
4. Does it shorten or lengthen feedback time?
5. Is this product knowledge that future contributors must retain, or merely temporary workflow state?

If the simpler solution satisfies the current need, ship it. Preserve the product knowledge required to make the next correct decision.
