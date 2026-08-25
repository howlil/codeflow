# CodeFlow Agent Workspace

`.agent/` separates **durable product knowledge** from **temporary execution workflow**.

## Source of truth
1. Runtime code + tests — actual implemented behavior
2. `.agent/requirements/` — product scope, user journeys, acceptance criteria, non-goals
3. `.agent/specs/` / `.agent/decisions/` — intended architecture and durable decisions
4. `AGENTS.md` — engineering/delivery rules
5. `.agent/plan.md` — current state and next 1-3 vertical slices
6. `.agent/plans/` / `.agent/checkpoints/` — temporary execution context when needed

## Never-delete-by-cleanup rule
Do **not** delete project detail, requirements, user journeys, acceptance criteria, domain constraints, architecture decisions, security constraints, semantic/API contracts, or validated design context merely because:
- an iteration completed,
- implementation moved forward,
- the workflow changed,
- a document is old,
- the team wants fewer process files.

When durable product knowledge becomes outdated, update it or mark it superseded and link to the replacement. Preserve enough history to understand the decision.

## What may be deleted
Legacy workflow/process artifacts may be removed when they no longer help execution, for example:
- duplicated execution plans,
- retry/final/review-fix plans,
- stale checkpoints/status snapshots,
- old process instructions superseded by `AGENTS.md`,
- task sequencing that has no remaining product/architecture information.

Before deleting any document, classify its information:

```text
product/requirement/design knowledge?
  -> preserve or migrate

temporary execution/process only?
  -> safe to delete when stale

mixed document?
  -> migrate durable content first, then delete obsolete workflow shell
```

## Artifact rule
Do not create duplicate documentation by default.

Create/update:
- requirements when product intent/scope/acceptance changes,
- specs/decisions for material architecture, contract, security, or data decisions,
- a temporary plan only when sequencing genuinely reduces execution risk,
- a checkpoint only when another session would otherwise rediscover important evidence.

## Planning format
`.agent/plan.md` remains operational and short:

```text
Current outcome
Current blocker/risk
Next slice (acceptance criteria)
Later (max 2 items)
```

Completed workflow detail can be removed from this file, but any durable requirement discovered during execution must first be moved into `.agent/requirements/`, `.agent/specs/`, or `.agent/decisions/`.

## Execution loop
```text
observe -> choose smallest valuable slice -> implement -> focused verify -> PR/CI -> merge -> update state
```

The goal is low process overhead **without losing product knowledge**.
