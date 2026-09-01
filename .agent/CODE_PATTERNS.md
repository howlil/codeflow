# CodeFlow Code Patterns

This file captures repository-specific implementation patterns. It is not a generic style guide and must not override actual code when implementation has evolved.

## Ownership first

Choose the owner before choosing the file shape:

```text
behavior -> owner -> boundary -> module -> file
```

Current high-level ownership:

```text
apps/web             UI workspace, interaction, semantic projections rendered for users
apps/api             HTTP boundary and orchestration
packages/analysis-core
                     semantic IR, analyzers, evidence, graph/projection derivation
```

Prefer extending an existing owner before creating another package or cross-cutting abstraction.

## Semantic core boundaries

The semantic model is the core product boundary.

- analyzer/framework-specific objects should not leak into stable consumer contracts when the IR can own the concept;
- UI code consumes semantic/API projections and must not become a source-code parser;
- AI explanation, when introduced, consumes grounded graph/evidence context and must not create canonical graph edges;
- static and runtime evidence retain distinct provenance.

## Evidence pattern

When a relationship/entity can be uncertain, preserve enough information to identify:

- semantic source/target or entity identity;
- evidence class;
- analyzer/config/runtime origin;
- supporting source location/range or runtime reference;
- human-readable reason when useful.

Use existing evidence kinds instead of inventing ad-hoc confidence semantics:

```text
verified-static
inferred-static
configured
observed-runtime
user-asserted
```

Never silently fall back from missing evidence to an inferred evidence class merely to make UI data look complete.

## Adapter pattern

Adapters are narrow capability providers, not mini-platforms.

Prefer small capability boundaries such as:

```text
parse
extract symbols
resolve references
extract calls/types/control/data/imports
```

An adapter may support only a subset. Unsupported capability should remain explicit rather than simulated.

Framework/infra semantics extend the shared IR rather than creating language-specific UI branches.

## TypeScript style

Prefer:

- strict types and discriminated unions for semantic states;
- plain data structures and explicit control flow;
- pure functions where they improve deterministic analysis;
- direct imports and clear ownership;
- existing workspace package contracts;
- exhaustive handling where semantic state variants matter.

Avoid by default:

- generic repository/service/controller layers for every feature;
- DI containers/factory frameworks without a concrete need;
- command/mediator buses for ordinary local flow;
- catch-all `utils`, `helpers`, or `common` directories without ownership;
- speculative interfaces wrapping one stable implementation.

## UI/state pattern

The canvas is a projection of semantic state, not canonical domain state.

- preserve canonical semantic IDs when mapping to view nodes/edges;
- selection/focus/search/source-split are view/inspection state;
- view state must not mutate semantic evidence;
- missing/partial/error states should remain explicit rather than being fabricated into complete data;
- verified vs inferred semantics must not rely on color alone;
- native accessible controls are preferred for primary interaction when practical.

Use root `DESIGN.md` for visual/interaction language.

## Change pattern

For an ordinary feature slice:

1. locate the existing owner;
2. extend the smallest coherent path;
3. protect the realistic regression at the most useful boundary;
4. migrate current callers if a path changes;
5. remove the superseded local path once verified;
6. avoid unrelated cleanup.

A small explicit module is preferred over an internal framework.

## Dependency pattern

Prefer in order:

```text
platform/existing dependency
 -> small local implementation
 -> new mature dependency with current justification
```

Do not add parsing, graph, state, persistence, infrastructure, or AI dependencies merely for hypothetical future capability.

## Performance pattern

Measure before changing architecture.

Prefer optimization in this order when evidence points to a real bottleneck:

1. ignore irrelevant/generated/dependency inputs;
2. incremental/cache-by-content analysis;
3. bounded graph projections;
4. lazy source/inspector loading;
5. CPU isolation for parsing/resolution;
6. renderer specialization only when measured necessary.

Do not introduce distributed analysis solely because repositories can theoretically become large.
