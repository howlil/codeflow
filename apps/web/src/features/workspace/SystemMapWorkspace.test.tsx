import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FlowProjection } from '../../integrations/api/flow-client';
import { SystemMapWorkspace } from './SystemMapWorkspace';

const location = (filePath: string, startLine = 1) => ({
  filePath,
  startLine,
  startColumn: 1,
  endLine: startLine + 2,
  endColumn: 2,
});

const flow: FlowProjection = {
  id: 'system-map-fixture',
  entryPointId: 'function:App',
  nodes: [
    {
      id: 'function:App',
      kind: 'Function',
      label: 'App',
      location: location('src/App.tsx'),
      entryPoint: true,
    },
    {
      id: 'function:CheckoutService',
      kind: 'Function',
      label: 'CheckoutService',
      location: location('src/features/checkout/CheckoutService.ts'),
      entryPoint: false,
    },
    {
      id: 'function:createOrder',
      kind: 'Function',
      label: 'createOrder',
      location: location('src/domain/order/createOrder.ts'),
      entryPoint: false,
    },
    {
      id: 'function:PaymentGateway',
      kind: 'Function',
      label: 'PaymentGateway',
      location: location('src/integrations/payment/PaymentGateway.ts'),
      entryPoint: false,
    },
  ],
  edges: [
    {
      id: 'call:app-service',
      kind: 'CALLS',
      sourceId: 'function:App',
      targetId: 'function:CheckoutService',
      evidence: [],
    },
    {
      id: 'call:service-core',
      kind: 'CALLS',
      sourceId: 'function:CheckoutService',
      targetId: 'function:createOrder',
      evidence: [],
    },
    {
      id: 'call:core-gateway',
      kind: 'CALLS',
      sourceId: 'function:createOrder',
      targetId: 'function:PaymentGateway',
      evidence: [],
    },
  ],
  source: {
    filePath: 'src/App.tsx',
    text: 'export function App() { return CheckoutService(); }',
  },
  sources: [
    {
      filePath: 'src/App.tsx',
      text: 'export function App() { return CheckoutService(); }',
    },
    {
      filePath: 'src/features/checkout/CheckoutService.ts',
      text: 'export function CheckoutService() { return createOrder(); }',
    },
    {
      filePath: 'src/domain/order/createOrder.ts',
      text: 'export function createOrder(input) { return payment(input); }',
    },
    {
      filePath: 'src/integrations/payment/PaymentGateway.ts',
      text: 'export function PaymentGateway() {}',
    },
    {
      filePath: 'src/domain/order/createOrder.test.ts',
      text: 'test("creates order", () => createOrder({}));',
    },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 5,
    ignoredFileCount: 0,
    issues: [],
  },
  repository: {
    name: 'checkout-demo',
    url: 'https://github.com/example/checkout-demo',
    branch: 'main',
    revision: 'abc123',
  },
  entryPoints: [
    {
      id: 'function:App',
      name: 'App',
      filePath: 'src/App.tsx',
      confidence: 'detected',
      reason: 'application bootstrap',
    },
    {
      id: 'function:CheckoutService',
      name: 'CheckoutService',
      filePath: 'src/features/checkout/CheckoutService.ts',
      confidence: 'likely',
      reason: 'exported service',
    },
  ],
  functionData: [
    {
      functionId: 'function:createOrder',
      parameters: [
        {
          id: 'parameter:input',
          name: 'input',
          typeText: null,
          location: location('src/domain/order/createOrder.ts'),
          evidence: [],
        },
      ],
      returns: [
        {
          id: 'return:order',
          expressionText: 'payment(input)',
          location: location('src/domain/order/createOrder.ts'),
          evidence: [],
        },
      ],
      callArguments: [],
    },
  ],
  staticFlow: {
    steps: [
      {
        id: 'step:input',
        functionId: 'function:createOrder',
        kind: 'parameter',
        label: 'input',
        valueText: null,
        location: location('src/domain/order/createOrder.ts'),
        evidence: [],
      },
      {
        id: 'step:return',
        functionId: 'function:createOrder',
        kind: 'return',
        label: 'return payment(input)',
        valueText: 'payment(input)',
        location: location('src/domain/order/createOrder.ts'),
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'flow:input-return',
        kind: 'FLOWS_TO',
        functionId: 'function:createOrder',
        sourceStepId: 'step:input',
        targetStepId: 'step:return',
        label: 'input flows to return',
        evidence: [],
      },
    ],
  },
  architecture: {
    rootId: 'repository:demo',
    entities: [
      {
        id: 'repository:demo',
        kind: 'Repository',
        name: 'checkout-demo',
        path: '.',
        location: null,
        exported: false,
        evidence: [],
      },
      {
        id: 'function:createsOrderTest',
        kind: 'Function',
        name: 'creates an order',
        path: 'src/domain/order/createOrder.test.ts',
        location: location('src/domain/order/createOrder.test.ts'),
        exported: false,
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'reference:test-core',
        kind: 'REFERENCES',
        sourceId: 'function:createsOrderTest',
        targetId: 'function:createOrder',
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
        name: 'checkout-demo',
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
    fileOwners: {
      'src/App.tsx': 'package:web',
      'src/features/checkout/CheckoutService.ts': 'package:web',
      'src/domain/order/createOrder.ts': 'package:web',
      'src/integrations/payment/PaymentGateway.ts': 'package:web',
    },
    status: 'complete',
    issues: [],
  },
};

describe('SystemMapWorkspace', () => {
  afterEach(cleanup);

  it('opens on a concern-oriented map without a blocking entry picker', () => {
    render(
      <SystemMapWorkspace
        flow={flow}
        selectionSummary={null}
        onChangeRepository={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('CodeFlow system map')).toBeInTheDocument();
    expect(screen.getByLabelText('Primary entry point')).toHaveTextContent('App');
    expect(screen.queryByLabelText('Entry point')).not.toBeInTheDocument();

    const map = screen.getByLabelText('System architecture map');
    expect(
      within(map).getByRole('button', {
        name: /Primary entry UI \/ Interface App/,
      }),
    ).toBeInTheDocument();
    expect(
      within(map).getByRole('button', {
        name: /Application logic CheckoutService/,
      }),
    ).toBeInTheDocument();
    expect(
      within(map).getByRole('button', { name: /Core \/ Domain createOrder/ }),
    ).toBeInTheDocument();
    expect(
      within(map).getByRole('button', {
        name: /Infrastructure PaymentGateway/,
      }),
    ).toBeInTheDocument();
    expect(
      within(map).getByText(/TESTING — supporting verification/),
    ).toBeInTheDocument();
  });

  it('keeps data, tests, and dependencies as explicit lenses', () => {
    render(
      <SystemMapWorkspace
        flow={flow}
        selectionSummary={null}
        onChangeRepository={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Data flow' }));
    expect(screen.getByLabelText('Static data flow')).toHaveTextContent(
      /does not claim observed runtime/i,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tests' }));
    expect(screen.getByLabelText('System architecture map')).toHaveTextContent(
      'creates an order',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dependencies' }));
    const dependencies = screen.getByLabelText('Dependency topology');
    expect(dependencies).toHaveTextContent('react');
    expect(dependencies).toHaveTextContent('motion');
  });
});
