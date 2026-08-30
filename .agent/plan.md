# CodeFlow Feature Compass

## Feature Shape

M1 makes CodeFlow useful for one narrow, trustworthy developer journey:

```text
tiny TypeScript repository
 -> deterministic analysis
 -> evidence-backed semantic IR
 -> bounded request-flow projection
 -> canvas rendering
 -> selectable source/evidence
```

The user can see one real request flow, inspect the functions involved, distinguish verified from inferred relationships, and inspect the source/evidence supporting CodeFlow's claim.

## Current Position

M1 is implemented on PR #2:

- one tiny TypeScript request-flow fixture is analyzed with the TypeScript compiler API
- top-level functions become deterministic semantic entities
- direct symbol-resolved calls are labeled `verified-static`
- local function-alias calls are explicitly labeled `inferred-static`
- every projected call carries source location, analyzer provenance, and a human-readable evidence reason
- `GET /api/flows/sample` exposes the bounded flow projection
- the web workspace renders repository context, an interactive semantic flow, and a source/evidence inspector
- selecting a function reveals its source range and related call evidence
- solid vs dashed relationship styling keeps verified and inferred evidence visibly distinct
- pnpm workspace dependency/build ordering now supports `apps/api -> @codeflow/analysis-core`
- the pnpm lockfile is synchronized with the new workspace dependencies

The temporary CI-only lock/format helpers used because the connected environment could not run repository commands locally have been removed. The repository workflow is back to its normal read-only frozen-lock verification path.

## Delta

The requested M1 product behavior is implemented. The remaining iteration delta is integration evidence only:

- standard CI must pass on the final branch head using `pnpm install --frozen-lockfile` + `pnpm check`
- PR #2 remains the integration boundary; merging/releasing it is a product/integration decision, not part of ordinary local implementation

The M1 non-goals remain unchanged:

- AI explanation
- auth/multi-user SaaS behavior
- persistence/graph database
- queue/Redis
- runtime execution/tracing
- multi-language support
- generic plugin platform
- broad design-system work
- speculative scale infrastructure

## Next Move

If final standard CI is green, M1 is release-ready and this iteration stops.

Do not start a second language, AI layer, persistence system, runtime sandbox, renderer/platform expansion, or adjacent product feature without a new authorized product decision.
