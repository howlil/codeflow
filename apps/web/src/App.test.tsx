import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { PullRequestAnalysis } from './change-client';
import type { FlowProjection, ImpactProjection } from './flow-client';

const ordersSource = `export function createOrder() {\n  return saveOrder();\n}\n\nexport function saveOrder() {\n  return persistOrder();\n}\n\nexport function persistOrder() {\n  return true;\n}\n\nexport class OrderService {}\n`;
const dbSource = `export function query() {\n  return true;\n}\n`;

const createLocation = {
  filePath: 'src/orders.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 3,
  endColumn: 2,
};
const saveLocation = {
  filePath: 'src/orders.ts',
  startLine: 5,
  startColumn: 1,
  endLine: 7,
  endColumn: 2,
};
const persistLocation = {
  filePath: 'src/orders.ts',
  startLine: 9,
  startColumn: 1,
  endLine: 11,
  endColumn: 2,
};

const graphFlow: FlowProjection = {
  id: 'flow:orders',
  entryPointId: 'function:createOrder',
  nodes: [
    {
      id: 'function:createOrder',
      kind: 'Function',
      label: 'createOrder',
      location: createLocation,
      entryPoint: true,
    },
    {
      id: 'function:saveOrder',
      kind: 'Function',
      label: 'saveOrder',
      location: saveLocation,
      entryPoint: false,
    },
    {
      id: 'function:persistOrder',
      kind: 'Function',
      label: 'persistOrder',
      location: persistLocation,
      entryPoint: false,
    },
  ],
  edges: [
    {
      id: 'call:create-save',
      kind: 'CALLS',
      sourceId: 'function:createOrder',
      targetId: 'function:saveOrder',
      evidence: [
        {
          kind: 'verified-static',
          source: 'typescript-compiler-api',
          reason: 'Direct symbol resolution.',
          location: { ...createLocation, startLine: 2, endLine: 2 },
        },
      ],
    },
    {
      id: 'call:save-persist',
      kind: 'CALLS',
      sourceId: 'function:saveOrder',
      targetId: 'function:persistOrder',
      evidence: [
        {
          kind: 'verified-static',
          source: 'typescript-compiler-api',
          reason: 'Direct symbol resolution.',
          location: { ...saveLocation, startLine: 6, endLine: 6 },
        },
      ],
    },
  ],
  source: { filePath: 'src/orders.ts', text: ordersSource },
  sources: [
    { filePath: 'src/orders.ts', text: ordersSource },
    { filePath: 'src/db.ts', text: dbSource },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 2,
    ignoredFileCount: 0,
    issues: [],
  },
  repository: {
    name: 'demo',
    url: 'https://github.com/owner/demo',
    branch: 'main',
    revision: 'head123',
  },
  entryPoints: [
    {
      id: 'function:createOrder',
      name: 'createOrder',
      filePath: 'src/orders.ts',
      confidence: 'detected',
      reason: 'Exported function.',
    },
    {
      id: 'function:persistOrder',
      name: 'persistOrder',
      filePath: 'src/orders.ts',
      confidence: 'likely',
      reason: 'Exported function.',
    },
  ],
  architecture: {
    rootId: 'repository:demo',
    entities: [
      {
        id: 'repository:demo',
        kind: 'Repository',
        name: 'demo',
        path: '.',
        location: null,
        exported: false,
        evidence: [],
      },
      {
        id: 'file:orders',
        kind: 'File',
        name: 'orders.ts',
        path: 'src/orders.ts',
        location: createLocation,
        exported: false,
        evidence: [],
      },
      {
        id: 'file:db',
        kind: 'File',
        name: 'db.ts',
        path: 'src/db.ts',
        location: { ...createLocation, filePath: 'src/db.ts' },
        exported: false,
        evidence: [],
      },
      {
        id: 'function:createOrder',
        kind: 'Function',
        name: 'createOrder',
        path: 'src/orders.ts',
        location: createLocation,
        exported: true,
        evidence: [],
      },
      {
        id: 'function:saveOrder',
        kind: 'Function',
        name: 'saveOrder',
        path: 'src/orders.ts',
        location: saveLocation,
        exported: true,
        evidence: [],
      },
      {
        id: 'function:persistOrder',
        kind: 'Function',
        name: 'persistOrder',
        path: 'src/orders.ts',
        location: persistLocation,
        exported: true,
        evidence: [],
      },
      {
        id: 'class:OrderService',
        kind: 'Class',
        name: 'OrderService',
        path: 'src/orders.ts',
        location: { ...persistLocation, startLine: 13, endLine: 13 },
        exported: true,
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'contains:repo-orders',
        kind: 'CONTAINS',
        sourceId: 'repository:demo',
        targetId: 'file:orders',
        evidence: [],
      },
      {
        id: 'contains:repo-db',
        kind: 'CONTAINS',
        sourceId: 'repository:demo',
        targetId: 'file:db',
        evidence: [],
      },
      {
        id: 'defines:orders-create',
        kind: 'DEFINES',
        sourceId: 'file:orders',
        targetId: 'function:createOrder',
        evidence: [],
      },
      {
        id: 'imports:orders-db',
        kind: 'IMPORTS',
        sourceId: 'file:orders',
        targetId: 'file:db',
        evidence: [],
      },
      {
        id: 'references:create-service',
        kind: 'REFERENCES',
        sourceId: 'function:createOrder',
        targetId: 'class:OrderService',
        evidence: [],
      },
    ],
  },
  topology: {
    rootId: 'workspace:demo',
    entities: [
      {
        id: 'workspace:demo',
        kind: 'Workspace',
        name: 'demo',
        path: '.',
        location: null,
        evidence: [],
      },
      {
        id: 'package:api',
        kind: 'Package',
        name: 'api',
        path: 'apps/api',
        location: null,
        evidence: [],
      },
      {
        id: 'package:data',
        kind: 'Package',
        name: 'data',
        path: 'packages/data',
        location: null,
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'contains:workspace-api',
        kind: 'CONTAINS',
        sourceId: 'workspace:demo',
        targetId: 'package:api',
        evidence: [],
      },
      {
        id: 'contains:workspace-data',
        kind: 'CONTAINS',
        sourceId: 'workspace:demo',
        targetId: 'package:data',
        evidence: [],
      },
      {
        id: 'depends:api-data',
        kind: 'DEPENDS_ON',
        sourceId: 'package:api',
        targetId: 'package:data',
        evidence: [],
      },
    ],
    externalDependencies: [],
    fileOwners: {
      'src/orders.ts': 'package:api',
      'src/db.ts': 'package:data',
    },
    status: 'complete',
    issues: [],
  },
};

const impactProjection: ImpactProjection = {
  seeds: [
    {
      entityId: 'function:saveOrder',
      entityKind: 'Function',
      name: 'saveOrder',
      path: 'src/orders.ts',
    },
  ],
  results: [
    {
      entityId: 'function:createOrder',
      entityKind: 'Function',
      name: 'createOrder',
      path: 'src/orders.ts',
      distance: 1,
      seedIds: ['function:saveOrder'],
      paths: [
        {
          seedId: 'function:saveOrder',
          steps: [
            {
              sourceId: 'function:createOrder',
              targetId: 'function:saveOrder',
              kind: 'CALLS',
              evidence: [],
            },
          ],
        },
      ],
      evidence: [],
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
};

const pullRequestAnalysis: PullRequestAnalysis = {
  base: graphFlow,
  head: graphFlow,
  change: {
    source: {
      provider: 'github',
      repository: 'owner/demo',
      pullRequestNumber: 12,
      title: 'Change order flow',
      url: 'https://github.com/owner/demo/pull/12',
      baseRevision: 'base123456',
      headRevision: 'head123456',
    },
    files: [],
    entities: [
      {
        id: 'change:create',
        changeKind: 'modified',
        entityKind: 'Function',
        name: 'createOrder',
        path: 'src/orders.ts',
        baseEntityId: 'function:createOrder',
        headEntityId: 'function:createOrder',
        baseLocation: createLocation,
        headLocation: createLocation,
      },
      {
        id: 'change:persist',
        changeKind: 'added',
        entityKind: 'Function',
        name: 'persistOrder',
        path: 'src/orders.ts',
        baseEntityId: null,
        headEntityId: 'function:persistOrder',
        baseLocation: null,
        headLocation: persistLocation,
      },
    ],
    behaviorDeltas: [
      {
        changeEntityId: 'change:create',
        functionName: 'createOrder',
        path: 'src/orders.ts',
        baseFunctionId: 'function:createOrder',
        headFunctionId: 'function:createOrder',
        items: [
          {
            id: 'behavior:return',
            changeKind: 'added',
            category: 'return',
            kind: 'return',
            label: 'return saveOrder()',
            detail: 'saveOrder()',
            snapshot: 'head',
            location: createLocation,
            evidence: [],
          },
        ],
        summary: {
          addedCount: 1,
          removedCount: 0,
          parameterCount: 0,
          returnCount: 1,
          stepCount: 0,
          relationshipCount: 0,
        },
      },
    ],
    relationshipDeltas: [],
    impact: { base: null, head: null },
    coverage: { status: 'complete', issues: [] },
  },
};

function apiResponse(payload: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => payload,
  };
}

function stubApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/api/analyses')) {
      return apiResponse(graphFlow);
    }
    if (url.endsWith('/api/flows/impact')) {
      return apiResponse(impactProjection);
    }
    if (url.endsWith('/api/changes/github')) {
      return apiResponse(pullRequestAnalysis);
    }
    throw new Error(`Unexpected request: ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openRepository() {
  const fetchMock = stubApi();
  render(<App />);
  fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
    target: { value: 'https://github.com/owner/demo' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Open code graph' }));
  await screen.findByRole('region', { name: 'Semantic code graph' });
  return fetchMock;
}

describe('App graph-first product', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('starts from repository visualization instead of product-mode selection', () => {
    const fetchMock = stubApi();
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Visualize how a codebase connects' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Public GitHub repository URL')).toBeInTheDocument();
    expect(
      screen.getByText('Visualize pull request changes on the graph'),
    ).toBeInTheDocument();
    expect(screen.queryByText('What do you need to understand?')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('lands directly in one graph and progressively expands call paths', async () => {
    await openRepository();

    expect(
      screen.getByRole('region', { name: 'Code graph explorer' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Explore' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Flow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Impact' })).not.toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /Function createOrder/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Function saveOrder/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Function persistOrder/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Function saveOrder/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Expand outgoing' }));

    expect(
      screen.getByRole('button', { name: /Function persistOrder/ }),
    ).toBeInTheDocument();
  });

  it('uses semantic search and graph levels as navigation rather than separate workspaces', async () => {
    await openRepository();

    const search = screen.getByRole('searchbox', { name: 'Search code graph' });
    fireEvent.change(search, { target: { value: 'OrderService' } });
    fireEvent.click(screen.getByRole('option', { name: /OrderService/ }));

    expect(
      screen.getByRole('button', { name: /Class OrderService/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Structure/ }));
    expect(
      screen.getByRole('button', { name: /File orders\.ts/ }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Packages/ }));
    expect(
      screen.getByRole('button', { name: /Package api/ }),
    ).toBeInTheDocument();
  });

  it('turns downstream impact into a graph operation on the selected entity', async () => {
    const fetchMock = await openRepository();

    fireEvent.click(screen.getByRole('button', { name: /Function saveOrder/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Show dependents' }));

    expect(await screen.findByText(/Dependents: 1 direct/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Clear dependents' }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('renders pull-request analysis as change state over the same graph', async () => {
    stubApi();
    render(<App />);

    fireEvent.click(
      screen.getByText('Visualize pull request changes on the graph'),
    );
    fireEvent.change(screen.getByLabelText('Public GitHub pull request URL'), {
      target: { value: 'https://github.com/owner/demo/pull/12' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze pull request' }));

    await screen.findByRole('region', { name: 'Semantic code graph' });
    expect(screen.getByText('Change overlay')).toBeInTheDocument();
    expect(screen.getByText(/PR #12 · Change order flow/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Function createOrder modified/ }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /Function createOrder modified/ }),
    );
    expect(screen.getByText('Behavior delta')).toBeInTheDocument();
    expect(screen.getByText('return saveOrder()')).toBeInTheDocument();
  });

  it('persists explicit theme selection', () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    );
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('codeflow-theme')).toBe('light');
  });
});
