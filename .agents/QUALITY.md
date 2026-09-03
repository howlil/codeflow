# CodeFlow Quality

`QUALITY.md` defines CodeFlow-specific verification commands, CI behavior, and risk-specific gates. Generic testing lifecycle policy remains global agent policy and is not duplicated here.

## Quality Objective

Optimize for:

```text
(correct signal x relevant coverage) / feedback time
```

Fast CI is useful only when it preserves the automated checks that can observe the changed failure boundary. Accuracy means the verification level matches actual risk, not that every possible test runs for every change.

Manual acceptance testing, black-box/browser E2E testing, and human visual-review gates are not required for merge or release readiness. When an environment-specific behavior cannot be established deterministically, record residual risk rather than introducing a manual gate.

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

For each logical change:

1. identify the observable behavior or contract that changed;
2. identify where that behavior can fail;
3. run the smallest focused automated check that observes that boundary during implementation;
4. escalate only for meaningful residual risk that another deterministic repository-owned layer can observe;
5. run the required coherent integration gate once at the integration boundary.

Do not require a fixed unit -> integration -> browser E2E -> deployment ladder. Do not rerun the full repository gate after every file edit or tiny commit. Do not skip a relevant test merely to shorten CI.

## Confidence Layers

### Static / formatting

Use formatting, linting, compilation, and build checks for syntax, type, import, bundle, and static-policy risks. Do not duplicate repository-wide `typecheck` when package builds already compile TypeScript and observe the same failure boundary.

### Unit / focused behavior

Use focused deterministic tests for local domain behavior, regressions, state transitions, helpers with meaningful logic, and component interactions. Test observable outcomes instead of framework internals or implementation trivia.

### Integration

Use integration tests when correctness depends on a boundary between real repository owners such as analysis -> API projection or API -> web contract. Integration is justified by boundary risk, not by a policy that every slice must have one.

### Deployment

Use Compose configuration and smoke only when deployment/container/CI-deployment surfaces change. Deployment verification is not part of every ordinary product or design change.

## Focused Verification by Ownership

### Semantic / Analysis Changes

Prefer small deterministic fixtures/tests for entity/relationship correctness, symbol/reference resolution, deterministic identity, evidence provenance/classification, partial/unsupported behavior, and projection output. Prefer a representative small fixture over a large external repository when it provides higher signal.

### API Changes

Verify the affected HTTP boundary and semantic projection contract. Current API boundary coverage lives under `apps/api/src/` and should remain close to the behavior it protects.

### Web / Interaction Changes

Separate presentation risk from interaction risk.

For pure CSS/token styling changes that do not alter behavior:

- install from the frozen lockfile when dependency resolution is relevant;
- run formatting/lint/build so CSS/Tailwind/Vite integration remains valid;
- skip Vitest when component behavior is outside the changed failure domain;
- do not add snapshots, browser E2E, or manual visual-review requirements merely because styling changed.

For changes to React/TSX behavior, Radix/native controls, selection, search, keyboard navigation, inspector synchronization, loading/empty/partial/error states, accessibility semantics, or other user interaction:

- run focused `@codeflow/web` Testing Library/Vitest coverage when the change is web-owned;
- add a regression test when a behavior bug could realistically recur;
- keep semantic assertions independent from decorative markup where possible.

Existing behavioral coverage must not be removed or disabled to make a design-system change green.

### Documentation / Agent Knowledge Changes

Changes limited to `AGENTS.md` and `.agents/**` do not alter runtime behavior. CI may therefore skip Node setup, dependency installation, build, and runtime tests when deterministic scope detection proves the complete change set is agent-knowledge-only.

The lightweight agent gate must still:

- reject whitespace errors with `git diff --check` across the complete change set;
- verify the canonical repository-knowledge files exist;
- verify retired `.agents/skills` mirrors have not returned.

If any runtime, toolchain, workflow, or deployment file changes in the same PR/push change set, the corresponding stronger automated gate applies.

### Shared / Toolchain Changes

Changes outside isolated web ownership, including API, analysis-core, root package/lock/config, or CI workflow changes, use the full repository test scope unless a more precise evidence boundary is explicitly established.

### Deployment Changes

Deployment/container changes require the actual production path:

```text
docker compose config
-> build production images
-> start api + web
-> request /health through web -> api
-> tear down stack
```

Verify that `web` exposes container port `8080`, `api` remains internal on `3001`, `/api` and `/health` proxy through the internal service, production images build/start, and health succeeds through Nginx.

## Repository Integration Gate

`pnpm check` remains the local coherent repository integration command:

```text
format:check
-> lint
-> build
-> test
```

GitHub Actions executes the applicable phases as separate named steps rather than invoking the aggregate command. This keeps failure boundaries immediately visible while allowing irrelevant phases to be skipped safely.

CI scope is calculated from the **entire change set**:

- pull request: merge-base of PR base/head -> PR head;
- push: event `before` SHA -> pushed SHA;
- if the range cannot be established reliably: conservative full runtime + deployment gate.

Scope rules:

- `AGENTS.md` / `.agents/**` only -> lightweight agent-knowledge verification;
- pure `apps/web/src/**/*.css` change -> frozen install + format/lint/build, no Vitest;
- web-owned runtime change -> frozen install + format/lint/build + focused `@codeflow/web` tests;
- API, analysis-core, root config/dependency/toolchain/workflow, mixed ownership -> frozen install + format/lint/build + full repository tests;
- deployment surfaces -> Compose config + production smoke after the applicable runtime gate;
- `.github/workflows/ci.yml` is a deployment-gate surface, so CI mechanism changes exercise the production smoke path.

The CI workflow uses pnpm dependency caching and cancels superseded runs for the same ref so obsolete feedback does not consume runner time.

When a test gate fails, CI uploads a one-day `test-output.log` diagnostic artifact. Failure-only diagnostics are preferred to permanently increasing successful-run output or adding speculative retries.

## High-Risk Boundaries

Escalate automated verification when changed behavior touches semantic IR/evidence contracts, repository scope/path isolation, public API contracts, security/privacy, persistence/migrations, runtime repository execution, concurrency/resource isolation, deployment, or irreversible operations.

The deeper check must target the material risk; additional test count by itself is not evidence.

## Flaky Tests

A flaky test is a defect. Repeated reruns until green are not valid confidence evidence. Fix the nondeterminism or the product race; do not normalize rerun-until-pass behavior.

## Release-Ready Evidence

For an integrated CodeFlow change, repository-specific evidence is sufficient when:

- the authorized observable outcome is implemented;
- changed failure boundaries have appropriate focused automated evidence;
- the required integration CI for the detected complete change set is green;
- any deterministic risk-specific gate triggered by the changed surface is green;
- repository state/docs are truthful in their owning files;
- no known in-scope blocker remains.
