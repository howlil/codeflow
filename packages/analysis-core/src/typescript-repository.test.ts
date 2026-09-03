import { describe, expect, it } from 'vitest';

import { analyzeTypeScriptRepository, discoverEntryPoints } from './index.js';

describe('TypeScript repository analysis', () => {
  it('resolves calls across repository files with repository-relative evidence', () => {
    const result = analyzeTypeScriptRepository({
      files: [
        {
          filePath: 'src/http/server.ts',
          text: `import { createOrder } from '../orders.js';

export function handleRequest(input: string): string {
  return createOrder(input);
}
`,
        },
        {
          filePath: 'src/orders.ts',
          text: `export function createOrder(input: string): string {
  return validateOrder(input);
}

function validateOrder(input: string): string {
  return input.trim();
}
`,
        },
      ],
      repository: { name: 'example-api', branch: 'master' },
    });

    expect(result.entryPoints[0]).toMatchObject({
      name: 'handleRequest',
      filePath: 'src/http/server.ts',
      confidence: 'detected',
    });
    expect(result.projection.entryPointId).toContain('handleRequest');
    expect(result.projection.nodes.map((node) => node.label)).toEqual([
      'handleRequest',
      'createOrder',
      'validateOrder',
    ]);
    expect(result.projection.edges).toHaveLength(2);
    expect(result.projection.edges[0]?.evidence[0]?.location.filePath).toBe(
      'src/http/server.ts',
    );
    expect(result.projection.sources).toHaveLength(2);
  });

  it('returns deterministic entry suggestions and preserves partial limitations', () => {
    const entities = [
      {
        id: 'function:src/index.ts:main',
        kind: 'Function' as const,
        name: 'main',
        location: {
          filePath: 'src/index.ts',
          startLine: 1,
          startColumn: 1,
          endLine: 3,
          endColumn: 2,
        },
        attributes: { exported: true },
      },
      {
        id: 'function:src/domain.ts:createUser',
        kind: 'Function' as const,
        name: 'createUser',
        location: {
          filePath: 'src/domain.ts',
          startLine: 1,
          startColumn: 1,
          endLine: 3,
          endColumn: 2,
        },
        attributes: { exported: true },
      },
    ];
    expect(
      discoverEntryPoints(entities).map((entryPoint) => entryPoint.name),
    ).toEqual(['main', 'createUser']);
  });
});
