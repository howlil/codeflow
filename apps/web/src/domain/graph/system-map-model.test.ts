import { describe, expect, it } from 'vitest';

import type { FlowProjection } from '../../integrations/api/flow-client';
import { buildSemanticGraph } from './graph-model';
import {
  buildSystemMapProjection,
  classifySystemConcern,
  selectSystemMapEdges,
  selectSystemMapNodes,
  systemEdgeKind,
} from './system-map-model';

const location = {
  filePath: 'src/app.ts',
  startLine: 1,
  startColumn: 1,
  endLine: 2,
  endColumn: 1,
};

const flow: FlowProjection = {
  id: 'flow',
  entryPointId: 'function:page',
  nodes: [
    {
      id: 'function:page',
      kind: 'Function',
      label: 'CheckoutPage',
      location: { ...location, filePath: 'apps/web/src/CheckoutPage.tsx' },
      entryPoint: true,
    },
    {
      id: 'function:component',
      kind: 'Function',
      label: 'CheckoutForm',
      location: {
        ...location,
        filePath: 'apps/web/src/components/CheckoutForm.tsx',
      },
      entryPoint: false,
    },
    {
      id: 'function:service',
      kind: 'Function',
      label: 'CheckoutService',
      location: { ...location, filePath: 'apps/web/src/features/checkout.ts' },
      entryPoint: false,
    },
    {
      id: 'function:core',
      kind: 'Function',
      label: 'createOrder',
      location: { ...location, filePath: 'packages/core/domain/order.ts' },
      entryPoint: false,
    },
    {
      id: 'function:gateway',
      kind: 'Function',
      label: 'PaymentGateway',
      location: {
        ...location,
        filePath: 'apps/api/src/integrations/payment.ts',
      },
      entryPoint: false,
    },
    {
      id: 'function:test',
      kind: 'Function',
      label: 'creates an order',
      location: { ...location, filePath: 'apps/web/src/checkout.test.ts' },
      entryPoint: false,
    },
  ],
  edges: [
    {
      id: 'call:page-component',
      kind: 'CALLS',
      sourceId: 'function:page',
      targetId: 'function:component',
      evidence: [],
    },
    {
      id: 'call:component-service',
      kind: 'CALLS',
      sourceId: 'function:component',
      targetId: 'function:service',
      evidence: [],
    },
    {
      id: 'call:service-core',
      kind: 'CALLS',
      sourceId: 'function:service',
      targetId: 'function:core',
      evidence: [],
    },
    {
      id: 'call:core-gateway',
      kind: 'CALLS',
      sourceId: 'function:core',
      targetId: 'function:gateway',
      evidence: [],
    },
    {
      id: 'call:test-core',
      kind: 'CALLS',
      sourceId: 'function:test',
      targetId: 'function:core',
      evidence: [],
    },
  ],
  source: {
    filePath: 'apps/web/src/CheckoutPage.tsx',
    text: 'export function CheckoutPage() {}',
  },
  sources: [],
  analysis: {
    status: 'complete',
    analyzedFileCount: 6,
    ignoredFileCount: 0,
    issues: [],
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
        id: 'package:web',
        kind: 'Package',
        name: 'web',
        path: 'apps/web',
        location: null,
        evidence: [],
      },
    ],
    relationships: [],
    externalDependencies: [
      { packageId: 'package:web', name: 'react' },
      { packageId: 'package:web', name: 'motion' },
    ],
    fileOwners: {},
    status: 'complete',
    issues: [],
  },
};

describe('system map model', () => {
  it('classifies source-backed concerns without treating entry points as a separate concern', () => {
    const graph = buildSemanticGraph(flow);
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));

    expect(classifySystemConcern(byId.get('function:page')!).concern).toBe(
      'ui',
    );
    expect(classifySystemConcern(byId.get('function:component')!).concern).toBe(
      'component',
    );
    expect(classifySystemConcern(byId.get('function:service')!).concern).toBe(
      'application',
    );
    expect(classifySystemConcern(byId.get('function:core')!).concern).toBe(
      'core',
    );
    expect(classifySystemConcern(byId.get('function:gateway')!).concern).toBe(
      'infrastructure',
    );
    expect(classifySystemConcern(byId.get('function:test')!).concern).toBe(
      'test',
    );
  });

  it('keeps tests visible but separate from runtime flow and groups configured dependencies', () => {
    const projection = buildSystemMapProjection(flow, buildSemanticGraph(flow));
    const systemNodes = selectSystemMapNodes(projection, 'system');
    const runtimeNodes = selectSystemMapNodes(projection, 'runtime');
    const testNodes = selectSystemMapNodes(projection, 'tests');

    expect(systemNodes.some((node) => node.concern === 'test')).toBe(true);
    expect(runtimeNodes.some((node) => node.concern === 'test')).toBe(false);
    expect(testNodes.map((node) => node.id)).toContain('function:test');
    expect(testNodes.map((node) => node.id)).toContain('function:core');
    expect(projection.externalDependencies).toEqual([
      {
        packageId: 'package:web',
        packageName: 'web',
        packagePath: 'apps/web',
        dependencies: ['motion', 'react'],
      },
    ]);
  });

  it('normalizes technical relationships into user-facing semantic edge kinds', () => {
    const projection = buildSystemMapProjection(flow, buildSemanticGraph(flow));
    const nodes = selectSystemMapNodes(projection, 'system');
    const edges = selectSystemMapEdges(projection, nodes, 'system');

    expect(systemEdgeKind('CALLS')).toBe('CALL');
    expect(systemEdgeKind('IMPORTS')).toBe('DEPENDENCY');
    expect(edges.some((edge) => edge.semanticKind === 'CALL')).toBe(true);
  });
});
