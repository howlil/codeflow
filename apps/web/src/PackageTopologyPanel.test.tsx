import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PackageTopologyPanel } from './PackageTopologyPanel';
import type { FlowProjection } from './flow-client';

const location = {
  filePath: 'apps/web/src/app.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 2,
  endColumn: 2,
};
const evidence = {
  kind: 'configured' as const,
  source: 'package.json',
  location: { ...location, filePath: 'apps/web/package.json' },
  reason: 'Configured package evidence.',
};

const flow: FlowProjection = {
  id: 'flow:function:apps/web/src/app.ts:app',
  entryPointId: 'function:apps/web/src/app.ts:app',
  nodes: [
    {
      id: 'function:apps/web/src/app.ts:app',
      kind: 'Function',
      label: 'app',
      location,
      entryPoint: true,
    },
  ],
  edges: [],
  source: { filePath: location.filePath, text: 'export function app() {}' },
  sources: [{ filePath: location.filePath, text: 'export function app() {}' }],
  analysis: {
    status: 'complete',
    analyzedFileCount: 1,
    ignoredFileCount: 0,
    issues: [],
  },
  architecture: {
    rootId: 'repository:.',
    entities: [
      {
        id: 'file:apps/web/src/app.ts',
        kind: 'File',
        name: 'app.ts',
        path: location.filePath,
        location,
        exported: false,
        evidence: [],
      },
      {
        id: 'function:apps/web/src/app.ts:app',
        kind: 'Function',
        name: 'app',
        path: location.filePath,
        location,
        exported: true,
        evidence: [],
      },
    ],
    relationships: [],
  },
  topology: {
    rootId: 'workspace:.',
    entities: [
      {
        id: 'workspace:.',
        kind: 'Workspace',
        name: 'Workspace',
        path: '.',
        location: null,
        evidence: [evidence],
      },
      {
        id: 'package:apps/web',
        kind: 'Package',
        name: '@demo/web',
        path: 'apps/web',
        location,
        evidence: [evidence],
      },
      {
        id: 'package:packages/core',
        kind: 'Package',
        name: '@demo/core',
        path: 'packages/core',
        location,
        evidence: [evidence],
      },
    ],
    relationships: [
      {
        id: 'depends_on:web:core',
        kind: 'DEPENDS_ON',
        sourceId: 'package:apps/web',
        targetId: 'package:packages/core',
        evidence: [evidence],
      },
    ],
    externalDependencies: [{ packageId: 'package:apps/web', name: 'react' }],
    fileOwners: { 'apps/web/src/app.ts': 'package:apps/web' },
    status: 'complete',
    issues: [],
  },
};

afterEach(cleanup);

describe('PackageTopologyPanel', () => {
  it('shows package dependencies and drills into a function flow', () => {
    const onOpenFunction = vi.fn();
    render(
      <PackageTopologyPanel flow={flow} onOpenFunction={onOpenFunction} />,
    );

    expect(
      screen.getByRole('region', { name: 'System topology' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: '@demo/core package packages/core' }),
    ).toBeTruthy();
    expect(screen.getByText('react')).toBeTruthy();
    expect(screen.getByText('apps/web/src/app.ts')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Open flow' }));
    expect(onOpenFunction).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'Function', name: 'app' }),
    );
  });
});
