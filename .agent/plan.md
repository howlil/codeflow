# CodeFlow Engineering Roadmap

## Current State

M0 repository foundation is implemented and verified. The repository now has an executable TypeScript pnpm workspace, a Fastify health slice, a React/Vite smoke page, local quality gates, and GitHub Actions CI.

Architecture source of truth:

- `AGENTS.md` — engineering/architecture policy
- `.agent/specs/2026-08-25-codeflow-foundation-design.md` — approved product/architecture design
- `.agent/plans/2026-08-25-foundation-implementation.md` — milestone execution plan

## Product North Star

Turn an unfamiliar repository into a trustworthy interactive semantic map:

```text
repository
  -> architecture
  -> flow
  -> data/state
  -> dependencies
  -> evidence/source
  -> optional runtime evidence
  -> optional grounded AI explanation
```

## Current Architecture Decision

```text
React/Vite canvas
      |
      v
Fastify API
      |
      v
analysis-core
      |
      +-> discovery
      +-> language/framework/infra adapters
      +-> universal semantic IR
      +-> evidence provenance
      +-> derived projections
```

Initial implementation is a TypeScript modular monolith. `@xyflow/react` is the default canvas layer. Use TypeScript semantic tooling and Tree-sitter pragmatically. No graph database, Redis, queue, microservices, Kubernetes, or LLM critical path by default.

## Milestone Ledger

| Milestone | Goal | State |
|---|---|---|
| M0 | executable monorepo + CI quality gates | DONE |
| M1 | TypeScript full-stack fixture -> semantic flow -> interactive canvas -> evidence inspector | NEXT |
| M2 | focus/filter/search/source comprehension UX | PLANNED |
| M3 | data-flow lens + static simulation | PLANNED |
| M4 | Go adapter proves language-agnostic IR | PLANNED |
| M5 | multi-application repository/system view | PLANNED |
| M6 | infrastructure semantics | PLANNED |
| M7 | grounded AI explanation layer | PLANNED |
| M8 | runtime evidence/tracing spike | PLANNED |

## Immediate Next State

Create a separate M1 design and iteration pass:

```text
fixture TypeScript full-stack repository
  -> deterministic semantic IR subset
  -> API projection
  -> interactive canvas
  -> evidence inspector
```

M1 should build on the M0 workspace without backfilling broad product complexity. Keep the slice small enough to prove one trustworthy semantic flow with source/evidence before expanding language support, persistence, runtime tracing, or AI explanation.

## M1 Evidence of Success

The first meaningful product increment is complete only when a developer can:

1. run CodeFlow locally
2. analyze a tiny TypeScript frontend/backend fixture
3. see a bounded semantic request flow on the canvas
4. select a node
5. inspect the source/evidence supporting that relationship
6. distinguish verified from inferred evidence

No AI is required for this success criterion.

## Guardrails

Before adding infrastructure or abstraction, prove the current milestone cannot be completed cleanly without it.

Never solve “eventually all languages/projects” by expanding the current milestone. Long-term breadth comes from adapter contracts and the universal IR; delivery remains one verified vertical slice at a time.
