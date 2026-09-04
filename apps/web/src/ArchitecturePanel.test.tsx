import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ArchitecturePanel } from './ArchitecturePanel';
import type { FlowProjection } from './flow-client';

const location = {
  filePath: 'apps/api/src/handler.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 3,
  endColumn: 2,
};
const evidence = {
  kind: 'verified-static' as const,
  source: 'typescript-compiler-api',
  location,
  reason: 'Source-backed static evidence.',
};

const flow: FlowProjection = {
  id: 'flow:function:apps/api/src/handler.ts:handleUser',
  entryPointId: 'function:apps/api/src/handler.ts:handleUser',
  nodes: [
    {
      id: 'function:apps/api/src/handler.ts:handleUser',
      kind: 'Function',
      label: 'handleUser',
      location,
      entryPoint: true,
    },
  ],
  edges: [],
  source: {
    filePath: 'apps/api/src/handler.ts',
    text: 'export function handleUser() {}',
  },
  sources: [
    {
      filePath: 'apps/api/src/handler.ts',
      text: 'export function handleUser() {}',
    },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 1,
    ignoredFileCount: 0,
    issues: [],
  },
  functionData: [],
  staticFlow: { steps: [], relationships: [] },
  architecture: {
    rootId: 'repository:.',
    entities: [
      {
        id: 'repository:.',
        kind: 'Repository',
        name: 'Repository',
        path: '.',
        location: null,
        exported: false,
        evidence: [],
      },
      {
        id: 'module:apps',
        kind: 'Module',
        name: 'apps',
        path: 'apps',
        location,
        exported: false,
        evidence: [evidence],
      },
      {
        id: 'file:apps/api/src/handler.ts',
        kind: 'File',
        name: 'handler.ts',
        path: 'apps/api/src/handler.ts',
        location,
        exported: false,
        evidence: [evidence],
      },
      {
        id: 'function:apps/api/src/handler.ts:handleUser',
        kind: 'Function',
        name: 'handleUser',
        path: 'apps/api/src/handler.ts',
        location,
        exported: true,
        evidence: [evidence],
      },
    ],
    relationships: [
      {
        id: 'contains:repository:.:module:apps',
        kind: 'CONTAINS',
        sourceId: 'repository:.',
        targetId: 'module:apps',
        evidence: [evidence],
      },
      {
        id: 'defines:file:handler:function:handle',
        kind: 'DEFINES',
        sourceId: 'file:apps/api/src/handler.ts',
        targetId: 'function:apps/api/src/handler.ts:handleUser',
        evidence: [evidence],
      },
    ],
  },
};

afterEach(cleanup);

describe('ArchitecturePanel', () => {
  it('searches repository entities and opens projected function flow', () => {
    const onOpenFunction = vi.fn();
    render(<ArchitecturePanel flow={flow} onOpenFunction={onOpenFunction} />);

    expect(screen.getByText('System → module → file → symbol')).toBeTruthy();
    expect(screen.getByText('1 modules')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Search repository architecture'), {
      target: { value: 'handleUser' },
    });
    fireEvent.click(screen.getByRole('option', { name: /handleUser/i }));

    expect(
      screen.getByText('Defined at apps/api/src/handler.ts:L1'),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Open function flow' }));

    expect(onOpenFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'function:apps/api/src/handler.ts:handleUser',
        kind: 'Function',
      }),
    );
  });

  it('can focus a selected architecture entity', () => {
    render(<ArchitecturePanel flow={flow} onOpenFunction={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /apps Module/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Focus' }));

    expect(screen.getByText('Focused neighborhood')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Back to repository' }),
    ).toBeTruthy();
  });
});
