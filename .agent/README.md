# CodeFlow Agent Workspace

`.agent/` is the repository-local workspace for internal engineering designs, plans, and execution evidence. It exists to help coding agents and contributors preserve context without turning the public product surface into an agent notebook.

## Source-of-truth hierarchy

1. Runtime code and tests define actual behavior.
2. Root `AGENTS.md` defines repository-wide engineering and architecture policy.
3. Root `plan.md` defines current milestone state and short roadmap.
4. `.agent/specs/` contains approved architecture/product decisions.
5. `.agent/plans/` contains executable implementation sequencing when the work is large enough to benefit from it.
6. `.agent/checkpoints/` contains concise execution evidence when continuity or auditability benefits from it.

If code and an old plan disagree because implementation has moved forward, update or supersede the plan rather than forcing code back to stale prose.

## Directory shape

```text
.agent/
  README.md
  specs/
    YYYY-MM-DD-<topic>-design.md
  plans/
    YYYY-MM-DD-<topic>.md
  checkpoints/
    YYYY-MM-DD-<topic>.md
```

Create artifacts only when they reduce ambiguity, execution risk, or repeated rediscovery. Do not mirror source-code folders under `.agent/`.

## When to write a spec

Use `.agent/specs/` when a task changes a material boundary such as:

- semantic IR/schema
- language/framework adapter contracts
- evidence/provenance model
- repository security/sandboxing
- public graph/API contracts
- persistence format/migrations
- runtime tracing model
- canvas abstraction/navigation model
- architecture/deployment shape

A spec should be decision-oriented: problem, constraints, invariants, chosen design, rejected alternatives when useful, risks, acceptance criteria.

## When to write a plan

Use `.agent/plans/` when sequencing matters across multiple files/modules or when a task needs staged verification. Plans must be executable and test-oriented, not speculative TODO catalogs.

Prefer vertical slices:

```text
fixture repo
  -> analyze
  -> semantic IR
  -> projection
  -> API
  -> canvas
  -> inspector/evidence
```

over horizontal scaffolding such as “build all parsers, then all API, then all UI”.

## Checkpoints

Use `.agent/checkpoints/` for concise evidence when needed:

- what changed
- what was verified
- current result
- remaining blocker/risk

Do not create checkpoint spam for every command or edit.

## Delivery model

Default engineering loop:

```text
goal
  -> acceptance criteria
  -> smallest coherent vertical slice
  -> RED
  -> GREEN
  -> REFACTOR
  -> focused verification
  -> PR / CI
  -> review/fix on same branch
  -> merge
```

Rules:

- behavior changes use TDD when an executable seam exists
- one coherent task normally uses one branch and one PR
- failed tests/CI/review fixes stay on the same task identity
- optimize cycle time without trading away correctness or evidence quality
- use YAGNI aggressively
- avoid architecture ceremony for trivial work

## CodeFlow-specific review questions

Before accepting a change, ask:

1. Does this improve or preserve semantic correctness?
2. Is the relationship grounded in deterministic/configured/runtime evidence, or did we accidentally let an LLM invent structure?
3. Is uncertainty represented honestly?
4. Does the change keep the universal IR independent from React, Fastify, parser-specific AST objects, and database APIs?
5. Could this remain a module instead of becoming a new package/service/infrastructure dependency?
6. Does the canvas remain a projection rather than the source of truth?
7. For large graphs, are we reducing information through abstraction/focus rather than rendering everything?
8. Does private repository source stay isolated and sanitized?
9. Is there a small fixture/test that proves the behavior?

## Anti-ceremony rule

Do not create a new spec, plan, package, abstraction, service, worker, database, or tool merely because CodeFlow may eventually support every language and project type. The architecture is universal; implementation remains incremental.
