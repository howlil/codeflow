# CodeFlow Quality

`QUALITY.md` defines the repository-specific verification strategy and release-ready gates.

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

## Repository Integration Gate

`pnpm check` is the standard repository-wide application verification gate:

```text
format:check
 -> lint
 -> build
 -> test
```

Each package build already runs the TypeScript compiler, so running the repository-wide `typecheck` again inside `pnpm check` would duplicate the same compiler work. Keep `pnpm typecheck` available for focused/manual type verification when a full build is unnecessary.

GitHub Actions runs `pnpm install --frozen-lockfile` followed by `pnpm check` for pull requests and pushes to `master`.

The production Compose path is also verified in CI:

```text
docker compose config
 -> build production images
 -> start api + web
 -> request /health through the published web origin
 -> tear down stack
```

The smoke test uses a non-default host port in CI to avoid accidental runner conflicts. A successful health request must traverse Nginx to the internal API; image build alone is not sufficient deployment evidence.

## Focused Verification

Before the repository-wide gate, use the smallest deterministic checks that exercise the changed surface.

### Semantic / Analysis Changes

Protect relevant behavior with small deterministic fixtures/tests, especially for:

- semantic entity/relationship correctness;
- symbol/reference resolution;
- deterministic identity where required;
- evidence provenance/classification;
- partial/unsupported behavior;
- projection output.

A small representative repository fixture is preferred when it gives clearer evidence than a large external repository.

### API Changes

Verify the relevant HTTP boundary and semantic projection contract. Current API tests live in `apps/api/src/app.test.ts`.

### Web / Interaction Changes

Verify the affected user-visible flow and existing regressions that protect it. Current workspace regression coverage lives in `apps/web/src/App.test.tsx`.

Important CodeFlow interaction confidence includes:

- selection and source/evidence inspection;
- search and neighborhood focus;
- relationship evidence inspection;
- explicit loading/empty/partial/error states;
- keyboard-accessible semantic navigation;
- static/inferred/unavailable evidence presentation.

Presentation-only layout changes do not require a new automated test when existing tests plus direct visual/diff verification provide the relevant confidence.

### Deployment Changes

Deployment or container changes require targeted verification of the actual production path:

- `docker compose config` succeeds;
- both production image targets build from a clean context;
- the API starts on the internal Compose network;
- the web container serves the built SPA;
- `/api` and `/health` proxying use the internal API service rather than a host-only address;
- the public health request succeeds after stack startup;
- the API remains unexposed to the host unless a future approved deployment requirement changes that boundary.

## High-Risk Boundaries

Changes touching any of these require targeted verification beyond generic CI when relevant:

- semantic IR/evidence contracts;
- repository scope/path isolation;
- public API contracts;
- security/privacy behavior;
- persisted-data/migration behavior when persistence exists;
- runtime repository execution;
- concurrency/resource isolation;
- deployment or irreversible operations.

Material changes to product behavior, public contracts, architecture/data ownership, security boundaries, or runtime topology still require explicit user approval before implementation.

## Documentation / Agent Knowledge Changes

For `.agents/` or root documentation-only changes:

- verify all referenced paths exist;
- verify commands against current package/workflow configuration;
- verify architecture claims against current code;
- verify current iteration claims against repository/PR state;
- remove stale/competing sources of truth;
- run repository CI when it is triggered by the integration path.

## Flaky Tests

A flaky test is a defect. Do not treat repeated reruns until green as valid verification evidence.

## Release-Ready Criteria

A logical change is release-ready when:

- its authorized observable outcome is satisfied;
- relevant focused verification passes;
- `pnpm check` passes when required by the integration path;
- any risk-specific checks pass;
- deployment changes pass the production Compose config/build/start/health smoke path;
- no known in-scope blocker remains;
- canonical project/architecture/current-state documentation is updated only when its owned truth changed.

A milestone is release-ready only when its required slices are integrated and its milestone acceptance/verification criteria are satisfied.
