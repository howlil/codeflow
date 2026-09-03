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

  it('returns an evidence-backed TypeScript flow projection', async () => {
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
    expect(flow.entryPointId).toContain('handleGreeting');
    expect(flow.edges).toHaveLength(2);
    expect(flow.edges.map((edge) => edge.evidence[0]?.kind)).toEqual(
      expect.arrayContaining(['verified-static', 'inferred-static']),
    );
    expect(flow.source.filePath).toBe('fixtures/request-flow/greeting.ts');
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
    expect(flow.nodes.map((node) => node.label)).toEqual([
      'main',
      'createOrder',
    ]);
    expect(flow.edges[0]?.evidence[0]?.location.filePath).toBe('src/index.ts');
    expect(flow.analysis?.state).toBe('PARTIAL');
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
