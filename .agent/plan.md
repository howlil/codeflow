# CodeFlow Current State

## Current outcome
M0 is implemented on PR #2: executable pnpm/TypeScript workspace, Fastify API, React/Vite web shell, tests, lint/type/build checks, and GitHub Actions CI.

## Current blocker
The product still has no user-value slice. Shipping more architecture/planning before M1 would increase lead time without increasing product learning.

## Next slice
**M1: one trustworthy TypeScript request flow.**

Acceptance criteria:
- analyze one tiny TypeScript fixture,
- emit a minimal semantic IR with evidence provenance,
- expose one bounded flow projection through the API,
- render that flow in the web UI,
- selecting an element shows supporting source/evidence,
- verified vs inferred evidence is visibly distinct,
- relevant tests + repository checks pass.

Non-goals: AI explanation, auth, persistence, graph database, queue, Redis, runtime execution/tracing, multi-language support, generic plugin platform, broad design-system work.

## Later
1. Improve focus/search/source comprehension based on M1 usage.
2. Add a second language only after the IR contract is proven by M1.
