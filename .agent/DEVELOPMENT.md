# CodeFlow Development & Verification

This file owns repository-local commands and verification mechanics. Operating policy lives in `.agent/AGENTS.md`.

## Runtime/toolchain

- Node.js: `>=24 <25`
- package manager: `pnpm@11.21.0`
- workspace: pnpm monorepo
- language: TypeScript / ESM

Use versions from `package.json`/lockfile if this document becomes stale.

## Common commands

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
```

`pnpm check` is the repository-wide integration gate:

```text
format:check -> lint -> build -> typecheck -> test
```

Prefer focused deterministic checks before running the full gate.

## Verification by risk

### Low risk

Examples: documentation, localized presentation-only CSS/layout, non-behavioral cleanup.

Prefer:

- formatter/check for touched files or repository formatter
- relevant lint/static check when applicable
- direct visual/diff sanity for presentation-only behavior
- affected tests only when an existing regression surface meaningfully applies

Do not add tests merely because a file changed.

### Medium risk

Examples: application behavior, state transitions, UI interaction, API wiring, semantic projection mapping.

Prefer:

- focused behavior/regression tests
- typecheck for affected contracts/call sites
- relevant lint/format
- build when bundling/runtime integration can fail
- direct acceptance flow
- `pnpm check` before integration

### High risk

Examples: semantic IR/evidence changes, repository isolation, security/privacy boundary, persisted-data/migration behavior, public contract changes, runtime execution.

In addition to focused tests and `pnpm check`, require risk-specific evidence such as:

- compatibility/contract checks
- migration/rollback validation
- security-boundary cases
- representative integration fixture
- staging/sandbox evidence where applicable

Material product/architecture/security/data-boundary changes still require user authority before implementation.

## Testing priorities

Prioritize tests for realistic regressions in:

- semantic relationship correctness
- deterministic/stable graph identity where required
- evidence provenance and uncertainty classification
- repository/project isolation
- API/projection contracts
- source/evidence inspection
- focus/search/navigation interaction
- static-vs-runtime labeling
- security/privacy behavior

A small representative fixture is preferred over a huge external repository when it proves the same risk more deterministically.

## TDD

Use TDD when a failing executable test is the cheapest high-signal way to define/protect behavior:

```text
reproduce/failing test
 -> minimum implementation
 -> focused green
 -> refactor while green
```

Do not require TDD for styling, static markup/copy, trivial wiring, or exploratory work where another verification method gives better signal.

## CI behavior

Remote CI is an integration gate, not the preferred first debugger.

Before opening/merging a PR, use the cheapest local or deterministic checks that can catch likely failures. Do not repeatedly rerun flaky CI until green; diagnose the flake.

Never claim CI/gates passed unless the current head's result was actually observed.

## Documentation-only changes

For agent/documentation changes:

- inspect the diff for conflicting sources of truth;
- verify referenced paths/files exist;
- ensure commands match `package.json`;
- executable product tests are not required unless code/config behavior changed;
- CI, when automatically triggered, remains valid integration evidence.
