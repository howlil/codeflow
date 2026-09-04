import { describe, expect, it } from 'vitest';

import { buildImpactProjection } from './impact-analysis.js';
import type { Evidence, FlowProjection } from './model.js';

const location = {
  filePath: 'packages/core/src/core.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 1,
  endColumn: 10,
};
const evidence: Evidence[] = [
  {
    kind: 'verified-static',
    source: 'test',
    location,
    reason: 'Static dependency fixture.',
  },
];

describe('buildImpactProjection', () => {
  it('traces direct and bounded transitive downstream impact with evidence paths', () => {
    const impact = buildImpactProjection(
      fixture(),
      ['function:packages/core/src/core.ts:process'],
      3,
    );

    expect(impact.status).toBe('complete');
    expect(impact.results.map((item) => [item.name, item.distance])).toEqual([
      ['handle', 1],
      ['render', 2],
    ]);
    expect(
      impact.results.find((item) => item.name === 'render')?.paths[0]?.steps,
    ).toHaveLength(2);
    expect(impact.summary.directCount).toBe(1);
    expect(impact.summary.transitiveCount).toBe(1);
    expect(impact.summary.affectedPackageIds).toEqual([
      'package:api',
      'package:web',
    ]);
    expect(impact.summary.affectedFileIds).toEqual([
      'file:apps/api/src/handler.ts',
      'file:apps/web/src/page.ts',
    ]);
  });

  it('handles package cycles, multiple seeds, invalid seeds, and deterministic deduplication', () => {
    const impact = buildImpactProjection(
      fixture(),
      [
        'package:core',
        'function:packages/core/src/core.ts:process',
        'missing',
      ],
      4,
    );

    expect(impact.status).toBe('partial');
    expect(impact.issues.some((issue) => issue.kind === 'invalid')).toBe(true);
    expect(
      impact.results.filter((item) => item.entityId === 'package:api'),
    ).toHaveLength(1);
    expect(
      impact.results.find((item) => item.entityId === 'package:api')?.distance,
    ).toBe(1);
    expect(impact.results.some((item) => item.entityId === 'package:core')).toBe(
      false,
    );
  });

  it('uses references, imports, extends, and implements as impact evidence without traversing containment', () => {
    const flow = fixture();
    flow.architecture!.entities.push(
      entity(
        'interface:packages/core/src/core.ts:Contract:1',
        'Interface',
        'Contract',
        'packages/core/src/core.ts',
      ),
      entity(
        'class:apps/api/src/handler.ts:Handler:1',
        'Class',
        'Handler',
        'apps/api/src/handler.ts',
      ),
    );
    flow.architecture!.relationships.push(
      {
        id: 'implements:handler:contract',
        kind: 'IMPLEMENTS',
        sourceId: 'class:apps/api/src/handler.ts:Handler:1',
        targetId: 'interface:packages/core/src/core.ts:Contract:1',
        evidence,
      },
      {
        id: 'imports:web:api',
        kind: 'IMPORTS',
        sourceId: 'file:apps/web/src/page.ts',
        targetId: 'file:apps/api/src/handler.ts',
        evidence,
      },
      {
        id: 'contains:ignored',
        kind: 'CONTAINS',
        sourceId: 'module:apps/api/src',
        targetId: 'file:apps/api/src/handler.ts',
        evidence,
      },
    );

    const contractImpact = buildImpactProjection(
      flow,
      ['interface:packages/core/src/core.ts:Contract:1'],
      2,
    );
    expect(contractImpact.results.map((item) => item.name)).toContain('Handler');

    const fileImpact = buildImpactProjection(
      flow,
      ['file:apps/api/src/handler.ts'],
      2,
    );
    expect(fileImpact.results.map((item) => item.name)).toContain('page.ts');
    expect(fileImpact.results.map((item) => item.entityId)).not.toContain(
      'module:apps/api/src',
    );
  });
});

function fixture(): FlowProjection {
  return {
    id: 'flow:test',
    entryPointId: 'function:apps/web/src/page.ts:render',
    nodes: [
      {
        id: 'function:packages/core/src/core.ts:process',
        kind: 'Function',
        label: 'process',
        location,
        entryPoint: false,
      },
      {
        id: 'function:apps/api/src/handler.ts:handle',
        kind: 'Function',
        label: 'handle',
        location: { ...location, filePath: 'apps/api/src/handler.ts' },
        entryPoint: false,
      },
      {
        id: 'function:apps/web/src/page.ts:render',
        kind: 'Function',
        label: 'render',
        location: { ...location, filePath: 'apps/web/src/page.ts' },
        entryPoint: true,
      },
    ],
    edges: [
      {
        id: 'call:handle:process',
        kind: 'CALLS',
        sourceId: 'function:apps/api/src/handler.ts:handle',
        targetId: 'function:packages/core/src/core.ts:process',
        evidence,
      },
      {
        id: 'call:render:handle',
        kind: 'CALLS',
        sourceId: 'function:apps/web/src/page.ts:render',
        targetId: 'function:apps/api/src/handler.ts:handle',
        evidence,
      },
    ],
    source: { filePath: 'apps/web/src/page.ts', text: '' },
    sources: [],
    analysis: {
      status: 'complete',
      analyzedFileCount: 3,
      ignoredFileCount: 0,
      issues: [],
    },
    functionData: [],
    staticFlow: { steps: [], relationships: [] },
    architecture: {
      rootId: 'repository:.',
      entities: [
        entity(
          'file:packages/core/src/core.ts',
          'File',
          'core.ts',
          'packages/core/src/core.ts',
        ),
        entity(
          'module:packages/core/src',
          'Module',
          'src',
          'packages/core/src',
        ),
        entity(
          'function:packages/core/src/core.ts:process',
          'Function',
          'process',
          'packages/core/src/core.ts',
        ),
        entity(
          'file:apps/api/src/handler.ts',
          'File',
          'handler.ts',
          'apps/api/src/handler.ts',
        ),
        entity('module:apps/api/src', 'Module', 'src', 'apps/api/src'),
        entity(
          'function:apps/api/src/handler.ts:handle',
          'Function',
          'handle',
          'apps/api/src/handler.ts',
        ),
        entity(
          'file:apps/web/src/page.ts',
          'File',
          'page.ts',
          'apps/web/src/page.ts',
        ),
        entity('module:apps/web/src', 'Module', 'src', 'apps/web/src'),
        entity(
          'function:apps/web/src/page.ts:render',
          'Function',
          'render',
          'apps/web/src/page.ts',
        ),
      ],
      relationships: [],
    },
    topology: {
      rootId: 'workspace:.',
      entities: [
        packageEntity('package:core', '@demo/core', 'packages/core'),
        packageEntity('package:api', '@demo/api', 'apps/api'),
        packageEntity('package:web', '@demo/web', 'apps/web'),
      ],
      relationships: [
        dependency('package:api', 'package:core'),
        dependency('package:web', 'package:api'),
        dependency('package:core', 'package:web'),
      ],
      externalDependencies: [],
      fileOwners: {
        'packages/core/src/core.ts': 'package:core',
        'apps/api/src/handler.ts': 'package:api',
        'apps/web/src/page.ts': 'package:web',
      },
      status: 'complete',
      issues: [],
    },
  };
}

function entity(
  id: string,
  kind:
    | 'Module'
    | 'File'
    | 'Function'
    | 'Class'
    | 'Interface',
  name: string,
  path: string,
) {
  return {
    id,
    kind,
    name,
    path,
    location,
    exported: kind !== 'Module' && kind !== 'File',
    evidence,
  } as const;
}

function packageEntity(id: string, name: string, path: string) {
  return {
    id,
    kind: 'Package' as const,
    name,
    path,
    location,
    evidence: [{ ...evidence[0]!, kind: 'configured' as const }],
  };
}

function dependency(sourceId: string, targetId: string) {
  return {
    id: `dep:${sourceId}:${targetId}`,
    kind: 'DEPENDS_ON' as const,
    sourceId,
    targetId,
    evidence: [{ ...evidence[0]!, kind: 'configured' as const }],
  };
}
