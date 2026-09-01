# CodeFlow Agent Entry Point

This file is the progressive entry point for engineering agents. Detailed policy lives in `.agent/` and durable product/design truth lives in its owning sources.

## Start here

Read only what the current task requires:

1. `.agent/AGENTS.md` — canonical SWE operating rules.
2. `.agent/CURRENT_ITERATION.md` — canonical live milestone/slice state when working on active milestone scope.
3. Load the relevant concern-specific source:
   - `.agent/PROJECT.md` — concise durable project truth.
   - `.agent/requirements/` — detailed product outcomes, acceptance, non-goals.
   - `.agent/specs/` — material architecture/system decisions.
   - `DESIGN.md` — durable visual/interaction/workspace language.
   - `.agent/DEVELOPMENT.md` — commands and verification.
   - `.agent/CODE_PATTERNS.md` — repository-specific implementation patterns.
   - `.agent/GIT_STRATEGY.md` — branch/PR/integration rules.

Do not load the whole repository or agent tree by default. Expand context only when dependencies, risk, or uncertainty require it.

## Canonical delivery model

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

Work hierarchy:

```text
Milestone -> Slice -> Logical Change -> Commit
```

Plan at milestone boundaries. Execute already-approved slices continuously. Integrate at logical-change boundaries.

Do not create a new sprint plan, sprint branch, milestone branch, or stacked branch for every slice. Use short-lived trunk-oriented integration from current `master` and merge verified logical changes promptly.

`.agent/AGENTS.md` is normative if this summary is incomplete.

## Authority

The user owns WHY, WHAT, product semantics/scope, architecture boundaries, acceptance/public contracts, data ownership, security/privacy boundaries, material technical decisions, and final release direction.

The agent owns ordinary bounded implementation: repository inspection, local design, coding, tests, debugging, required local refactoring, verification, and integration mechanics allowed by repository policy.

Do not ask for approval for routine implementation details. Do not use best practices or optimization ideas as authorization to expand product scope.

## Minimum change

Prefer:

```text
reuse existing pattern
 -> extend current owner
 -> small local abstraction
 -> new component/module
 -> architecture change
```

Choose the smallest correct, clear, maintainable design. Avoid unrelated refactors, speculative abstractions, future-proofing, dependency churn, and behavior outside the authorized outcome.

Surface a user decision before crossing a material product, public-contract, persisted-data, data-ownership, security/privacy/permission/network, service/runtime, consistency, infrastructure, or architecture boundary.

## CodeFlow mission

CodeFlow turns a software repository into an evidence-backed semantic map of architecture, execution flow, data/state movement, dependencies, failures, infrastructure, and supporting source evidence.

```text
repository model = canonical truth
canvas = projection
AI = optional grounded explanation
```

## Locked CodeFlow invariants

Preserve these unless a material change is explicitly authorized:

1. **Evidence before explanation.** Deterministic/static/configured/runtime evidence precedes LLM interpretation.
2. **Universal semantic IR.** Language/framework/infra/runtime adapters converge on one shared semantic model.
3. **Truthful uncertainty.** Verified, inferred, configured, runtime-observed, and user-asserted relationships remain distinguishable.
4. **Canvas is not canonical state.** UI layout/grouping/selection does not define repository truth.
5. **Static analysis works without executing untrusted code.** Runtime execution/tracing is a separate sandboxed capability.
6. **Pragmatic modular monolith first.** Do not introduce distributed infrastructure without measured current need and authorized scope.
7. **Progressive semantic disclosure.** System meaning precedes modules, symbols, flow, and source evidence.
8. **Private repository data is confidential.** Minimize source exposure in logs, telemetry, prompts, traces, errors, and client payloads.

Detailed project truth is in `.agent/PROJECT.md` and durable architecture in the owning spec.

## Current repository shape

```text
apps/
  web/
  api/
packages/
  analysis-core/
```

Use the existing owner before creating another package. A local module is cheaper than a package; a package is cheaper than a service.

## Verification

Use risk-proportional verification. Prefer focused deterministic feedback before remote CI. `pnpm check` is the repository-wide integration gate; exact commands and risk tiers are in `.agent/DEVELOPMENT.md`.

Tests protect realistic regressions, not test-count or coverage quotas. TDD is a tool when it is the cheapest high-signal method, not mandatory ceremony.

## Integration

`master` is the integration branch.

For new work, start from current `master`, use a short-lived focused branch when useful/required, keep CI/review fixes on that branch, and squash-merge promptly when green/approved. Do not stack the next approved slice on an unmerged feature branch.

The existing M2 PR #5-#8 stack predates this rule and is migration debt, not the future pattern. Current position is recorded in `.agent/CURRENT_ITERATION.md`.

## Stop condition

When the authorized logical change is satisfied and justified verification/integration gates pass, stop that change and continue only to the next already-approved slice.

When all milestone slices are integrated and milestone exit criteria pass, declare `RELEASE READY` and stop unless release/deployment is already authorized.

Do not continue into adjacent features, speculative polish, extra abstractions, redundant tests, instrumentation, or documentation without current justification.
