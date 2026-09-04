import type { FlowProjection } from '@codeflow/analysis-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('M7 workspace topology API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('keeps metadata separate from source and projects package topology', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: { filePath: 'apps/web/src/app.ts', name: 'app' },
        files: [
          {
            filePath: 'apps/web/src/app.ts',
            sourceText:
              "import { core } from '@demo/core';\nexport function app() { return core(); }",
          },
          {
            filePath: 'packages/core/src/index.ts',
            sourceText: 'export function core() { return 1; }',
          },
        ],
        metadata: [
          {
            filePath: 'pnpm-workspace.yaml',
            text: "packages:\n  - 'apps/*'\n  - 'packages/*'\n",
          },
          {
            filePath: 'apps/web/package.json',
            text: JSON.stringify({
              name: '@demo/web',
              dependencies: { '@demo/core': 'workspace:*' },
            }),
          },
          {
            filePath: 'packages/core/package.json',
            text: JSON.stringify({ name: '@demo/core' }),
          },
        ],
      },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.analysis.analyzedFileCount).toBe(2);
    expect(flow.topology?.entities.map((entity) => entity.name)).toEqual(
      expect.arrayContaining(['Workspace', '@demo/web', '@demo/core']),
    );
    expect(
      flow.topology?.relationships.some(
        (relationship) =>
          relationship.kind === 'DEPENDS_ON' &&
          relationship.sourceId === 'package:apps/web' &&
          relationship.targetId === 'package:packages/core',
      ),
    ).toBe(true);
  });

  it('bounds topology metadata without rejecting valid source analysis', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: { filePath: 'src/app.ts', name: 'app' },
        files: [
          {
            filePath: 'src/app.ts',
            sourceText: 'export function app() { return 1; }',
          },
        ],
        metadata: [
          {
            filePath: 'package.json',
            text: 'x'.repeat(70 * 1024),
          },
        ],
      },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.analysis.status).toBe('partial');
    expect(flow.analysis.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: 'limit', filePath: 'package.json' }),
      ]),
    );
    expect(flow.nodes.some((node) => node.label === 'app')).toBe(true);
  });
});
