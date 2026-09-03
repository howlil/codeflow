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

const handlerSource = `import { formatGreeting } from './format';\nimport { normalizeName } from './name';\n\nexport function handleGreeting(name: string): string {\n  const formatter = formatGreeting;\n  return formatter(normalizeName(name));\n}\n`;
const nameSource = `export function normalizeName(name: string): string {\n  return name.trim().toLowerCase();\n}\n`;
const formatSource = `export function formatGreeting(name: string): string {\n  return \`Hello, \${name}!\`;\n}\n`;

const sampleFlow: FlowProjection = {
  id: 'flow:function:demo/src/handler.ts:handleGreeting',
  entryPointId: 'function:demo/src/handler.ts:handleGreeting',
  nodes: [
    {
      id: 'function:demo/src/handler.ts:handleGreeting',
      kind: 'Function',
      label: 'handleGreeting',
      entryPoint: true,
      location: {
        filePath: 'demo/src/handler.ts',
        startLine: 4,
        startColumn: 1,
        endLine: 7,
        endColumn: 2,
      },
    },
    {
      id: 'function:demo/src/name.ts:normalizeName',
      kind: 'Function',
      label: 'normalizeName',
      entryPoint: false,
      location: {
        filePath: 'demo/src/name.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      },
    },
    {
      id: 'function:demo/src/format.ts:formatGreeting',
      kind: 'Function',
      label: 'formatGreeting',
      entryPoint: false,
      location: {
        filePath: 'demo/src/format.ts',
        startLine: 1,
        startColumn: 1,
        endLine: 3,
        endColumn: 2,
      },
    },
  ],
  edges: [
    {
      id: 'verified-edge',
      kind: 'CALLS',
      sourceId: 'function:demo/src/handler.ts:handleGreeting',
      targetId: 'function:demo/src/name.ts:normalizeName',
      evidence: [
        {
          kind: 'verified-static',
          source: 'typescript-compiler-api',
          reason: 'Direct symbol resolution.',
          location: {
            filePath: 'demo/src/handler.ts',
            startLine: 6,
            startColumn: 20,
            endLine: 6,
            endColumn: 39,
          },
        },
      ],
    },
    {
      id: 'inferred-edge',
      kind: 'CALLS',
      sourceId: 'function:demo/src/handler.ts:handleGreeting',
      targetId: 'function:demo/src/format.ts:formatGreeting',
      evidence: [
        {
          kind: 'inferred-static',
          source: 'typescript-compiler-api',
          reason: 'Local alias inference.',
          location: {
            filePath: 'demo/src/handler.ts',
            startLine: 6,
            startColumn: 10,
            endLine: 6,
            endColumn: 40,
          },
        },
      ],
    },
  ],
  source: {
    filePath: 'demo/src/handler.ts',
    text: handlerSource,
  },
  sources: [
    { filePath: 'demo/src/format.ts', text: formatSource },
    { filePath: 'demo/src/handler.ts', text: handlerSource },
    { filePath: 'demo/src/name.ts', text: nameSource },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 3,
    ignoredFileCount: 0,
    issues: [],
  },
  functionData: [
    {
      functionId: 'function:demo/src/handler.ts:handleGreeting',
      parameters: [
        {
          id: 'parameter:name',
          name: 'name',
          typeText: 'string',
          location: {
            filePath: 'demo/src/handler.ts',
            startLine: 4,
            startColumn: 32,
            endLine: 4,
            endColumn: 44,
          },
          evidence: [],
        },
      ],
      returns: [
        {
          id: 'return:greeting',
          expressionText: 'formatter(normalizeName(name))',
          location: {
            filePath: 'demo/src/handler.ts',
            startLine: 6,
            startColumn: 3,
            endLine: 6,
            endColumn: 43,
          },
          evidence: [],
        },
      ],
      callArguments: [],
    },
  ],
  staticFlow: {
    steps: [
      {
        id: 'step:parameter',
        functionId: 'function:demo/src/handler.ts:handleGreeting',
        kind: 'parameter',
        label: 'name parameter',
        valueText: 'name',
        location: {
          filePath: 'demo/src/handler.ts',
          startLine: 4,
          startColumn: 32,
          endLine: 4,
          endColumn: 44,
        },
        evidence: [],
      },
      {
        id: 'step:normalize',
        functionId: 'function:demo/src/name.ts:normalizeName',
        kind: 'transform',
        label: 'normalize name',
        valueText: 'name.trim().toLowerCase()',
        location: {
          filePath: 'demo/src/name.ts',
          startLine: 2,
          startColumn: 10,
          endLine: 2,
          endColumn: 35,
        },
        evidence: [],
      },
    ],
    relationships: [
      {
        id: 'flow:name-normalized',
        kind: 'FLOWS_TO',
        functionId: 'function:demo/src/handler.ts:handleGreeting',
        sourceStepId: 'step:parameter',
        targetStepId: 'step:normalize',
        label: 'name → normalized name',
        evidence: [],
      },
    ],
  },
};

function repositoryFile(filePath: string, text: string): File {
  const file = new File([text], filePath.split('/').at(-1) ?? filePath, {
    type: 'text/typescript',
  });
  Object.defineProperty(file, 'webkitRelativePath', { value: filePath });
  Object.defineProperty(file, 'text', {
    value: async () => text,
  });
  return file;
}

const repositoryFiles = [
  repositoryFile('demo/src/handler.ts', handlerSource),
  repositoryFile('demo/src/name.ts', nameSource),
  repositoryFile('demo/src/format.ts', formatSource),
  repositoryFile('demo/README.md', '# Demo'),
];

function stubFlowRequest(flow: FlowProjection = sampleFlow) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => flow,
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function stubFlowFailure(message: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: message }),
    }),
  );
}

function selectEntrySource(filePath: string) {
  const trigger = screen.getByRole('combobox', { name: 'Entry source file' });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
  const option = screen.getByRole('option', { name: filePath });
  fireEvent.pointerUp(option, { button: 0, ctrlKey: false });
}

async function openRepository(flow: FlowProjection = sampleFlow) {
  const fetchMock = stubFlowRequest(flow);
  render(<App />);

  fireEvent.change(screen.getByLabelText('Repository directory'), {
    target: { files: repositoryFiles },
  });
  selectEntrySource('demo/src/handler.ts');
  fireEvent.change(
    screen.getByRole('textbox', { name: 'Exported entry function' }),
    { target: { value: 'handleGreeting' } },
  );
  fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));

  await screen.findByText(
    flow.nodes.length === 0
      ? 'No functions projected'
      : 'handleGreeting request flow',
  );
  return fetchMock;
}

describe('App', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('starts from local repository input rather than the sample fixture', () => {
    const fetchMock = stubFlowRequest();

    render(<App />);

    expect(
      screen.getByText('Select a local TypeScript repository'),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('collapses setup into repository context and inspects cross-file source', async () => {
    const fetchMock = await openRepository();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(request.body)) as {
      files: Array<{ filePath: string }>;
      entryPoint: { filePath: string; name: string };
    };
    expect(body.entryPoint).toEqual({
      filePath: 'demo/src/handler.ts',
      name: 'handleGreeting',
    });
    expect(body.files.map((file) => file.filePath)).toEqual([
      'demo/src/format.ts',
      'demo/src/handler.ts',
      'demo/src/name.ts',
    ]);
    expect(
      screen.queryByLabelText('Repository directory'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Change repository' }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /^FunctionnormalizeName/i }),
    );

    expect(
      screen.getByRole('heading', { name: 'normalizeName' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/name\.trim\(\)\.toLowerCase\(\)/),
    ).toBeInTheDocument();
    const inspector = screen.getByLabelText('Source evidence inspector');
    expect(
      within(inspector).getByText(/demo\/src\/name\.ts:L1/),
    ).toBeInTheDocument();
  });

  it('navigates search from the keyboard and returns to the entry flow truthfully', async () => {
    await openRepository();

    const search = screen.getByRole('searchbox', { name: 'Search functions' });
    fireEvent.change(search, { target: { value: 'format' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    expect(
      screen.getByText('Neighborhood focus · formatGreeting'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'formatGreeting' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('normalizeName')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to entry flow' }));

    expect(screen.getByText('normalizeName')).toBeInTheDocument();
  });

  it('moves between caller and callee with arrow keys while keeping inspection synchronized', async () => {
    vi.stubGlobal(
      'requestAnimationFrame',
      (callback: FrameRequestCallback): number => {
        callback(0);
        return 0;
      },
    );
    await openRepository();

    const entryNode = screen.getByRole('button', {
      name: /^Entry functionhandleGreeting/i,
    });
    entryNode.focus();

    fireEvent.keyDown(entryNode, { key: 'ArrowRight' });

    const calleeNode = screen.getByRole('button', {
      name: /^FunctionformatGreeting/i,
    });
    expect(calleeNode).toHaveFocus();
    expect(
      screen.getByRole('heading', { name: 'formatGreeting' }),
    ).toBeInTheDocument();

    fireEvent.keyDown(calleeNode, { key: 'ArrowLeft' });

    expect(entryNode).toHaveFocus();
    expect(
      screen.getByRole('heading', { name: 'handleGreeting' }),
    ).toBeInTheDocument();
  });

  it('opens selected relationship evidence with source provenance', async () => {
    await openRepository();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect CALLS relationship from handleGreeting to normalizeName',
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'handleGreeting → normalizeName' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Direct symbol resolution.')).toBeInTheDocument();
    expect(screen.getByText(/typescript-compiler-api/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Evidence' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('separates data, evidence, and static steps into task-oriented inspector tabs', async () => {
    await openRepository();

    fireEvent.click(screen.getByRole('tab', { name: 'Data' }));
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(
      screen.getByText('formatter(normalizeName(name))'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Evidence' }));
    expect(screen.getAllByText('CALLS').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: 'Steps' }));
    expect(screen.getByText(/Step 1\/2/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText(/Step 2\/2/)).toBeInTheDocument();
    expect(screen.getByText('normalize name')).toBeInTheDocument();
  });

  it('persists explicit theme selection', () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    );

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('codeflow-theme')).toBe('light');
  });

  it('expands source inspection without leaving the semantic canvas', async () => {
    await openRepository();

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
  });

  it('shows an explicit empty state when analysis projects no functions', async () => {
    await openRepository({
      ...sampleFlow,
      nodes: [],
      edges: [],
    });

    expect(screen.getByText('No functions projected')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Semantic flow canvas' }),
    ).not.toBeInTheDocument();
  });

  it('keeps a partial repository projection navigable and surfaces analysis issues', async () => {
    const partialFlow: FlowProjection = {
      ...sampleFlow,
      analysis: {
        status: 'partial',
        analyzedFileCount: 3,
        ignoredFileCount: 1,
        issues: [
          {
            kind: 'unsupported',
            filePath: 'demo/src/missing.ts',
            message:
              'Relative import ./missing could not be resolved from the selected repository files.',
          },
        ],
      },
      edges: sampleFlow.edges.map((edge) =>
        edge.id === 'verified-edge' ? { ...edge, evidence: [] } : edge,
      ),
    };

    await openRepository(partialFlow);

    expect(screen.getByText('Partial projection')).toBeInTheDocument();
    expect(
      screen.getByText(/demo\/src\/missing\.ts: Relative import/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/1 relationship has no supporting evidence/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect CALLS relationship from handleGreeting to normalizeName',
      }),
    );
    expect(screen.getAllByText('evidence-unavailable').length).toBeGreaterThan(
      0,
    );
  });

  it('rejects oversized local source before upload', () => {
    const fetchMock = stubFlowRequest();
    const oversized = repositoryFile(
      'demo/src/large.ts',
      'x'.repeat(129 * 1024),
    );

    render(<App />);
    fireEvent.change(screen.getByLabelText('Repository directory'), {
      target: { files: [oversized] },
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'exceeds the 131072-byte per-file analysis limit',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an API failure state without fabricating a flow', async () => {
    stubFlowFailure('Exported entry point handleGreeting was not found.');
    render(<App />);

    fireEvent.change(screen.getByLabelText('Repository directory'), {
      target: { files: repositoryFiles },
    });
    selectEntrySource('demo/src/handler.ts');
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Exported entry function' }),
      { target: { value: 'handleGreeting' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Analyze repository' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Repository analysis unavailable',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Exported entry point handleGreeting was not found.',
    );
  });
});
