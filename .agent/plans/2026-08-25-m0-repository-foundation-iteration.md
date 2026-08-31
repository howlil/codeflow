# M0 Repository Foundation Iteration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce an executable TypeScript monorepo whose web app, API, analysis-core package, local quality gates, and CI all run successfully without introducing M1 product behavior.

**Architecture:** Use one pnpm workspace with a React/Vite web app, a Fastify API, and an intentionally empty `analysis-core` package boundary. M0 proves build and test seams only; semantic IR, repository analysis, graph projection, React Flow, and shared contracts begin in M1 when a real fixture supplies their requirements.

**Tech Stack:** Node.js 24, pnpm 11, TypeScript, React, Vite, Fastify, Vitest, Testing Library, ESLint, Prettier, GitHub Actions.

**Spec:** `.agent/specs/2026-08-25-codeflow-foundation-design.md`

## Global Constraints

- Implement only M0 from `.agent/plan.md` and `.agent/plans/2026-08-25-foundation-implementation.md`.
- Work on one branch named `chore/m0-repository-foundation`; do not perform normal implementation work on `master`.
- Use Node.js `24.x` and record `pnpm@11.21.0` in the root `packageManager` field.
- Keep a single TypeScript modular monolith workspace with `apps/web`, `apps/api`, and `packages/analysis-core`.
- Do not create `packages/contracts` until M1 produces a contract that is consumed by at least two packages.
- Do not add `@xyflow/react`, semantic IR types, adapters, graph projections, repository ingestion, databases, auth, queues, Redis, Docker orchestration, AI SDKs, global state libraries, or component libraries.
- Do not execute analyzed repository code. M0 has no repository input surface.
- Use TDD for the API health route and web smoke page. Configuration-only steps use explicit command verification because no useful RED test seam exists yet.
- Prefix shell commands with `rtk` as required by `C:\Users\howlil\.codex\RTK.md`. Use `rtk powershell -NoProfile -Command "..."` for PowerShell cmdlets.
- Preserve unrelated working-tree changes. Stage only files listed by the current task.

---

## Iteration Contract

**Status:** READY

**Milestone:** M0 - Repository Foundation

**Proposed branch:** `chore/m0-repository-foundation`

**Delivery unit:** One branch and one pull request. Review and CI fixes remain on the same branch.

**Start condition:** The implementer has reviewed the existing working tree and confirmed which pre-existing documentation moves belong to the user. The implementation must not silently stage or revert them.

**Exit condition:** A clean checkout can install dependencies and pass `pnpm check`; the API health test and web smoke test protect the two executable surfaces; CI runs the same gate; no M1 dependency or behavior is present.

## Acceptance Matrix

| Acceptance criterion | Evidence | Owning task |
|---|---|---|
| pnpm workspace installs reproducibly | `pnpm install --frozen-lockfile` exits 0 after lockfile creation | Task 1 |
| Strict TypeScript package boundary exists | `pnpm --filter @codeflow/analysis-core typecheck` and `build` exit 0 | Task 2 |
| Fastify API is executable | `GET /health` returns HTTP 200 and the exact documented payload | Task 3 |
| React/Vite app is executable | Smoke page renders the CodeFlow heading and readiness status | Task 4 |
| Formatting, lint, types, tests, and builds are one gate | `pnpm check` exits 0 | Task 5 |
| CI reproduces the local gate | GitHub Actions workflow installs with frozen lockfile and runs `pnpm check` | Task 5 |
| Roadmap advances truthfully | M0 is `DONE`, M1 is `NEXT`, and checkpoint contains actual command results | Task 6 |

## Target File Map

```text
.
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- apps/
|   |-- api/
|   |   |-- src/
|   |   |   |-- app.test.ts
|   |   |   |-- app.ts
|   |   |   `-- server.ts
|   |   |-- package.json
|   |   `-- tsconfig.json
|   `-- web/
|       |-- src/
|       |   |-- App.test.tsx
|       |   |-- App.tsx
|       |   |-- index.css
|       |   |-- main.tsx
|       |   `-- test-setup.ts
|       |-- index.html
|       |-- package.json
|       |-- tsconfig.json
|       `-- vite.config.ts
|-- packages/
|   `-- analysis-core/
|       |-- src/
|       |   `-- index.ts
|       |-- package.json
|       `-- tsconfig.json
|-- .gitignore
|-- .prettierignore
|-- .prettierrc.json
|-- eslint.config.js
|-- package.json
|-- pnpm-lock.yaml
|-- pnpm-workspace.yaml
`-- tsconfig.base.json
```

The empty `analysis-core/src/index.ts` is deliberate. M0 establishes a compilable package boundary without inventing semantic concepts before the M1 fixture and golden expectations exist.

---

### Task 1: Bootstrap the Workspace and Root Toolchain

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create or modify narrowly: `.gitignore`
- Create: `pnpm-lock.yaml` through `pnpm install`

**Interfaces:**

- Consumes: Local Node.js `24.x`, pnpm `11.21.0`, repository policy in `.agent/AGENTS.md`, and the foundation design.
- Produces: Root scripts `format`, `format:check`, `lint`, `typecheck`, `test`, `build`, and `check`; strict shared compiler options; workspace package discovery for `apps/*` and `packages/*`.

- [ ] **Step 1: Confirm the branch and preserve unrelated changes**

Run:

```powershell
rtk git status --short --branch
rtk git switch -c chore/m0-repository-foundation
rtk git status --short --branch
```

Expected: the current branch is `chore/m0-repository-foundation`; all pre-existing modifications remain present and unstaged.

- [ ] **Step 2: Create the root workspace manifests**

Create `package.json` with this contract:

```json
{
  "name": "codeflow",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@11.21.0",
  "engines": {
    "node": ">=24 <25"
  },
  "scripts": {
    "dev:api": "pnpm --filter @codeflow/api dev",
    "dev:web": "pnpm --filter @codeflow/web dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "pnpm --recursive --if-present typecheck",
    "test": "pnpm --recursive --if-present test",
    "build": "pnpm --recursive --if-present build",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - apps/*
  - packages/*
```

- [ ] **Step 3: Create strict shared TypeScript configuration**

Create `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "allowJs": false,
    "esModuleInterop": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "strict": true,
    "target": "ES2023",
    "useDefineForClassFields": true
  }
}
```

- [ ] **Step 4: Configure formatting and linting**

Install only the root-level tooling:

```powershell
rtk pnpm add --save-dev --workspace-root @eslint/js eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals prettier typescript typescript-eslint
```

Create `.prettierrc.json`:

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all"
}
```

Create `.prettierignore`:

```text
dist
coverage
node_modules
pnpm-lock.yaml
```

Create `eslint.config.js`:

```javascript
import eslint from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/coverage/**', '**/dist/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
);
```

- [ ] **Step 5: Add generated-output ignores without replacing user entries**

Ensure `.gitignore` contains these entries exactly once:

```text
node_modules/
dist/
coverage/
.vite/
*.tsbuildinfo
```

- [ ] **Step 6: Verify the root configuration has the expected initial result**

Run:

```powershell
rtk pnpm install
rtk pnpm format:check
rtk pnpm lint
```

Expected: install writes `pnpm-lock.yaml`; formatting and linting exit 0 before package source is added.

- [ ] **Step 7: Commit only the root toolchain files**

```powershell
rtk git add package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json eslint.config.js .prettierrc.json .prettierignore .gitignore
rtk git diff --cached --check
rtk git commit -m "chore: bootstrap pnpm workspace"
```

---

### Task 2: Establish the Analysis-Core Package Boundary

**Files:**

- Create: `packages/analysis-core/package.json`
- Create: `packages/analysis-core/tsconfig.json`
- Create: `packages/analysis-core/src/index.ts`

**Interfaces:**

- Consumes: `tsconfig.base.json` and root workspace scripts from Task 1.
- Produces: An importable package named `@codeflow/analysis-core` with ESM declarations in `dist`; it intentionally exports no semantic API in M0.

- [ ] **Step 1: Create the package manifest**

Create `packages/analysis-core/package.json`:

```json
{
  "name": "@codeflow/analysis-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "typecheck": "tsc --project tsconfig.json --noEmit"
  }
}
```

- [ ] **Step 2: Create the package compiler configuration and honest empty entry point**

Create `packages/analysis-core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "tsBuildInfoFile": "dist/analysis-core.tsbuildinfo"
  },
  "include": ["src"]
}
```

Create `packages/analysis-core/src/index.ts`:

```typescript
export {};
```

- [ ] **Step 3: Verify the package boundary**

Run:

```powershell
rtk pnpm --filter @codeflow/analysis-core typecheck
rtk pnpm --filter @codeflow/analysis-core build
rtk powershell -NoProfile -Command "Get-ChildItem -Recurse packages/analysis-core/dist"
```

Expected: typecheck and build exit 0; `dist/index.js` and `dist/index.d.ts` exist. No model, adapter, graph, evidence, or projection source exists yet.

- [ ] **Step 4: Commit the package boundary**

```powershell
rtk git add packages/analysis-core
rtk git diff --cached --check
rtk git commit -m "chore: add analysis core package boundary"
```

---

### Task 3: Add the Fastify Health Slice with TDD

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/app.test.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`

**Interfaces:**

- Consumes: Root workspace and TypeScript configuration from Task 1.
- Produces: `buildApp(): FastifyInstance`; `GET /health` response `{ "status": "ok", "service": "codeflow-api" }`; executable server using `HOST` and `PORT` environment variables.

- [ ] **Step 1: Create the API package manifest and compiler configuration**

Create `apps/api/package.json`:

```json
{
  "name": "@codeflow/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc --project tsconfig.json",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "test": "vitest run",
    "typecheck": "tsc --project tsconfig.json --noEmit"
  }
}
```

Create `apps/api/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

Add the package dependencies through pnpm so the manifest records concrete compatible ranges and the lockfile records exact resolutions:

```powershell
rtk pnpm --filter @codeflow/api add fastify
rtk pnpm --filter @codeflow/api add --save-dev @types/node tsx vitest
```

Review `apps/api/package.json` and `pnpm-lock.yaml`. Neither file may contain a literal `latest` specifier.

- [ ] **Step 2: Write the failing health-route test**

Create `apps/api/src/app.test.ts`:

```typescript
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('GET /health', () => {
  const app = buildApp();

  afterEach(async () => {
    await app.close();
  });

  it('reports the API identity and readiness', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      service: 'codeflow-api',
    });
  });
});
```

- [ ] **Step 3: Run the focused test to verify RED**

```powershell
rtk pnpm --filter @codeflow/api test -- src/app.test.ts
```

Expected: FAIL because `./app.js` or `buildApp` does not exist.

- [ ] **Step 4: Implement the minimum Fastify application**

Create `apps/api/src/app.ts`:

```typescript
import Fastify, { type FastifyInstance } from 'fastify';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'codeflow-api',
  }));

  return app;
}
```

Create `apps/api/src/server.ts`:

```typescript
import { buildApp } from './app.js';

const app = buildApp();
const host = process.env.HOST ?? '127.0.0.1';
const port = Number.parseInt(process.env.PORT ?? '3001', 10);

try {
  await app.listen({ host, port });
} catch (error: unknown) {
  app.log.error(error);
  process.exitCode = 1;
}
```

- [ ] **Step 5: Run focused and package verification to prove GREEN**

```powershell
rtk pnpm --filter @codeflow/api test -- src/app.test.ts
rtk pnpm --filter @codeflow/api typecheck
rtk pnpm --filter @codeflow/api build
```

Expected: one health test passes; typecheck and build exit 0.

- [ ] **Step 6: Commit the API slice**

```powershell
rtk git add apps/api package.json pnpm-lock.yaml
rtk git diff --cached --check
rtk git commit -m "feat(api): add foundation health route"
```

---

### Task 4: Add the Web Smoke Page with TDD

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/index.html`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/src/test-setup.ts`
- Create: `apps/web/src/App.test.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/index.css`

**Interfaces:**

- Consumes: Root workspace, lint, formatting, and TypeScript configuration from Task 1.
- Produces: A Vite app whose first screen identifies CodeFlow and reports `Foundation workspace ready`; a DOM test seam for future canvas work.

- [ ] **Step 1: Create the web package manifest**

Create `apps/web/package.json`:

```json
{
  "name": "@codeflow/web",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc --project tsconfig.json --noEmit && vite build",
    "dev": "vite",
    "test": "vitest run",
    "typecheck": "tsc --project tsconfig.json --noEmit --pretty false"
  }
}
```

Add the dependencies through pnpm:

```powershell
rtk pnpm --filter @codeflow/web add react react-dom
rtk pnpm --filter @codeflow/web add --save-dev @testing-library/jest-dom @testing-library/react @types/react @types/react-dom @vitejs/plugin-react jsdom vite vitest
```

Review `apps/web/package.json` and `pnpm-lock.yaml`. Neither file may contain a literal `latest` specifier. No React Flow, router, state library, or design-system dependency is allowed in M0.

- [ ] **Step 2: Create Vite and TypeScript configuration**

Create `apps/web/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "noEmit": true,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "vite.config.ts"]
}
```

Create `apps/web/vite.config.ts`:

```typescript
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

If TypeScript rejects the `test` key, import `defineConfig` from `vitest/config` instead of weakening types.

Create `apps/web/src/test-setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Write the failing smoke-page test**

Create `apps/web/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('shows the M0 foundation readiness state', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'CodeFlow' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Foundation workspace ready',
    );
  });
});
```

- [ ] **Step 4: Run the focused test to verify RED**

```powershell
rtk pnpm --filter @codeflow/web test -- src/App.test.tsx
```

Expected: FAIL because `App.tsx` does not exist.

- [ ] **Step 5: Implement the minimum smoke page**

Create `apps/web/src/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <p className="eyebrow">Repository intelligence</p>
      <h1>CodeFlow</h1>
      <p role="status">Foundation workspace ready</p>
    </main>
  );
}
```

Create `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './index.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Create `apps/web/index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="CodeFlow repository understanding workspace"
    />
    <title>CodeFlow</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `apps/web/src/index.css`:

```css
:root {
  color: #171717;
  background: #f5f5f5;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button,
input,
textarea,
select {
  font: inherit;
}

.app-shell {
  width: min(100% - 32px, 960px);
  margin: 0 auto;
  padding: 64px 0;
}

.eyebrow {
  margin: 0 0 8px;
  color: #525252;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0;
  line-height: 1.2;
}

[role="status"] {
  margin: 16px 0 0;
  color: #404040;
}
```

Do not create a landing-page hero, canvas mock, decorative graphics, or component abstraction in M0.

- [ ] **Step 6: Run focused and package verification to prove GREEN**

```powershell
rtk pnpm --filter @codeflow/web test -- src/App.test.tsx
rtk pnpm --filter @codeflow/web typecheck
rtk pnpm --filter @codeflow/web build
```

Expected: one smoke test passes; typecheck and Vite build exit 0.

- [ ] **Step 7: Commit the web slice**

```powershell
rtk git add apps/web package.json pnpm-lock.yaml
rtk git diff --cached --check
rtk git commit -m "feat(web): add foundation smoke page"
```

---

### Task 5: Add the Reproducible Repository Gate and CI

**Files:**

- Create: `.github/workflows/ci.yml`
- Modify if verification requires it: root `package.json`
- Modify if dependency resolution requires it: `pnpm-lock.yaml`

**Interfaces:**

- Consumes: Every package script from Tasks 1-4.
- Produces: One local command, `pnpm check`, and one CI job that runs the same ordered gate on a clean Linux runner.

- [ ] **Step 1: Run the complete local gate before adding CI**

```powershell
rtk pnpm format
rtk pnpm check
```

Expected: formatting, lint, typecheck, all tests, and all builds pass in that order. Fix only M0 files if the gate fails; do not alter unrelated user files to make a broad command green.

- [ ] **Step 2: Prove frozen installation works**

```powershell
rtk powershell -NoProfile -Command "Remove-Item -Recurse -Force node_modules, apps/api/node_modules, apps/web/node_modules, packages/analysis-core/node_modules -ErrorAction SilentlyContinue"
rtk pnpm install --frozen-lockfile
rtk pnpm check
```

Expected: installation and the full gate pass from the lockfile. Before executing the removal command, resolve each target and confirm it is inside the CodeFlow workspace.

- [ ] **Step 3: Create the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - master

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Enable Corepack
        run: corepack enable

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify repository
        run: pnpm check
```

- [ ] **Step 4: Validate workflow syntax and re-run the local contract**

```powershell
rtk pnpm check
rtk git diff --check
```

Expected: local gate exits 0 and Git reports no whitespace errors. CI itself remains pending until the branch is pushed; do not claim CI passed from local verification.

- [ ] **Step 5: Commit the gate**

```powershell
rtk git add .github/workflows/ci.yml package.json pnpm-lock.yaml
rtk git diff --cached --check
rtk git commit -m "ci: add repository quality gates"
```

---

### Task 6: Perform Manual Smoke Verification and Close M0

**Files:**

- Modify after verified completion: `.agent/plan.md`
- Create after verified completion: `.agent/checkpoints/2026-08-25-m0-repository-foundation.md`

**Interfaces:**

- Consumes: Built API and web application from Tasks 3-4, repository gate from Task 5, and actual CI result after push.
- Produces: Truthful milestone state and concise verification evidence; M1 becomes `NEXT` only after all M0 exit criteria pass.

- [ ] **Step 1: Start and inspect the API**

In terminal A:

```powershell
rtk pnpm dev:api
```

In terminal B:

```powershell
rtk powershell -NoProfile -Command "Invoke-RestMethod http://127.0.0.1:3001/health | ConvertTo-Json -Compress"
```

Expected exact response:

```json
{"status":"ok","service":"codeflow-api"}
```

Stop terminal A cleanly after verification.

- [ ] **Step 2: Start and inspect the web app**

Run:

```powershell
rtk pnpm dev:web -- --host 127.0.0.1
```

Open the printed local URL. Verify that the page renders, the H1 reads `CodeFlow`, the status reads `Foundation workspace ready`, no text overlaps at 1280x800 and 390x844, and the browser console has no error. Stop the server cleanly afterward.

- [ ] **Step 3: Run the final clean verification set**

```powershell
rtk pnpm install --frozen-lockfile
rtk pnpm check
rtk git diff --check
rtk git status --short --branch
```

Expected: install and all quality gates exit 0; status contains only intended M0 changes plus any clearly identified pre-existing user changes.

- [ ] **Step 4: Record only observed evidence**

Create `.agent/checkpoints/2026-08-25-m0-repository-foundation.md` with:

```markdown
# M0 Repository Foundation Checkpoint

## Result

M0 is complete.

## Verified

- `pnpm install --frozen-lockfile` - PASS
- `pnpm check` - PASS
- `GET /health` - PASS with the documented payload
- Web smoke page - PASS at desktop and mobile viewport
- GitHub Actions CI - PASS at commit `<verified-head-sha>`

## Scope Confirmation

- No M1 semantic analysis or canvas behavior was added.
- No database, auth, queue, Redis, graph database, AI SDK, or runtime execution was added.

## Remaining Work

M1 is the next milestone: TypeScript fixture to semantic flow, API projection, canvas, and evidence inspector.
```

Replace `<verified-head-sha>` with the actual verified commit. If CI has not run or failed, write its real status and keep M0 out of `DONE`.

- [ ] **Step 5: Advance the roadmap only after verification**

In `.agent/plan.md`, change the Milestone Ledger to:

```markdown
| M0 | executable monorepo + CI quality gates | DONE |
| M1 | TypeScript full-stack fixture -> semantic flow -> interactive canvas -> evidence inspector | NEXT |
```

Update `Immediate Next State` so it points to a separate M1 design/iteration pass. Do not copy M1 implementation into this branch.

- [ ] **Step 6: Commit the verified milestone evidence**

```powershell
rtk git add .agent/plan.md .agent/checkpoints/2026-08-25-m0-repository-foundation.md
rtk git diff --cached --check
rtk git commit -m "docs: record M0 completion evidence"
```

- [ ] **Step 7: Push and open one pull request**

```powershell
rtk git push --set-upstream origin chore/m0-repository-foundation
```

The pull request must state the M0 scope, list the exact local commands run, link the CI result, disclose pre-existing working-tree changes that were excluded, and explicitly confirm that M1 behavior remains out of scope.

---

## Iteration Review Gates

### Gate A - After Task 2

- Workspace package discovery works.
- `analysis-core` compiles without fabricated semantic API.
- No product dependency has entered the root package.

### Gate B - After Task 4

- API and web each have a focused executable test.
- Failures are localizable to one package.
- No HTTP client, shared contracts package, or canvas dependency was added prematurely.

### Gate C - Before M0 Closure

- Frozen install passes.
- `pnpm check` passes.
- Manual API and responsive web smoke checks pass.
- CI passes at the current head.
- Roadmap and checkpoint report actual evidence, not intended evidence.

## Abort and Re-plan Conditions

Stop this iteration and update the plan before proceeding if any of these occur:

- A required dependency does not support Node.js 24 or pnpm 11.
- M0 needs a shared runtime contract between web and API; that is evidence to reassess `packages/contracts`, not permission to add it silently.
- The smoke UI grows into canvas or repository-analysis behavior.
- CI requires infrastructure beyond a single GitHub Actions job.
- Existing uncommitted documentation moves cannot be separated safely from M0 commits.
- A quality gate can pass only by weakening strict TypeScript, skipping tests, or ignoring source broadly.

## M0 Definition of Done

M0 is done only when every acceptance-matrix row has observed evidence, all six tasks are complete, the current branch head passes CI, and the repository remains free of M1 product semantics. Code existing locally without clean installation, tests, builds, manual smoke evidence, and current-head CI is not M0 completion.
