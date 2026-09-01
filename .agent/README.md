# CodeFlow Agent Workspace

`.agent/` externalizes enough repository-local truth and live execution state for an engineering agent to work without reconstructing context from chat history.

Keep this workspace lean. Durable product/system truth and temporary iteration state have different owners.

## Canonical files

```text
.agent/
  AGENTS.md            operating rules and SWE lifecycle
  PROJECT.md           concise durable product/system truth
  CURRENT_ITERATION.md canonical live milestone/slice state
  DEVELOPMENT.md       commands, testing, verification mechanics
  CODE_PATTERNS.md     repository-specific implementation patterns
  GIT_STRATEGY.md      trunk/integration guidance
```

Concern-specific durable sources remain:

```text
.agent/requirements/   detailed product outcomes, acceptance, non-goals
.agent/specs/          material architecture/system decisions
DESIGN.md              durable visual/interaction/workspace language
```

Historical planning/checkpoint directories may remain for decision/history context, but they are **not live iteration state**.

## Source-of-truth hierarchy

Use the owner that matches the question:

- actual implemented behavior: source code + tests
- engineering operating policy: `.agent/AGENTS.md`
- concise durable project context: `.agent/PROJECT.md`
- detailed product roadmap/acceptance: `.agent/requirements/`
- material architecture decisions: `.agent/specs/`
- durable visual/interaction decisions: `DESIGN.md`
- current milestone/slice position: `.agent/CURRENT_ITERATION.md`
- development commands/verification: `.agent/DEVELOPMENT.md`
- implementation conventions: `.agent/CODE_PATTERNS.md`
- Git/integration mechanics: `.agent/GIT_STRATEGY.md`

If implementation and stale temporary prose disagree because work moved forward, update the temporary state. If the disagreement concerns durable product intent or a material architecture decision, surface the conflict rather than silently choosing.

## Read progressively

For ordinary engineering work start with:

1. root `AGENTS.md`;
2. `.agent/CURRENT_ITERATION.md` when the task belongs to active milestone work;
3. only the relevant canonical file for the concern.

Examples:

- product scope/why -> `PROJECT.md` + relevant requirement
- architecture/contracts/security/data ownership -> relevant spec
- local implementation -> `CODE_PATTERNS.md` + source/tests
- commands/gates -> `DEVELOPMENT.md`
- branch/PR/merge -> `GIT_STRATEGY.md`
- durable UI/interaction language -> `DESIGN.md`

Do not load the entire `.agent/` tree or repository by default.

## Current iteration rule

`.agent/CURRENT_ITERATION.md` is the single source of truth for active execution state.

It should make it possible to answer:

```text
active milestone
 -> approved scope/non-goals
 -> active or next slice/logical change
 -> integrated work
 -> verified pending integration
 -> evidence
 -> single next meaningful action
```

Keep it concise. It is not a sprint diary, changelog, or commit log.

Do not duplicate live status into `plan.md`, checkpoints, PR descriptions, and multiple state documents.

## Milestone planning rule

Plan at milestone boundaries, then execute approved slices continuously:

```text
Milestone -> Slice -> Logical Change -> Commit
```

Increase the planning horizon, not the integration batch size.

Do not create a new sprint plan for each slice. Do not create milestone/sprint branches. Integrate verified logical changes continuously according to `.agent/GIT_STRATEGY.md`.

## Durable knowledge rule

Preserve/update durable knowledge when its underlying truth changes:

- product outcomes/scope/acceptance/non-goals
- semantic/domain constraints
- architecture decisions/invariants
- public/API/semantic contracts
- security/privacy/data ownership constraints
- validated durable design decisions

Do not delete durable truth merely because an iteration completed or workflow changed.

## Artifact creation rule

Create/update an artifact only when it owns necessary truth or materially reduces ambiguity/risk/rediscovery.

Do not create specs, plans, checkpoints, retrospectives, or state files as ceremony.

Historical `.agent/plans/` and `.agent/checkpoints/` are not the default surface for new work. New sequencing should normally live as compact milestone/slice state in `CURRENT_ITERATION.md`; create a separate durable spec only for a genuinely material decision.

## Compatibility files

`.agent/rules.md` and `.agent/plan.md` are retained as compatibility pointers for older references. They must not contain an independent competing policy/state.
