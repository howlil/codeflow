# CodeFlow Engineering Policy

This file is the canonical execution policy for software/product work in CodeFlow. Optimize for **fast verified user value**, not ceremony, coding volume, test count, or agent-generated scope.

Project/product truth lives in requirements, specs, code, and tests. `AGENTS.md` is the entry-point adapter and CodeFlow-specific invariant summary; this file owns the execution lifecycle and engineering behavior.

## 1. Authority boundary

### User owns

- WHY and intended product outcome
- WHAT behavior/capability is in scope
- product scope, boundaries, and semantics
- material architecture decisions
- final product direction and release/distribution decisions

### Agent owns

Once the user has authorized a bounded change, execute ordinary local engineering decisions autonomously, including:

- locating the relevant implementation
- deriving proportional observable acceptance criteria from clear intent
- choosing local code structure and reuse strategy
- making small behavior-preserving refactors required by the change
- selecting verification depth from realistic risk
- removing superseded local implementation paths

Do not ask for approval for routine implementation details.

Evidence, best practices, or agent preference may justify a recommendation, but they do **not** authorize product scope expansion, new product semantics, or a material architecture change. Surface the decision when user authority is required.

## 2. Canonical lifecycle

There is one execution lifecycle:

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

### UNDERSTAND

Separate, when relevant:

- the problem
- the user's proposed solution
- the explicit requirement

Do not replace an explicit requirement with an unsolicited product recommendation. Surface contradictions or missing material decisions instead of silently inventing them.

### BOUND

Determine the smallest product/code surface needed for the request.

- inspect existing code and patterns only as far as needed to implement safely
- do not require repo-wide reconnaissance, broad audit, bottleneck analysis, P0/P1 inventory, metrics review, or architecture review for an ordinary bounded task
- expand inspection only when dependencies, risk, or uncertainty materially require it
- do not pull adjacent cleanup/features into the work item
- keep WIP at **1 logical change** whenever practical

### SPECIFY

Make the expected observable outcome explicit enough to implement and verify.

- derive concise acceptance criteria when the request is already clear
- use a requirement note only when it reduces meaningful ambiguity
- do not require a mini-PRD, fixed acceptance-criteria count, or planning artifact for trivial/bounded work
- if remaining ambiguity changes product scope, semantics, destructive behavior, permissions/privacy, public contracts, or material architecture, surface it

### DESIGN

Use the smallest design that satisfies the current requirement while preserving existing system boundaries.

Prefer, in order:

1. reuse an existing pattern
2. extend the component/module that already owns the behavior
3. add a small local abstraction when current duplication or volatility justifies it
4. add a new component/module when ownership genuinely requires it
5. change architecture only when the existing architecture cannot reasonably satisfy the requirement

When multiple designs work, prefer lower coupling, smaller change surface, fewer dependencies/abstractions, lower migration cost, easier reversibility, and clearer ownership.

Material changes to product semantics, public contracts, data ownership, service/runtime boundaries, communication patterns, consistency model, infrastructure, privacy posture, or permission surface require explicit user approval unless the request already authorizes that decision.

### IMPLEMENT

Implement the minimum coherent change.

- preserve required and unrelated behavior
- keep ownership clear and dependencies intentional
- follow repository conventions
- avoid unrelated refactoring, renaming, reorganization, dependency upgrades, or speculative flexibility
- before removing or renaming an interaction, contract, identifier, or behavior, search the bounded surface for callers/tests/fixtures that depend on it
- migrate current callers before deleting a replaced path
- remove obsolete code/styles/shims created or superseded by the change once migration is complete and behavior is verified
- prefer the repository formatter/tooling instead of manually approximating generated output

### VERIFY

Choose verification from realistic failure risk, signal, and cost.

Prefer the fastest deterministic feedback available before using remote CI as the first debugger. For a non-trivial change, use a bounded preflight based on the changed surface:

1. affected tests/fixtures or a direct acceptance check
2. type checking when types/contracts/call sites changed
3. formatter and relevant lint/static checks on touched files when tooling supports them

Do not run a full local suite as ritual when focused checks provide equivalent confidence; mandatory integration gates still run afterward.

### QUALITY GATES

Pass repository-mandated integration checks plus risk-specific checks justified by the change.

Running an existing CI suite does not imply that every change needed new tests. Remote CI is an integration gate, not the preferred place to discover cheap deterministic failures that local tooling could catch first.

### RELEASE READY

A change is release-ready when:

- the authorized outcome is satisfied
- the change is coherent
- relevant focused verification passed
- mandatory/risk-specific gates passed
- no known in-scope blocker remains

Release-ready is not the same as released/distributed. Actual release follows explicit user intent or an already-established release policy/automation.

### STOP

Once the authorized outcome is satisfied and justified gates pass, stop.

Do not continue into adjacent features, speculative refactors, extra abstractions, redundant tests, instrumentation, metrics, documentation, or polish that does not materially reduce current delivery risk.

## 3. Codebase quality rule

Optimize for the **smallest correct, clear, maintainable change**. Code quality supports delivery; it is not ceremony.

### Core invariants

For every implementation:

- preserve required behavior
- keep ownership clear
- keep dependencies intentional
- follow existing repository conventions
- prefer the simplest reasonable design
- avoid unnecessary abstractions and dependencies
- avoid unrelated refactoring
- remove dead code created or made obsolete by the change
- keep the change surface proportional to the requirement

Structure code by:

```text
behavior -> ownership -> boundary -> module/package -> file
```

Do not design directory trees first and force behavior into them. Split modules only when it improves ownership, navigation, dependency boundaries, or independent changeability. Avoid meaningless dumping grounds such as generic `utils`, `helpers`, or `common` without clear ownership.

Prefer plain data, explicit control flow, pure functions where useful, and types/contracts over framework machinery. SOLID/DRY are reasoning tools, not abstraction quotas. Remove duplicated knowledge, not every repeated line.

## 4. Testing principle: risk, signal, cost

Tests exist to reduce **meaningful delivery risk**, not to maximize test count, coverage, or enforce TDD ceremony.

Use TDD when a deterministic automated test is the **cheapest high-signal** way to define or protect behavior. A useful loop is:

```text
reproduce / focused failing test or fixture
 -> minimum implementation
 -> green focused test
 -> refactor while green
```

That loop is a tool, not a mandatory ritual.

Do **not** require TDD for:

- presentation-only changes
- styling/layout
- static markup
- copy
- trivial wiring
- exploratory implementation

Prioritize automated tests for:

- semantic/domain invariants
- persistence/data integrity
- concurrency
- migrations
- security/privacy boundaries
- provider/external contracts
- valuable deterministic regressions

Prefer public behavior, invariants, failure modes, and boundaries over private implementation details. Avoid duplicated confidence across unit/integration/browser layers; add a layer only when it protects a distinct realistic risk.

For every proposed test ask:

> **What realistic regression does this prevent?**

If there is no strong answer, do not add it.

Never normalize flaky tests by repeatedly rerunning until green. Treat flakiness as a delivery defect.

## 5. Code documentation rule

Prefer code that explains itself through clear naming, ownership, types, contracts, and structure.

Document **WHY**, constraints, invariants, and non-obvious behavior. Do not document WHAT when the code already expresses it clearly.

Document when the knowledge cannot be reliably reconstructed from implementation alone, especially:

- public APIs and externally consumed contracts
- semantic/domain invariants
- non-obvious architectural constraints
- concurrency assumptions
- consistency guarantees
- security-sensitive or dangerous operational behavior
- compatibility constraints
- intentionally unusual implementation decisions
- workarounds and why they exist

Preference order:

```text
clear code
 -> types/contracts
 -> focused comment
 -> module/package documentation
 -> durable spec/decision record
```

Keep documentation close to its source of truth. When behavior or a durable decision changes, update affected documentation in the same logical change. Delete stale documentation instead of preserving historical noise; preserve decision history only when it remains necessary to understand current constraints.

## 6. OSS and dependency rule

Every dependency is code we operate but do not fully control.

Before adding one, evaluate:

1. **Necessity** — can the current requirement be solved clearly with the platform or existing dependencies?
2. **Scope** — is the dependency proportional to the capability being added?
3. **Ownership** — who now owns upgrades, failures, configuration, and operational behavior?
4. **Health** — is it maintained, stable, documented, and compatible with the repository/runtime?
5. **Security/privacy** — does it expand attack surface, permissions, data exposure, supply-chain risk, or secret handling?
6. **Runtime/build cost** — startup, memory, bundle size, build time, transitive tree, native tooling, deployment friction.
7. **License/redistribution** — is the license compatible with intended use and distribution?
8. **Exit cost** — can it be removed/replaced without rewriting unrelated architecture?

Prefer existing dependencies and platform primitives when they are sufficient. Do not add a dependency merely to avoid a few clear lines of local code, and do not build a large custom subsystem where a mature dependency solves the current problem better.

Pin/lock dependencies using repository conventions. Avoid overlapping libraries that solve the same concern unless coexistence has a concrete current justification.

## 7. Metrics, instrumentation, and product learning

Metrics diagnose a question; they are not a default deliverable and do not score the agent/developer.

- do not require delivery-metric analysis before ordinary coding tasks
- do not add product instrumentation by default
- before a meaningful release, determine whether instrumentation/evidence is actually necessary to evaluate the expected outcome
- prefer existing evidence, deterministic fixtures, privacy-safe observation, or a trusted beta when sufficient
- never introduce invasive telemetry merely to satisfy a process rule

When explicitly investigating delivery performance, useful metrics include change cycle time, CI feedback time, WIP age, rework/change-failure rate, escaped defects, flaky-test rate, and release frequency. Collect only what answers the current question.

After actual release or meaningful real-world use, evidence may support a recommendation to **keep, iterate, revert, remove, or investigate**. The user owns the final product decision.

## 8. Feature Compass

Feature Compass is an orientation layer, not a second lifecycle.

When continuity or complexity makes orientation useful, externalize only enough state to answer:

- What will this feature look and behave like?
- What is changing from the current state?
- Where are we in the iteration?
- What is already done?
- What is currently being worked on?
- What is the single next meaningful action?

Use this compact mental model:

```text
Feature Shape -> Current Position -> Delta -> Next Move
```

For CodeFlow, `.agent/plan.md` is the preferred short-lived Feature Compass surface. Do not duplicate the same status into multiple files or restate the full specification after every change.

## 9. Retrospective rule

Retrospectives exist to improve the delivery system from evidence. They are not ceremonies, status reports, or brainstorming exercises.

Run one when:

- an iteration/release finishes and there is meaningful learning
- delivery was materially slower than expected
- significant rework occurred
- a production failure or repeated defect occurred
- the same engineering friction appears repeatedly
- the user explicitly requests one

Do not run one after every trivial change.

Use the loop:

```text
Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify
```

Evidence may include requirement churn, PR/review cycles, CI failures, test failures/flakiness, build/deploy failures, incidents, repeated debugging, unnecessary abstractions/dependencies, waiting/blocking time, duplicated work, agent/tool loops, context/token waste, user corrections, and acceptance failures.

Choose the **smallest process/tool/code improvement** likely to remove the observed bottleneck. Do not convert a retrospective into a broad process rewrite.

## 10. Git/integration behavior

Branches and PRs are integration tools, not productivity metrics or mandatory ceremony in the abstract. Follow repository protection and established CodeFlow workflow.

For CodeFlow implementation work, the current repository convention is:

```text
master -> feat|fix|chore/<task> -> work/verify/review/fix on same branch -> PR -> squash merge
```

- one coherent task normally keeps one branch/PR identity through CI and review fixes
- do not create retry/final/review-fix branches for the same task
- keep unrelated cleanup out of the PR
- do not claim CI, review, merge, release, deployment, or observation unless actually observed

## 11. Stop and surface a decision when

Stop and ask for the user's product/architecture decision when:

- the request conflicts with an existing locked product invariant
- fulfilling it requires an unapproved material product-scope or product-semantics change
- a destructive/breaking persisted-data decision is required but not authorized
- a new privacy/network/permission boundary or material architecture change is required but not authorized
- a public/cross-context contract must change materially beyond the requested scope

Do not use these stop conditions to block ordinary local engineering decisions.

## 12. Completion condition

A logical change is complete when:

1. the authorized user/engineering outcome is satisfied
2. the acceptance criteria needed for this change are met
3. superseded local code/path is removed when safe
4. relevant focused verification passes
5. mandatory integration/risk gates pass
6. architecture/product documentation is updated only if its source of truth actually changed
7. no unresolved in-scope blocker remains

Then stop. Finished history belongs primarily in Git/PR/release records, not permanent agent process artifacts.
