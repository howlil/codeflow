import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ImpactPanel } from './ImpactPanel';
import type { FlowProjection, ImpactProjection } from './flow-client';

const location = {
  filePath: 'packages/core/src/core.ts',
  startLine: 8,
  startColumn: 1,
  endLine: 8,
  endColumn: 12,
};
const evidence = [
  {
    kind: 'verified-static' as const,
    source: 'test',
    location,
    reason: 'handle calls process in analyzed source.',
  },
];

const flow: FlowProjection = {
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
  edges: [],
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
      architectureFunction(
        'function:packages/core/src/core.ts:process',
        'process',
        'packages/core/src/core.ts',
      ),
      architectureFunction(
        'function:apps/api/src/handler.ts:handle',
        'handle',
        'apps/api/src/handler.ts',
      ),
      architectureFunction(
        'function:apps/web/src/page.ts:render',
        'render',
        'apps/web/src/page.ts',
      ),
    ],
    relationships: [],
  },
};

const impact: ImpactProjection = {
  seeds: [
    {
      entityId: 'function:packages/core/src/core.ts:process',
      entityKind: 'Function',
      name: 'process',
      path: 'packages/core/src/core.ts',
    },
  ],
  results: [
    {
      entityId: 'function:apps/api/src/handler.ts:handle',
      entityKind: 'Function',
      name: 'handle',
      path: 'apps/api/src/handler.ts',
      distance: 1,
      seedIds: ['function:packages/core/src/core.ts:process'],
      paths: [
        {
          seedId: 'function:packages/core/src/core.ts:process',
          steps: [
            {
              sourceId: 'function:apps/api/src/handler.ts:handle',
              targetId: 'function:packages/core/src/core.ts:process',
              kind: 'CALLS',
              evidence,
            },
          ],
        },
      ],
      evidence,
    },
    {
      entityId: 'function:apps/web/src/page.ts:render',
      entityKind: 'Function',
      name: 'render',
      path: 'apps/web/src/page.ts',
      distance: 2,
      seedIds: ['function:packages/core/src/core.ts:process'],
      paths: [
        {
          seedId: 'function:packages/core/src/core.ts:process',
          steps: [
            {
              sourceId: 'function:apps/web/src/page.ts:render',
              targetId: 'function:apps/api/src/handler.ts:handle',
              kind: 'CALLS',
              evidence,
            },
            {
              sourceId: 'function:apps/api/src/handler.ts:handle',
              targetId: 'function:packages/core/src/core.ts:process',
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
    transitiveCount: 1,
    byKind: { Function: 2 },
    affectedPackageIds: [],
    affectedModuleIds: [],
    affectedFileIds: [],
  },
  maxDepth: 3,
  status: 'complete',
  issues: [],
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('ImpactPanel', () => {
  it('builds a change scope, traces impact, inspects evidence, focuses a path, and opens flow', async () => {
    const onOpenFunction = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => impact,
      }),
    );

    render(<ImpactPanel flow={flow} onOpenFunction={onOpenFunction} />);
    const region = screen.getByRole('region', {
      name: 'Change impact explorer',
    });

    fireEvent.change(
      within(region).getByRole('searchbox', { name: 'Search change targets' }),
      { target: { value: 'process' } },
    );
    fireEvent.click(within(region).getByRole('option', { name: /process/i }));
    expect(
      within(region).getByRole('button', {
        name: 'Remove process from impact scope',
      }),
    ).toBeTruthy();

    fireEvent.click(
      within(region).getByRole('button', { name: 'Trace impact' }),
    );

    await waitFor(() => {
      expect(within(region).getByText('1 direct')).toBeTruthy();
      expect(within(region).getByText('1 transitive')).toBeTruthy();
    });

    const results = within(region).getByLabelText(
      'Potential downstream impact',
    );
    fireEvent.click(within(results).getByRole('button', { name: /handle/i }));
    expect(within(region).getByText('Direct · 1 hop')).toBeTruthy();
    expect(
      within(region).getByText(/packages\/core\/src\/core.ts:L8/),
    ).toBeTruthy();
    expect(
      within(region).getByText('handle calls process in analyzed source.'),
    ).toBeTruthy();

    fireEvent.click(within(region).getByRole('button', { name: 'Focus path' }));
    expect(
      within(region).getByRole('button', { name: 'Back to impact results' }),
    ).toBeTruthy();

    fireEvent.click(
      within(region).getByRole('button', { name: 'Open function flow' }),
    );
    expect(onOpenFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'function:apps/api/src/handler.ts:handle',
        kind: 'Function',
      }),
    );
  });

  it('states partial coverage without claiming safety', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () =>
          ({
            ...impact,
            results: [],
            summary: {
              ...impact.summary,
              directCount: 0,
              transitiveCount: 0,
            },
            status: 'partial',
            issues: [
              {
                kind: 'limit',
                filePath: 'large.ts',
                message: 'Source was outside the bounded analysis.',
              },
            ],
          }) satisfies ImpactProjection,
      }),
    );

    render(<ImpactPanel flow={flow} onOpenFunction={vi.fn()} />);
    const region = screen.getByRole('region', {
      name: 'Change impact explorer',
    });
    fireEvent.change(
      within(region).getByRole('searchbox', { name: 'Search change targets' }),
      { target: { value: 'process' } },
    );
    fireEvent.click(within(region).getByRole('option', { name: /process/i }));
    fireEvent.click(
      within(region).getByRole('button', { name: 'Trace impact' }),
    );

    expect(
      await within(region).findByText('No known downstream dependency found.'),
    ).toBeTruthy();
    expect(
      within(region).getByText(
        /absence from the result set is not a safety guarantee/i,
      ),
    ).toBeTruthy();
    expect(
      within(region).getByText(/Source was outside the bounded analysis/),
    ).toBeTruthy();
  });
});

function architectureFunction(id: string, name: string, path: string) {
  return {
    id,
    kind: 'Function' as const,
    name,
    path,
    location: { ...location, filePath: path },
    exported: true,
    evidence,
  };
}
