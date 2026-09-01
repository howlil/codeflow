# CodeFlow SWE Agent Operating Rules

This file is the canonical repository-local operating policy for software/product engineering work in CodeFlow.

The goal is fast, autonomous, evidence-driven delivery without surrendering product or architecture control. Planning happens at **milestone boundaries**; execution proceeds continuously through approved slices; integration happens at **logical-change boundaries**.

## 1. Canonical lifecycle

```text
USER INTENT
 -> UNDERSTAND
 -> BOUND
 -> MILESTONE PLAN
 -> EXECUTE SLICES CONTINUOUSLY
 -> MILESTONE GATE
 -> RELEASE READY
 -> STOP
```

Inside a slice, use the normal engineering loop only as much as needed:

```text
SPECIFY -> DESIGN -> IMPLEMENT -> VERIFY -> INTEGRATE
```

Small, unambiguous work may fuse these stages. Do not turn lifecycle labels into ceremony.

## 2. Work hierarchy

```text
Milestone -> Slice -> Logical Change -> Commit
```

### Milestone

A bounded, meaningful product, engineering, reliability, migration, or release outcome worth planning as a whole.

A milestone plan defines:

- WHY the milestone exists
- desired observable outcome
- scope and non-goals
- material product/architecture boundaries
- slices needed to reach the outcome
- milestone exit criteria
- milestone-level verification when relevant

Plan once at the milestone boundary. Do not create a new sprint plan or request approval between already-approved slices unless scope or a material decision changes.

### Slice

A coherent vertical increment that moves the milestone toward its outcome and can be verified independently.

Prefer end-to-end behavior over horizontal scaffolding. A slice may contain several logical changes if that is the clearest low-risk path.

### Logical Change

The smallest independently understandable, verifiable, and integratable code/documentation change.

Integrate logical changes when verified instead of accumulating a large milestone branch.

### Commit

A local history unit. Commit count is not a productivity metric and does not define product scope.

## 3. Product authority

### User owns

- WHY
- WHAT product behavior/capability is wanted
- product scope and semantics
- architecture boundaries
- acceptance criteria for material/product behavior
- public contracts
- data ownership
- security/privacy/permission boundaries
- material technical decisions
- final release/product direction

### Agent owns

Within an approved boundary, execute autonomously:

- repository inspection
- implementation design within existing boundaries
- code changes
- tests and fixtures
- debugging
- focused local refactoring required by the change
- implementation-level decisions
- verification and quality gates
- integration mechanics allowed by repository policy

Do not ask for approval for routine implementation details.

Best practices, metrics, optimization ideas, or agent preference do not authorize product scope expansion.

## 4. Understand and bound first

Before changing code:

1. distinguish the underlying problem from a proposed implementation when relevant;
2. identify the explicit authorized outcome;
3. inspect only enough repository context to find the existing owner and dependencies;
4. bound the smallest coherent change surface.

Do not require repo-wide reconnaissance, architecture audits, P0/P1 inventories, metrics reviews, or planning documents for ordinary bounded work.

Expand inspection only when risk, dependency, or uncertainty materially requires it.

## 5. Minimum-change rule

Optimize for the **smallest correct, clear, maintainable change**.

Prefer:

```text
reuse existing pattern
 -> extend current owner
 -> small local abstraction
 -> new component/module
 -> architecture change
```

The later choices require stronger evidence that the earlier choices are insufficient.

Avoid unless required by the authorized outcome:

- unrelated refactors or renames
- directory/package reorganization
- speculative abstractions
- future-proofing without current need
- dependency upgrades
- new infrastructure
- behavior changes outside scope
- duplicate implementation paths left behind after migration

Keep ownership clear and dependencies intentional.

## 6. Material-decision boundary

Stop and surface a user decision if implementation requires an unapproved change to any of these:

- product semantics or scope
- public/cross-context contracts
- persisted-data shape with destructive/breaking consequences
- data ownership
- service/runtime boundaries
- communication or consistency model
- security/privacy/permission/network boundaries
- material infrastructure or architecture

Do not use this rule to block routine local engineering decisions.

## 7. Continuous slice execution

Once a milestone and its slices are approved:

```text
select next slice
 -> bound next logical change
 -> implement
 -> focused verify
 -> integrate when green
 -> update CURRENT_ITERATION.md
 -> continue to next approved logical change/slice
```

Do **not** stop for artificial sprint boundaries.

Do **not** create Sprint N+1, iteration branches, milestone branches, or stacked feature branches merely because the next approved slice begins.

Only return to milestone planning when:

- the milestone outcome/scope materially changes;
- a new material architecture/product decision appears;
- evidence invalidates the planned approach;
- the milestone reaches its gate.

Increase the planning horizon, not the integration batch size.

## 8. Verification principle

Verification is proportional to realistic risk, signal, and cost.

Prefer the cheapest deterministic feedback before remote CI.

Typical order:

1. direct acceptance check or affected tests/fixtures;
2. type checking when contracts/types/call sites changed;
3. format/lint/static checks for touched surfaces;
4. build/integration/browser checks when the risk requires them;
5. repository-mandated CI/integration gates.

Use TDD when a failing executable test is the cheapest high-signal way to define or protect behavior. TDD is a tool, not a ritual.

Every proposed test should answer:

> What realistic regression does this prevent?

Do not normalize flaky tests by rerunning until green.

Detailed CodeFlow commands and risk tiers live in `.agent/DEVELOPMENT.md`.

## 9. Integration behavior

`master` is the integration branch.

Use trunk-oriented delivery:

- short-lived branch from current `master` when a branch is useful/required;
- one focused logical change or tightly coherent set of changes;
- verify current head;
- open a focused PR when repository workflow calls for one;
- merge promptly when green and approved;
- prefer squash merge;
- delete/abandon the short-lived branch after integration.

Do not use milestone/sprint branches. Do not stack the next slice on an unmerged feature branch. CI/review fixes stay on the same short-lived branch.

For already-approved non-material work, use repository-supported auto-merge when appropriate rather than waiting for another ceremony step.

Full Git guidance lives in `.agent/GIT_STRATEGY.md`.

## 10. Active iteration state

`.agent/CURRENT_ITERATION.md` is the canonical live execution state.

It must let another agent determine, without chat history:

- what milestone is active;
- why it exists;
- what is in/out of scope;
- which slice/logical change is active;
- what is already integrated;
- what verified work is pending integration;
- what evidence exists;
- the single next meaningful action.

Keep it concise. It is state, not a diary.

Update it when execution position materially changes. Do not create ceremonial checkpoint/start/close commits.

## 11. Feature Compass

Feature Compass is an orientation layer, not another lifecycle.

Use:

```text
Feature Shape -> Current Position -> Delta -> Next Move
```

`CURRENT_ITERATION.md` should expose these four ideas compactly whenever they help orientation.

Do not restate the full requirement/specification after every change.

## 12. Code quality

Core invariants:

- preserve required and unrelated behavior;
- follow current repository conventions;
- structure by behavior, ownership, and boundary before file/directory shape;
- prefer explicit control flow and plain data over framework machinery;
- avoid generic `utils`/`helpers` dumping grounds without ownership;
- remove dead/superseded local code once migration is verified;
- keep the change surface proportional to the requirement.

SOLID, DRY, KISS, and YAGNI are reasoning tools, not abstraction quotas.

CodeFlow-specific implementation patterns live in `.agent/CODE_PATTERNS.md`.

## 13. Documentation and dependency rules

Prefer self-explanatory code. Document WHY, constraints, invariants, compatibility, and non-obvious behavior rather than narrating obvious code.

Update durable documentation in the same logical change only when its source of truth changed.

Every new dependency must justify current necessity, scope, ownership, maintenance health, security/privacy impact, runtime/build cost, licensing, and exit cost. Prefer existing dependencies/platform primitives when sufficient.

## 14. Metrics and instrumentation

Metrics answer a question; they are not default deliverables or developer scores.

Do not require metrics analysis or add telemetry before ordinary implementation work.

When explicitly diagnosing delivery, useful evidence may include cycle time, CI feedback time, WIP age, rework/change-failure rate, escaped defects, flaky-test rate, and release frequency.

Collect only what answers the current question.

## 15. Retrospective rule

Run a retrospective only when there is meaningful evidence to learn from, including:

- milestone/release completion with useful learning;
- materially slow delivery;
- significant rework;
- production failure or repeated defect;
- repeated engineering friction;
- explicit user request.

Use:

```text
Evidence -> Bottleneck -> Root Cause -> Small Improvement -> Verify
```

Choose the smallest delivery-system improvement likely to remove the observed bottleneck. Do not convert a retrospective into a broad workflow rewrite.

## 16. Milestone gate

A milestone is complete when:

- all required slices are integrated;
- milestone exit criteria are satisfied;
- required milestone-level verification passes;
- no known in-scope blocker remains;
- durable product/architecture truth is updated where it actually changed.

Then declare `RELEASE READY` and stop unless an established release policy or explicit user request authorizes release/deployment.

## 17. Completion and stop

A logical change is complete when the authorized outcome for that change is satisfied, superseded local paths are removed when safe, focused verification passes, and mandatory/risk-specific integration gates pass.

A milestone is complete only at the milestone gate above.

When the authorized outcome and justified gates are satisfied: **STOP**. Do not continue into adjacent features, speculative polish, extra abstractions, redundant tests, instrumentation, or documentation that does not materially reduce current risk.
