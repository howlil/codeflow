# CodeFlow Feature Compass

## Feature Shape

M1 should make CodeFlow useful for one narrow, trustworthy developer journey:

```text
tiny TypeScript repository
 -> deterministic analysis
 -> evidence-backed semantic IR
 -> bounded request-flow projection
 -> canvas rendering
 -> selectable source/evidence
```

The user should be able to see one real execution relationship, understand what CodeFlow believes, and inspect why it believes it. Verified and inferred evidence must remain visibly distinct.

## Current Position

M0 is implemented on PR #2:

- executable pnpm/TypeScript workspace
- Fastify API shell
- React/Vite web shell
- `analysis-core` package
- tests + lint/type/build checks
- GitHub Actions CI
- durable product/foundation design context preserved
- engineering workflow aligned to the canonical agent lifecycle in `.agent/rules.md`

The foundation exists, but CodeFlow still has no end-to-end semantic understanding slice that delivers the core product value.

## Delta

To reach M1, the missing product behavior is:

- analyze one tiny TypeScript fixture
- emit the minimum semantic entities/relationships needed for one request flow
- attach evidence provenance to uncertain relationships
- expose one bounded flow projection through the API
- render the projection in the web UI
- allow selection to reveal supporting source/evidence
- visibly distinguish verified vs inferred evidence

Explicit non-goals for this slice:

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

Finish PR #2 cleanly, then implement **one M1 vertical slice** from fixture to evidence inspector using the smallest existing ownership/patterns.

Acceptance for that next slice:

1. one tiny TypeScript fixture can be analyzed deterministically
2. minimal semantic IR + provenance is produced
3. one bounded flow projection is returned by the API
4. the web UI renders it
5. selecting a rendered element exposes supporting source/evidence
6. verified vs inferred evidence is distinguishable
7. focused regression checks + mandatory repository gates pass

Do not start a second language, AI layer, persistence system, runtime sandbox, or architecture expansion before this slice proves the core contract.
