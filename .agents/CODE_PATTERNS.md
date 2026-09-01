# CodeFlow Code Patterns

`CODE_PATTERNS.md` stores repository-specific implementation knowledge. Generic SWE behavior belongs to the global agent rules and is not repeated here.

## Repository Ownership

```text
apps/web             user-facing semantic workspace and interaction
apps/api             HTTP transport and orchestration
packages/analysis-core
                     semantic model, analysis, evidence, projection logic
```

When changing behavior, first locate the existing owner above rather than creating a parallel package/layer.

## Semantic Model Pattern

`analysis-core` owns semantic truth.

- UI code consumes semantic/API projections; it does not parse source files.
- API transport must not become the owner of analyzer/domain logic.
- Parser/framework-specific objects stay behind analysis boundaries.
- Future AI explanation consumes grounded semantic/evidence context and does not write canonical relationships directly.

## Evidence Pattern

Use the existing evidence vocabulary:

```text
verified-static
inferred-static
configured
observed-runtime
user-asserted
```

When available, evidence records should preserve analyzer/source provenance, source range/runtime reference, semantic identity, and concise reason.

Do not substitute `inferred-static` when evidence is actually unavailable.

## Deterministic Identity

Semantic IDs should remain deterministic for the same analyzed revision when feasible because selection, projection references, caching/diffing, and evidence links depend on stable identity.

Do not replace stable semantic identity with canvas coordinates or component-local identity.

## Adapter Pattern

Language/framework/infrastructure support extends the shared semantic model.

Adapters expose only capabilities they can establish honestly. Unsupported capability remains explicit rather than emitting fake completeness.

Prefer language-native semantic tooling where it materially improves symbol/reference resolution. Parser AST objects do not become public cross-system contracts.

## Projection Pattern

The canonical semantic graph may be larger than a useful UI view.

Generate bounded, task-specific projections in analysis/domain code and let the UI render those projections.

The web workspace should not reconstruct missing graph semantics itself.

## Web Interaction State

The following are view/inspection state, not domain truth:

- node/relationship selection;
- search query/results;
- focus/neighborhood state;
- source split/inspector expansion;
- visual grouping and layout coordinates.

Changing view state must not mutate semantic evidence or relationship classification.

Explicit partial/error/unavailable states are preferred over synthetic fallback data.

Primary interaction should preserve native accessibility semantics where practical.

See `.agents/DESIGN.md` for durable visual and interaction behavior.

## API Pattern

`apps/api` is a narrow Fastify boundary over analysis functionality.

Keep semantic contracts explicit and parser-agnostic. New HTTP behavior should reuse current domain/projection contracts unless the user has authorized a material public-contract change.

## Testing Location Pattern

Tests currently live close to the behavior they protect:

- `apps/web/src/App.test.tsx` protects workspace behavior;
- `apps/api/src/app.test.ts` protects the API boundary;
- analysis-core tests/fixtures should protect semantic model/analyzer/projection behavior when those surfaces change.

Use small deterministic fixtures when they prove semantic behavior more clearly than a large external repository.

## Known Traps

- Do not let visual completeness turn missing evidence into fabricated semantics.
- Do not put parser-specific shapes into API/UI contracts.
- Do not treat manual canvas position as repository truth.
- Do not execute analyzed repository code as part of ordinary static analysis.
- Do not create language-specific UI architecture when a shared semantic projection can represent the concept.
- Do not introduce a new package solely to organize one small local concern.
