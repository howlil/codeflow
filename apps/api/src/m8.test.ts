import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

describe('M8 impact analysis API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('derives impact server-side from the semantic projection', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/impact',
      payload: {
        flow: fixture(),
        seedIds: ['function:core:process'],
        maxDepth: 3,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      status: string;
      results: Array<{ entityId: string; distance: number }>;
    }>();
    expect(body.status).toBe('complete');
    expect(body.results).toEqual([
      { entityId: 'function:api:handle', distance: 1 },
      { entityId: 'function:web:render', distance: 2 },
    ]);
  });

  it('rejects an unbounded change scope', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/impact',
      payload: {
        flow: fixture(),
        seedIds: Array.from({ length: 9 }, (_, index) => `seed:${index}`),
      },
    });

    expect(response.statusCode).toBe(413);
  });
});

function fixture() {
  const evidence = [
    {
      kind: 'verified-static' as const,
      source: 'test',
      location: {
        filePath: 'core.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 5,
      },
      reason: 'Static call fixture.',
    },
  ];

  return {
    id: 'flow:test',
    entryPointId: 'function:web:render',
    nodes: [
      {
        id: 'function:core:process',
        kind: 'Function' as const,
        label: 'process',
        location: evidence[0]!.location,
        entryPoint: false,
      },
      {
        id: 'function:api:handle',
        kind: 'Function' as const,
        label: 'handle',
        location: { ...evidence[0]!.location, filePath: 'api.ts' },
        entryPoint: false,
      },
      {
        id: 'function:web:render',
        kind: 'Function' as const,
        label: 'render',
        location: { ...evidence[0]!.location, filePath: 'web.ts' },
        entryPoint: true,
      },
    ],
    edges: [
      {
        id: 'call:handle:process',
        kind: 'CALLS' as const,
        sourceId: 'function:api:handle',
        targetId: 'function:core:process',
        evidence,
      },
      {
        id: 'call:render:handle',
        kind: 'CALLS' as const,
        sourceId: 'function:web:render',
        targetId: 'function:api:handle',
        evidence,
      },
    ],
    source: { filePath: 'web.ts', text: '' },
    sources: [],
    analysis: {
      status: 'complete' as const,
      analyzedFileCount: 3,
      ignoredFileCount: 0,
      issues: [],
    },
    functionData: [],
    staticFlow: { steps: [], relationships: [] },
  };
}
