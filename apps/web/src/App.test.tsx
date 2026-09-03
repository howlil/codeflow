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

const repositoryFlow: FlowProjection = {
  id: 'flow:function:src/index.ts:main',
  entryPointId: 'function:src/index.ts:main',
  repository: {
    name: 'example-api',
    url: 'https://github.com/howlil/example-api',
    branch: 'master',
  },
  entryPoints: [
    {
      id: 'function:src/index.ts:main',
      name: 'main',
      filePath: 'src/index.ts',
      confidence: 'detected',
      reason: 'Bootstrap export.',
    },
    {
      id: 'function:src/http.ts:handleRequest',
      name: 'handleRequest',
      filePath: 'src/http.ts',
      confidence: 'detected',
      reason: 'Request handler export.',
    },
  ],
  analysis: {
    state: 'READY',
    filesAnalyzed: 2,
    filesIgnored: 0,
    functions: 3,
    relationships: 2,
    unresolvedReferences: 0,
    unsupportedDynamicImports: 0,
    limitations: [],
  },
  nodes: [
    {
      id: 'function:src/index.ts:main',
      kind: 'Function',
      label: 'main',
      entryPoint: true,
      location: {
        filePath: 'src/index.ts',
        startLine: 2,
        startColumn: 1,
        endLine: 2,
        endColumn: 70,
      },
    },
    {
      id: 'function:src/orders.ts:createOrder',
      kind: 'Function',
      label: 'createOrder',
      entryPoint: false,
      location: {
        filePath: 'src/orders.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      },
    },
    {
      id: 'function:src/orders.ts:validateOrder',
      kind: 'Function',
      label: 'validateOrder',
      entryPoint: false,
      location: {
        filePath: 'src/orders.ts',
        startLine: 5,
        startColumn: 1,
        endLine: 7,
        endColumn: 2,
      },
    },
  ],
  edges: [
    {
      id: 'main-order',
      kind: 'CALLS',
      sourceId: 'function:src/index.ts:main',
      targetId: 'function:src/orders.ts:createOrder',
      evidence: [
        {
          kind: 'verified-static',
          source: 'typescript-compiler-api',
          reason: 'Direct cross-file symbol resolution.',
          location: {
            filePath: 'src/index.ts',
            startLine: 2,
            startColumn: 60,
            endLine: 2,
            endColumn: 72,
          },
        },
      ],
    },
    {
      id: 'order-validate',
      kind: 'CALLS',
      sourceId: 'function:src/orders.ts:createOrder',
      targetId: 'function:src/orders.ts:validateOrder',
      evidence: [
        {
          kind: 'inferred-static',
          source: 'typescript-compiler-api',
          reason: 'Local call target.',
          location: {
            filePath: 'src/orders.ts',
            startLine: 2,
            startColumn: 10,
            endLine: 2,
            endColumn: 30,
          },
        },
      ],
    },
  ],
  source: {
    filePath: 'src/index.ts',
    text: "import { createOrder } from './orders.js';\nexport function main(input: string) { return createOrder(input); }\n",
  },
  sources: [
    {
      filePath: 'src/index.ts',
      text: "import { createOrder } from './orders.js';\nexport function main(input: string) { return createOrder(input); }\n",
    },
    {
      filePath: 'src/orders.ts',
      text: 'export function createOrder(input: string) {\n  return validateOrder(input);\n}\n\nfunction validateOrder(input: string) {\n  return input.trim();\n}\n',
    },
  ],
};

function stubAnalysis(flow: FlowProjection = repositoryFlow) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => flow }),
  );
}

describe('CodeFlow repository journey', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('starts with GitHub acquisition instead of a manual file picker', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', {
        name: 'Understand an unfamiliar codebase',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Public GitHub repository URL'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analyze repository' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Choose Files')).not.toBeInTheDocument();
  });

  it('acquires a repository, lets the user select an entry, and searches semantic symbols', async () => {
    stubAnalysis();
    render(<App />);
    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://github.com/howlil/example-api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));
    expect((await screen.findAllByText('example-api')).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText('Focused neighborhood')).toBeInTheDocument();
    expect(screen.getByText('src/index.ts')).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', { name: /Search repository/i }),
      { target: { value: 'validate' } },
    );
    const results = screen.getByLabelText('Repository search results');
    fireEvent.click(
      within(results).getByRole('button', { name: /validateOrder/i }),
    );
    expect(
      screen.getAllByRole('heading', { name: 'validateOrder' }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Show callers' }));
    expect(screen.getByText('Callers of')).toBeInTheDocument();
  });

  it('shows source evidence and partial limitations without inventing completeness', async () => {
    stubAnalysis({
      ...repositoryFlow,
      analysis: {
        ...repositoryFlow.analysis!,
        state: 'PARTIAL',
        filesIgnored: 3,
        limitations: ['3 files ignored by repository scope filters.'],
      },
    });
    render(<App />);
    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://github.com/howlil/example-api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));
    expect(
      await screen.findByText('Analysis completed with limitations'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: /Inspect CALLS relationship from main to createOrder/i,
      }),
    );
    expect(
      screen.getByText('Direct cross-file symbol resolution.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/createOrder\(input\)/)).toBeInTheDocument();
  });

  it('rejects invalid URL locally before making an acquisition request', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://example.com/repository' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'public GitHub repository URL',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
