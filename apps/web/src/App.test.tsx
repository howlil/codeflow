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

function stubFlowRequest() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sampleFlow,
    }),
  );
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

    fireEvent.click(screen.getByRole('button', { name: /formatGreeting/i }));

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
    expect(
      screen.queryByRole('button', { name: /normalizeName/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show full flow' }));

    expect(
      screen.getByRole('button', { name: /normalizeName/i }),
    ).toBeInTheDocument();
  });
});
