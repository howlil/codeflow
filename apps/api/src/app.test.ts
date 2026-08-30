import type { FlowProjection } from '@codeflow/analysis-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

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
});
