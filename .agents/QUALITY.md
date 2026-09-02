# CodeFlow Quality

`QUALITY.md` defines CodeFlow-specific verification commands, CI behavior, and risk-specific gates. Generic testing lifecycle policy remains global agent policy and is not duplicated here.

## Toolchain

Current root tooling:

- Node.js `>=24 <25`;
- pnpm `11.21.0`;
- TypeScript / ESM monorepo;
- Docker Engine with Docker Compose v2 for production packaging verification.

Package manifests and the lockfile are authoritative for exact versions.

## Common Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm format
pnpm format:check
pnpm lint
pnpm build
pnpm typecheck
pnpm test
pnpm check
docker compose config
docker compose up -d --build
docker compose down
```

## Verification Selection

Use the cheapest deterministic check that can observe the changed failure boundary.

For each change:

1. identify the behavior or contract that changed;
2. identify where that behavior can fail;
3. run the smallest check that observes that boundary;
4. escalate only when meaningful residual risk remains.

Do not require a fixed unit → integration → E2E → deployment ladder. Do not rerun the full repository gate after every file edit or tiny commit.

## Focused Verification

### Semantic / Analysis Changes

Prefer small deterministic fixtures/tests that directly prove the changed semantics, especially for:

- entity/relationship correctness;
- symbol/reference resolution;
- deterministic identity;
- evidence provenance/classification;
- partial/unsupported behavior;
- projection output.

Use a small representative repository fixture when it provides higher signal than a large external repository.

### API Changes

Verify the affected HTTP boundary and semantic projection contract. Current API boundary tests live in `apps/api/src/app.test.ts`; M4-specific regression coverage also exists in `apps/api/src/m4.test.ts`.

### Web / Interaction Changes

Verify the affected user-visible behavior and the regressions that protect it. Current web coverage includes `apps/web/src/App.test.tsx` and `apps/web/src/StaticFlowPanel.test.tsx`.

Important behavior includes selection/source/evidence inspection, search/focus, keyboard navigation, explicit async/partial/error states, and truthful static/inferred/unavailable presentation.

Presentation-only changes do not require new automated tests when existing behavioral coverage plus direct visual/diff inspection is sufficient evidence.

### Documentation / Agent Knowledge Changes

For `AGENTS.md` or `.agents/` changes:

- verify ownership and references against the current repository;
- remove stale or competing sources of truth;
- ensure `CURRENT_ITERATION.md` contains current state rather than history;
- use formatting/static checks where relevant;
- rely on the integration CI gate rather than inventing additional documentation ceremony.

### Deployment Changes

Deployment/container changes require the actual production path:

```text
docker compose config
 -> build production images
 -> start api + web
 -> request /health through web -> api
 -> tear down stack
```

Verify that:

- `web` listens on/exposes container port `8080` without repository-owned host-port publishing;
- `api` remains internal on `3001`;
- `/api` and `/health` proxy through the internal API service;
- the production image targets build and start;
- the health request succeeds through Nginx.

## Repository Integration Gate

`pnpm check` is the current repository integration gate:

```text
format:check
 -> lint
 -> build
 -> test
```

Package builds already run TypeScript compilation, so `pnpm check` intentionally does not add a duplicate repository-wide `typecheck` pass.

Because the repository is currently small and this gate is fast, GitHub Actions runs `pnpm check` for pull requests and pushes to `master`. During implementation, prefer focused checks; run the full gate at the coherent integration boundary rather than repeatedly for every logical edit.

Docker Compose validation/smoke is conditional in CI and runs only when deployment surfaces change. Deployment surfaces include `Dockerfile`, `compose.yaml`, `deploy/**`, `.dockerignore`, `.env.example`, and the CI workflow that owns this detection/gate.

## High-Risk Boundaries

Escalate verification when the changed behavior touches:

- semantic IR/evidence contracts;
- repository scope/path isolation;
- public API contracts;
- security/privacy behavior;
- persisted-data/migration behavior if persistence exists;
- runtime repository execution;
- concurrency/resource isolation;
- deployment or irreversible operations.

The deeper check must target the material risk; additional test count by itself is not evidence.

## Flaky Tests

A flaky test is a defect. Repeated reruns until green are not valid confidence evidence.

## Release-Ready Evidence

For an integrated CodeFlow change, repository-specific evidence is sufficient when:

- the authorized observable outcome is implemented;
- the changed failure boundaries have appropriate focused evidence;
- the required integration CI is green;
- any risk-specific gate triggered by the changed surface is green;
- repository state/docs are truthful in their owning files;
- no known in-scope blocker remains.
