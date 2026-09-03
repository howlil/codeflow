import type { FlowProjection } from '@codeflow/analysis-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from './app.js';

describe('CodeFlow API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

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

  it('keeps the deterministic sample flow available as a fixture path', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/flows/sample',
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.nodes.map((node) => node.label)).toEqual([
      'normalizeName',
      'formatGreeting',
      'handleGreeting',
    ]);
    expect(flow.edges).toHaveLength(2);
    expect(flow.sources).toHaveLength(1);
    expect(flow.analysis.status).toBe('complete');
  });

  it('analyzes cross-file TypeScript calls with repository-relative provenance', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: {
          filePath: 'demo/src/handler.ts',
          name: 'handleGreeting',
        },
        files: [
          {
            filePath: 'demo/src/handler.ts',
            sourceText: `import { normalizeName } from './name';\n\nexport function handleGreeting(name: string): string {\n  return normalizeName(name);\n}\n`,
          },
          {
            filePath: 'demo/src/name.ts',
            sourceText: `export function normalizeName(name: string): string {\n  return name.trim().toLowerCase();\n}\n`,
          },
        ],
      },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.nodes.map((node) => node.label).sort()).toEqual([
      'handleGreeting',
      'normalizeName',
    ]);
    expect(flow.edges).toHaveLength(1);
    expect(flow.edges[0]?.evidence[0]?.kind).toBe('verified-static');
    expect(flow.edges[0]?.evidence[0]?.location.filePath).toBe(
      'demo/src/handler.ts',
    );
    expect(
      flow.nodes.find((node) => node.label === 'normalizeName')?.location
        .filePath,
    ).toBe('demo/src/name.ts');
    expect(flow.sources.map((source) => source.filePath)).toEqual([
      'demo/src/handler.ts',
      'demo/src/name.ts',
    ]);
    expect(flow.analysis).toMatchObject({
      status: 'complete',
      analyzedFileCount: 2,
      ignoredFileCount: 0,
    });
  });

  it('returns a truthful partial projection when unsupported files are supplied', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: {
          filePath: 'demo/src/main.ts',
          name: 'main',
        },
        files: [
          {
            filePath: 'demo/src/main.ts',
            sourceText: 'export function main(): string { return "ok"; }',
          },
          {
            filePath: 'demo/README.md',
            sourceText: '# Demo',
          },
        ],
      },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.analysis.status).toBe('partial');
    expect(flow.analysis.ignoredFileCount).toBe(1);
    expect(flow.analysis.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'unsupported',
          filePath: 'demo/README.md',
        }),
      ]),
    );
  });

  it('bounds oversized repository source instead of analyzing it silently', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: {
          filePath: 'demo/src/main.ts',
          name: 'main',
        },
        files: [
          {
            filePath: 'demo/src/main.ts',
            sourceText: 'export function main(): string { return "ok"; }',
          },
          {
            filePath: 'demo/src/oversized.ts',
            sourceText: 'x'.repeat(129 * 1024),
          },
        ],
      },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.analysis.status).toBe('partial');
    expect(flow.sources.map((source) => source.filePath)).toEqual([
      'demo/src/main.ts',
    ]);
    expect(flow.analysis.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'limit',
          filePath: 'demo/src/oversized.ts',
        }),
      ]),
    );
  });

  it('rejects repository paths that can escape the selected scope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: { filePath: '../main.ts', name: 'main' },
        files: [
          {
            filePath: '../main.ts',
            sourceText: 'export function main(): void {}',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Unsafe repository path: ../main.ts.',
    });
  });

  it('returns a bounded domain error when the requested exported entry point is absent', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: { filePath: 'demo/main.ts', name: 'missing' },
        files: [
          {
            filePath: 'demo/main.ts',
            sourceText: 'export function main(): void {}',
          },
        ],
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json<{ error: string }>().error).toMatch(
      /Exported entry point missing was not found/,
    );
  });

  it('acquires a bounded public GitHub repository and returns cross-file analysis', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/git/trees/')) {
          return Promise.resolve(
            new Response(
              JSON.stringify({
                tree: [
                  { path: 'README.md', type: 'blob', size: 20 },
                  { path: 'src/index.ts', type: 'blob', size: 120 },
                  { path: 'src/orders.ts', type: 'blob', size: 140 },
                  {
                    path: 'node_modules/lib/index.ts',
                    type: 'blob',
                    size: 100,
                  },
                ],
              }),
              { status: 200 },
            ),
          );
        }
        if (
          url.includes('raw.githubusercontent.com') &&
          url.endsWith('/src/index.ts')
        ) {
          return Promise.resolve(
            new Response(
              "import { createOrder } from './orders.js';\nexport function main(input: string) { return createOrder(input); }\n",
              { status: 200 },
            ),
          );
        }
        if (
          url.includes('raw.githubusercontent.com') &&
          url.endsWith('/src/orders.ts')
        ) {
          return Promise.resolve(
            new Response(
              'export function createOrder(input: string) { return input.trim(); }\n',
              { status: 200 },
            ),
          );
        }
        return Promise.resolve(
          new Response(
            JSON.stringify({ name: 'example-api', default_branch: 'master' }),
            { status: 200 },
          ),
        );
      }),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/analyses',
      payload: { repositoryUrl: 'https://github.com/howlil/example-api' },
    });
    const flow = response.json<FlowProjection>();

    expect(response.statusCode).toBe(200);
    expect(flow.repository).toMatchObject({
      name: 'example-api',
      branch: 'master',
    });
    expect(flow.entryPoints?.[0]).toMatchObject({
      name: 'main',
      confidence: 'detected',
    });
    expect(flow.nodes.map((node) => node.label).sort()).toEqual([
      'createOrder',
      'main',
    ]);
    expect(flow.edges[0]?.evidence[0]?.location.filePath).toBe('src/index.ts');
    expect(flow.analysis?.status).toBe('partial');
  });

  it('normalizes invalid input and unsupported repositories without exposing internals', async () => {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/analyses',
      payload: {
        repositoryUrl: 'https://github.com/howlil/example-api/src/index.ts',
      },
    });
    expect(invalid.statusCode).toBe(400);
    expect(invalid.json()).toMatchObject({ code: 'INVALID_REPOSITORY_URL' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/git/trees/'))
          return Promise.resolve(
            new Response(
              JSON.stringify({ tree: [{ path: 'README.md', type: 'blob' }] }),
              { status: 200 },
            ),
          );
        return Promise.resolve(
          new Response(
            JSON.stringify({ name: 'docs-only', default_branch: 'main' }),
            { status: 200 },
          ),
        );
      }),
    );
    const unsupported = await app.inject({
      method: 'POST',
      url: '/api/analyses',
      payload: { repositoryUrl: 'https://github.com/howlil/docs-only' },
    });
    expect(unsupported.statusCode).toBe(422);
    expect(unsupported.json()).toEqual({
      code: 'UNSUPPORTED_REPOSITORY',
      message: 'No supported TypeScript source found.',
    });
  });
});
