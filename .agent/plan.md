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

M1 is implemented and release-ready on PR #2:

- one tiny TypeScript request-flow fixture is analyzed with the TypeScript compiler API
- top-level functions become deterministic semantic entities
- direct symbol-resolved calls are labeled `verified-static`
- local function-alias calls are explicitly labeled `inferred-static`
- every projected call carries source location, analyzer provenance, and a human-readable evidence reason
- `GET /api/flows/sample` exposes the bounded flow projection
- the web workspace renders repository context, an interactive semantic flow, and a source/evidence inspector
- selecting a function reveals its source range and related call evidence
- solid vs dashed relationship styling keeps verified and inferred evidence visibly distinct
- pnpm workspace dependency/build ordering supports `apps/api -> @codeflow/analysis-core`
- the pnpm lockfile is synchronized with the new workspace dependencies
- the normal read-only CI path passes `pnpm install --frozen-lockfile` and `pnpm check`

The temporary CI-only lock/format helpers used because the connected environment could not run repository commands locally have been removed. The repository workflow is restored to its normal read-only frozen-lock verification path.

## Delta

There is no remaining implementation delta for the authorized M1 slice.

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

PR #2 remains the integration boundary. Merging or releasing it is a separate user-owned integration/product decision.

## Next Move

**STOP this iteration.**

Do not start a second language, AI layer, persistence system, runtime sandbox, renderer/platform expansion, or adjacent product feature without a new authorized product decision.
