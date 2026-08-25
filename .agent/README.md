# CodeFlow Agent Workspace

`.agent/` stores only execution context that materially helps the next delivery step.

## Source of truth
1. Runtime code + tests
2. `AGENTS.md` engineering rules
3. `.agent/plan.md` current state and next 1-3 vertical slices
4. `.agent/decisions/` rare costly-to-reverse decisions
5. `.agent/checkpoints/` concise continuity evidence when needed

If prose disagrees with working code/tests, update or delete the stale prose.

## Artifact rule
Do **not** create an artifact by default.

Create a decision note only when a choice is expensive to reverse, crosses a stable public/architecture boundary, or has meaningful security/data consequences.

Create a checkpoint only when another session/agent would otherwise need to rediscover important evidence.

Do not create:
- speculative architecture catalogs,
- milestone plans that duplicate the backlog,
- per-command checkpoints,
- design documents for reversible implementation details,
- mirrored source trees under `.agent/`.

## Planning format
For normal work, `.agent/plan.md` should remain short:

```text
Current outcome
Current blocker/risk
Next slice (acceptance criteria)
Later (max 2 items)
```

Delete completed detail rather than letting the plan grow indefinitely.

## Execution loop
```text
observe -> choose smallest valuable slice -> implement -> focused verify -> PR/CI -> merge -> update state only if useful
```

The goal of this workspace is lower rediscovery cost, not more documentation.
