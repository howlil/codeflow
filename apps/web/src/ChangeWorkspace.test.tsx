import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChangeWorkspace } from './ChangeWorkspace';
import type { PullRequestAnalysis } from './change-client';

const location = {
  filePath: 'core.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 3,
  endColumn: 2,
};
const evidence = [
  {
    kind: 'verified-static' as const,
    source: 'test',
    location,
    reason: 'Static call evidence.',
  },
];

function flow(revision: string) {
  return {
    id: `flow:${revision}`,
    entryPointId: 'function:web:render',
    nodes: [
      {
        id: 'function:core:process',
        kind: 'Function' as const,
        label: 'processPayment',
        location,
        entryPoint: false,
      },
      {
        id: 'function:api:handle',
        kind: 'Function' as const,
        label: 'handle',
        location: { ...location, filePath: 'api.ts' },
        entryPoint: false,
      },
      {
        id: 'function:web:render',
        kind: 'Function' as const,
        label: 'render',
        location: { ...location, filePath: 'web.ts' },
        entryPoint: true,
      },
    ],
    edges: [],
    source: { filePath: 'web.ts', text: '' },
    sources: [],
    analysis: {
      status: 'complete' as const,
      analyzedFileCount: 3,
      ignoredFileCount: 0,
      issues: [],
    },
    repository: { name: 'repo', revision },
  };
}

function fixture(): PullRequestAnalysis {
  const head = flow('head456');
  const base = flow('base123');
  return {
    base,
    head,
    change: {
      source: {
        provider: 'github',
        repository: 'demo/repo',
        pullRequestNumber: 7,
        title: 'Change payment flow',
        url: 'https://github.com/demo/repo/pull/7',
        baseRevision: 'base123456789',
        headRevision: 'head456789012',
      },
      files: [
        {
          path: 'core.ts',
          previousPath: null,
          status: 'modified',
          additions: 1,
          deletions: 1,
          patch:
            '@@ -1,3 +1,3 @@\n export function processPayment() {\n-  return 1;\n+  return 2;\n }',
          hunks: [
            {
              header: '@@ -1,3 +1,3 @@',
              oldStart: 1,
              oldLines: 3,
              newStart: 1,
              newLines: 3,
            },
          ],
          supported: true,
          semanticChangeIds: [
            'change:modified:Function:core.ts:processPayment',
          ],
        },
      ],
      entities: [
        {
          id: 'change:modified:Function:core.ts:processPayment',
          changeKind: 'modified',
          entityKind: 'Function',
          name: 'processPayment',
          path: 'core.ts',
          baseEntityId: 'function:core:process',
          headEntityId: 'function:core:process',
          baseLocation: location,
          headLocation: location,
        },
      ],
      behaviorDeltas: [
        {
          changeEntityId: 'change:modified:Function:core.ts:processPayment',
          functionName: 'processPayment',
          path: 'core.ts',
          baseFunctionId: 'function:core:process',
          headFunctionId: 'function:core:process',
          items: [
            {
              id: 'behavior:removed:return',
              changeKind: 'removed',
              category: 'return',
              kind: 'return',
              label: 'Return expression',
              detail: '1',
              snapshot: 'base',
              location,
              evidence,
            },
            {
              id: 'behavior:added:return',
              changeKind: 'added',
              category: 'return',
              kind: 'return',
              label: 'Return expression',
              detail: '2',
              snapshot: 'head',
              location,
              evidence,
            },
          ],
          summary: {
            addedCount: 1,
            removedCount: 1,
            parameterCount: 0,
            returnCount: 2,
            stepCount: 0,
            relationshipCount: 0,
          },
        },
      ],
      relationshipDeltas: [
        {
          id: 'delta:1',
          changeKind: 'added',
          relationshipKind: 'CALLS',
          source: { kind: 'Function', name: 'handle', path: 'api.ts' },
          target: {
            kind: 'Function',
            name: 'processPayment',
            path: 'core.ts',
          },
        },
      ],
      impact: {
        base: null,
        head: {
          seeds: [
            {
              entityId: 'function:core:process',
              entityKind: 'Function',
              name: 'processPayment',
              path: 'core.ts',
            },
          ],
          results: [
            {
              entityId: 'function:api:handle',
              entityKind: 'Function',
              name: 'handle',
              path: 'api.ts',
              distance: 1,
              seedIds: ['function:core:process'],
              paths: [
                {
                  seedId: 'function:core:process',
                  steps: [
                    {
                      sourceId: 'function:api:handle',
                      targetId: 'function:core:process',
                      kind: 'CALLS',
                      evidence,
                    },
                  ],
                },
              ],
              evidence,
            },
          ],
          summary: {
            directCount: 1,
            transitiveCount: 0,
            byKind: { Function: 1 },
            affectedPackageIds: [],
            affectedModuleIds: [],
            affectedFileIds: [],
          },
          maxDepth: 3,
          status: 'complete',
          issues: [],
        },
      },
      coverage: { status: 'complete', issues: [] },
    },
  };
}

describe('M10 change workspace', () => {
  it('connects actual diff, static behavior delta, downstream evidence, and function flow', () => {
    const onOpenFunction = vi.fn();
    render(
      <ChangeWorkspace
        analysis={fixture()}
        onOpenFunction={onOpenFunction}
        onChangeRepository={() => undefined}
      />,
    );

    expect(screen.getByText('Change payment flow')).toBeTruthy();
    expect(screen.getAllByText('processPayment').length).toBeGreaterThan(0);
    expect(screen.getByText(/return 2;/)).toBeTruthy();
    expect(screen.getByText('Static behavior delta')).toBeTruthy();
    expect(screen.getByText(/BASE → HEAD/)).toBeTruthy();
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getByText('handle')).toBeTruthy();
    expect(screen.getAllByText('CALLS').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Static call evidence/).length).toBeGreaterThan(
      0,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open function flow' }));
    expect(onOpenFunction).toHaveBeenCalledWith(
      'head',
      expect.objectContaining({ id: 'flow:head456' }),
      'function:api:handle',
    );
  });
});
