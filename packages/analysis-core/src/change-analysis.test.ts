import { describe, expect, it } from 'vitest';

import { buildRepositoryChangeProjection } from './change-analysis.js';
import { analyzeTypeScriptRepository } from './repository-architecture.js';

function flow(files: Array<{ filePath: string; sourceText: string }>) {
  return analyzeTypeScriptRepository({
    files,
    entryPoint: { filePath: 'web.ts', name: 'render' },
  });
}

const source = {
  provider: 'github' as const,
  repository: 'demo/repo',
  pullRequestNumber: 7,
  title: 'Change payment flow',
  url: 'https://github.com/demo/repo/pull/7',
  baseRevision: 'base123',
  headRevision: 'head456',
};

describe('M9 repository change projection', () => {
  it('maps a changed hunk to a semantic entity and reuses bounded impact traversal', () => {
    const base = flow([
      {
        filePath: 'core.ts',
        sourceText: 'export function processPayment() {\n  return 1;\n}\n',
      },
      {
        filePath: 'api.ts',
        sourceText:
          "import { processPayment } from './core';\nexport function handle() {\n  return processPayment();\n}\n",
      },
      {
        filePath: 'web.ts',
        sourceText:
          "import { handle } from './api';\nexport function render() {\n  return handle();\n}\n",
      },
    ]);
    const head = flow([
      {
        filePath: 'core.ts',
        sourceText: 'export function processPayment() {\n  return 2;\n}\n',
      },
      {
        filePath: 'api.ts',
        sourceText:
          "import { processPayment } from './core';\nexport function handle() {\n  return processPayment();\n}\n",
      },
      {
        filePath: 'web.ts',
        sourceText:
          "import { handle } from './api';\nexport function render() {\n  return handle();\n}\n",
      },
    ]);

    const projection = buildRepositoryChangeProjection({
      source,
      base,
      head,
      files: [
        {
          path: 'core.ts',
          status: 'modified',
          additions: 1,
          deletions: 1,
          patch:
            '@@ -1,3 +1,3 @@\n export function processPayment() {\n-  return 1;\n+  return 2;\n }',
        },
      ],
    });

    expect(projection.entities).toEqual([
      expect.objectContaining({
        changeKind: 'modified',
        entityKind: 'Function',
        name: 'processPayment',
        path: 'core.ts',
      }),
    ]);
    expect(projection.impact.head?.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'handle', distance: 1 }),
        expect.objectContaining({ name: 'render', distance: 2 }),
      ]),
    );
    expect(projection.coverage.status).toBe('complete');
  });

  it('keeps removed relationships as explicit base/head deltas instead of predicting breakage', () => {
    const base = flow([
      {
        filePath: 'core.ts',
        sourceText: 'export function processPayment() { return 1; }\n',
      },
      {
        filePath: 'api.ts',
        sourceText:
          "import { processPayment } from './core';\nexport function handle() { return processPayment(); }\n",
      },
      {
        filePath: 'web.ts',
        sourceText:
          "import { handle } from './api';\nexport function render() { return handle(); }\n",
      },
    ]);
    const head = flow([
      {
        filePath: 'core.ts',
        sourceText: 'export function processPayment() { return 1; }\n',
      },
      {
        filePath: 'api.ts',
        sourceText: 'export function handle() { return 0; }\n',
      },
      {
        filePath: 'web.ts',
        sourceText:
          "import { handle } from './api';\nexport function render() { return handle(); }\n",
      },
    ]);

    const projection = buildRepositoryChangeProjection({
      source,
      base,
      head,
      files: [
        {
          path: 'api.ts',
          status: 'modified',
          additions: 1,
          deletions: 2,
          patch:
            "@@ -1,2 +1,1 @@\n-import { processPayment } from './core';\n-export function handle() { return processPayment(); }\n+export function handle() { return 0; }",
        },
      ],
    });

    expect(projection.relationshipDeltas).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeKind: 'removed',
          relationshipKind: 'CALLS',
          source: expect.objectContaining({ name: 'handle' }),
          target: expect.objectContaining({ name: 'processPayment' }),
        }),
      ]),
    );
  });

  it('keeps unsupported and patchless changes visible as partial coverage', () => {
    const snapshot = flow([
      {
        filePath: 'web.ts',
        sourceText: 'export function render() { return 1; }\n',
      },
    ]);
    const projection = buildRepositoryChangeProjection({
      source,
      base: snapshot,
      head: snapshot,
      files: [
        {
          path: 'README.md',
          status: 'modified',
          additions: 2,
          deletions: 1,
          patch: null,
        },
      ],
    });

    expect(projection.files[0]).toEqual(
      expect.objectContaining({ path: 'README.md', supported: false }),
    );
    expect(projection.coverage.status).toBe('partial');
    expect(projection.coverage.issues[0]?.message).toContain(
      'semantic change mapping currently supports TypeScript/TSX',
    );
  });
});
