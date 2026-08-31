import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import type { FlowProjection } from './flow-client';

const sampleFlow: FlowProjection = {
  id: 'flow:function:fixture:handleGreeting',
  entryPointId: 'function:fixture:handleGreeting',
  nodes: [
    {
      id: 'function:fixture:normalizeName',
      kind: 'Function',
      label: 'normalizeName',
      entryPoint: false,
      location: {
        filePath: 'fixtures/request-flow/greeting.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      },
    },
    {
      id: 'function:fixture:formatGreeting',
      kind: 'Function',
      label: 'formatGreeting',
      entryPoint: false,
      location: {
        filePath: 'fixtures/request-flow/greeting.ts',
        startLine: 5,
        startColumn: 1,
        endLine: 7,
        endColumn: 2,
      },
    },
    {
      id: 'function:fixture:handleGreeting',
      kind: 'Function',
      label: 'handleGreeting',
      entryPoint: true,
      location: {
        filePath: 'fixtures/request-flow/greeting.ts',
        startLine: 9,
        startColumn: 1,
        endLine: 12,
        endColumn: 2,
      },
    },
  ],
  edges: [
    {
      id: 'verified-edge',
      kind: 'CALLS',
      sourceId: 'function:fixture:handleGreeting',
      targetId: 'function:fixture:normalizeName',
      evidence: [
        {
          kind: 'verified-static',
          source: 'typescript-compiler-api',
          reason: 'Direct symbol resolution.',
          location: {
            filePath: 'fixtures/request-flow/greeting.ts',
            startLine: 11,
            startColumn: 20,
            endLine: 11,
            endColumn: 39,
          },
        },
      ],
    },
    {
      id: 'inferred-edge',
      kind: 'CALLS',
      sourceId: 'function:fixture:handleGreeting',
      targetId: 'function:fixture:formatGreeting',
      evidence: [
        {
          kind: 'inferred-static',
          source: 'typescript-compiler-api',
          reason: 'Local alias inference.',
          location: {
            filePath: 'fixtures/request-flow/greeting.ts',
            startLine: 11,
            startColumn: 10,
            endLine: 11,
            endColumn: 40,
          },
        },
      ],
    },
  ],
  source: {
    filePath: 'fixtures/request-flow/greeting.ts',
    text: `function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function formatGreeting(name: string): string {
  return \`Hello, \${name}!\`;
}

export function handleGreeting(name: string): string {
  const formatter = formatGreeting;
  return formatter(normalizeName(name));
}
`,
  },
};

function stubFlowRequest(flow: FlowProjection = sampleFlow) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => flow,
    }),
  );
}

function stubFlowFailure(message: string) {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error(message)));
}

describe('App', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('renders the flow and exposes source evidence on selection', async () => {
    stubFlowRequest();

    render(<App />);

    expect(
      await screen.findByText('handleGreeting request flow'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('verified-static').length).toBeGreaterThan(0);
    expect(screen.getAllByText('inferred-static').length).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', { name: /^FunctionformatGreeting/i }),
    );

    expect(
      screen.getByRole('heading', { name: 'formatGreeting' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Hello, \$\{name\}!/)).toBeInTheDocument();
    expect(screen.getByText('Local alias inference.')).toBeInTheDocument();
  });

  it('navigates by search and limits the canvas to the selected neighborhood', async () => {
    stubFlowRequest();

    render(<App />);
    await screen.findByText('handleGreeting request flow');

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search functions' }),
      { target: { value: 'format' } },
    );
    const searchResults = screen.getByLabelText('Function search results');
    fireEvent.click(
      within(searchResults).getByRole('button', { name: /formatGreeting/i }),
    );

    expect(
      screen.getByText('Neighborhood focus · formatGreeting'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'formatGreeting' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('normalizeName')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show full flow' }));

    expect(screen.getByText('normalizeName')).toBeInTheDocument();
  });

  it('moves between caller and callee with arrow keys while keeping inspection synchronized', async () => {
    stubFlowRequest();
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      },
    );

    render(<App />);
    await screen.findByText('handleGreeting request flow');

    const entryNode = screen.getByRole('button', {
      name: /^Entry functionhandleGreeting/i,
    });
    entryNode.focus();

    fireEvent.keyDown(entryNode, { key: 'ArrowRight' });

    const calleeNode = screen.getByRole('button', {
      name: /^FunctionnormalizeName/i,
    });
    expect(calleeNode).toHaveFocus();
    expect(
      screen.getByRole('heading', { name: 'normalizeName' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(calleeNode, { key: 'ArrowLeft' });

    expect(entryNode).toHaveFocus();
    expect(
      screen.getByRole('heading', { name: 'handleGreeting' }),
    ).toBeInTheDocument();
  });

  it('inspects one selected relationship with its source provenance', async () => {
    stubFlowRequest();

    render(<App />);
    await screen.findByText('handleGreeting request flow');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect CALLS relationship from handleGreeting to normalizeName',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'handleGreeting → normalizeName' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Direct symbol resolution.')).toBeInTheDocument();
    expect(
      screen.queryByText('Local alias inference.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/return formatter\(normalizeName\(name\)\);/),
    ).toBeInTheDocument();
  });

  it('expands source inspection without leaving the semantic canvas', async () => {
    stubFlowRequest();

    render(<App />);
    await screen.findByText('handleGreeting request flow');

    fireEvent.click(screen.getByRole('button', { name: 'Expand source' }));

    expect(
      screen.getByRole('button', { name: 'Restore inspector' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('region', { name: 'Semantic flow canvas' }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Source evidence inspector'),
    ).toHaveTextContent('export function handleGreeting');

    fireEvent.click(screen.getByRole('button', { name: 'Restore inspector' }));

    expect(
      screen.getByRole('button', { name: 'Expand source' }),
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows an explicit empty state when analysis projects no functions', async () => {
    stubFlowRequest({
      ...sampleFlow,
      nodes: [],
      edges: [],
    });

    render(<App />);

    expect(
      await screen.findByText('No functions projected'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /analysis completed, but this projection contains no functions/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Semantic flow canvas' }),
    ).not.toBeInTheDocument();
  });

  it('keeps a partial projection navigable without inventing missing evidence', async () => {
    const partialFlow: FlowProjection = {
      ...sampleFlow,
      entryPointId: 'function:fixture:missing-entry',
      nodes: sampleFlow.nodes.map((node) => ({ ...node, entryPoint: false })),
      edges: sampleFlow.edges.map((edge) =>
        edge.id === 'verified-edge' ? { ...edge, evidence: [] } : edge,
      ),
    };
    stubFlowRequest(partialFlow);

    render(<App />);

    expect(await screen.findByText('Partial projection')).toBeInTheDocument();
    expect(
      screen.getByText(/entry point was not projected/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 relationship has no supporting evidence/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No focal function is available/i),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search functions' }),
      { target: { value: 'normalize' } },
    );
    fireEvent.click(
      within(screen.getByLabelText('Function search results')).getByRole(
        'button',
        { name: /normalizeName/i },
      ),
    );

    expect(
      screen.getByText('Neighborhood focus · normalizeName'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('evidence-unavailable').length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(
        'No supporting provenance was projected for this relationship.',
      ),
    ).toBeInTheDocument();
  });

  it('shows a failure state when the flow request cannot be loaded', async () => {
    stubFlowFailure('Fixture request failed.');

    render(<App />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Flow unavailable',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Fixture request failed.',
    );
  });
});
