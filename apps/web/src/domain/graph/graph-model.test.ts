import { describe, expect, it } from 'vitest';

import type { PullRequestAnalysis } from '../../integrations/api/change-client';
import type { FlowProjection } from '../../integrations/api/flow-client';
import {
  availableGraphLenses,
  buildSemanticGraph,
  graphEdgeMatchesLens,
  graphLevelForKind,
} from './graph-model';

const location = {
  filePath: 'src/orders.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 3,
  endColumn: 2,
};

const flow: FlowProjection = {
  id: 'flow',
  entryPointId: 'function:createOrder',
  nodes: [
    {
      id: 'function:createOrder',
      kind: 'Function',
      label: 'createOrder',
      location,
      entryPoint: true,
    },
    {
      id: 'function:saveOrder',
      kind: 'Function',
      label: 'saveOrder',
      location: { ...location, startLine: 5, endLine: 7 },
      entryPoint: false,
    },
  ],
  edges: [
    {
      id: 'call:create-save',
      kind: 'CALLS',
      sourceId: 'function:createOrder',
      targetId: 'function:saveOrder',
      evidence: [],
    },
  ],
  source: {
    filePath: 'src/orders.ts',
    text: 'export function createOrder() {}',
  },
  sources: [
    { filePath: 'src/orders.ts', text: 'export function createOrder() {}' },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 1,
    ignoredFileCount: 0,
    issues: [],
  },
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
        location,
        exported: false,
        evidence: [],
      },
      {
        id: 'function:createOrder',
        kind: 'Function',
        name: 'createOrder',
        path: 'src/orders.ts',
        location,
        exported: true,
        evidence: [],
      },
      {
        id: 'class:OrderService',
        kind: 'Class',
        name: 'OrderService',
        path: 'src/orders.ts',
        location,
        exported: true,
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'defines:file-create',
        kind: 'DEFINES',
        sourceId: 'file:orders',
        targetId: 'function:createOrder',
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
    ],
    relationships: [
      {
        id: 'contains:workspace-api',
        kind: 'CONTAINS',
        sourceId: 'workspace:demo',
        targetId: 'package:api',
        evidence: [],
      },
    ],
    externalDependencies: [],
    fileOwners: { 'src/orders.ts': 'package:api' },
    status: 'complete',
    issues: [],
  },
};

describe('graph model', () => {
  it('combines code, structure, package, and call relationships into one graph', () => {
    const graph = buildSemanticGraph(flow);

    expect(graph.nodes.some((node) => node.id === 'function:createOrder')).toBe(
      true,
    );
    expect(graph.nodes.some((node) => node.id === 'file:orders')).toBe(true);
    expect(graph.nodes.some((node) => node.id === 'package:api')).toBe(true);
    expect(graph.edges.some((edge) => edge.kind === 'CALLS')).toBe(true);
    expect(graph.edges.some((edge) => edge.kind === 'REFERENCES')).toBe(true);
    expect(graph.edges.some((edge) => edge.kind === 'CONTAINS')).toBe(true);
  });

  it('maps semantic kinds to graph levels and derives only available lenses', () => {
    const graph = buildSemanticGraph(flow);

    expect(graphLevelForKind('Function')).toBe('code');
    expect(graphLevelForKind('File')).toBe('structure');
    expect(graphLevelForKind('Package')).toBe('packages');
    expect(availableGraphLenses(graph)).toEqual([
      'ALL',
      'CALLS',
      'REFERENCES',
      'DEPENDENCIES',
    ]);
    expect(
      graph.edges.filter((edge) => graphEdgeMatchesLens(edge, 'CALLS')),
    ).toHaveLength(1);
  });

  it('projects pull-request entity state onto the same graph', () => {
    const changeAnalysis: PullRequestAnalysis = {
      head: flow,
      base: flow,
      change: {
        source: {
          provider: 'github',
          repository: 'owner/demo',
          pullRequestNumber: 12,
          title: 'Change order flow',
          url: 'https://github.com/owner/demo/pull/12',
          baseRevision: 'base',
          headRevision: 'head',
        },
        files: [],
        entities: [
          {
            id: 'change:createOrder',
            changeKind: 'modified',
            entityKind: 'Function',
            name: 'createOrder',
            path: 'src/orders.ts',
            baseEntityId: 'function:createOrder',
            headEntityId: 'function:createOrder',
            baseLocation: location,
            headLocation: location,
          },
        ],
        behaviorDeltas: [],
        relationshipDeltas: [],
        impact: { base: null, head: null },
        coverage: { status: 'complete', issues: [] },
      },
    };

    const graph = buildSemanticGraph(flow, changeAnalysis);
    expect(
      graph.nodes.find((node) => node.id === 'function:createOrder')
        ?.changeKind,
    ).toBe('modified');
  });
});
