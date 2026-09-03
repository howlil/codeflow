import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FlowProjection } from './flow-client';
import {
  FunctionDataPanel,
  RelationshipEvidencePanel,
  StaticStepPanel,
} from './StaticFlowPanel';

const location = {
  filePath: 'demo/src/handler.ts',
  startLine: 2,
  startColumn: 1,
  endLine: 2,
  endColumn: 20,
};
const evidence = {
  kind: 'verified-static' as const,
  source: 'typescript-compiler-api',
  location,
  reason: 'Source-backed static evidence.',
};

const flow: FlowProjection = {
  id: 'flow:handler',
  entryPointId: 'handler',
  nodes: [
    {
      id: 'handler',
      kind: 'Function',
      label: 'handle',
      entryPoint: true,
      location,
    },
    {
      id: 'normalize',
      kind: 'Function',
      label: 'normalize',
      entryPoint: false,
      location: { ...location, filePath: 'demo/src/normalize.ts' },
    },
  ],
  edges: [
    {
      id: 'call',
      kind: 'CALLS',
      sourceId: 'handler',
      targetId: 'normalize',
      evidence: [evidence],
    },
  ],
  source: { filePath: location.filePath, text: 'export function handle() {}' },
  sources: [
    { filePath: location.filePath, text: 'export function handle() {}' },
  ],
  analysis: {
    status: 'complete',
    analyzedFileCount: 1,
    ignoredFileCount: 0,
    issues: [],
  },
  functionData: [
    {
      functionId: 'handler',
      parameters: [
        {
          id: 'parameter',
          name: 'input',
          typeText: 'string',
          location,
          evidence: [evidence],
        },
      ],
      returns: [
        {
          id: 'return',
          expressionText: 'result.value',
          location,
          evidence: [evidence],
        },
      ],
      callArguments: [
        {
          id: 'argument',
          callerFunctionId: 'handler',
          calleeFunctionId: 'normalize',
          argumentIndex: 0,
          argumentText: 'trimmed',
          parameterName: 'value',
          location,
          evidence: [evidence],
        },
      ],
    },
  ],
  staticFlow: {
    steps: [
      {
        id: 'step-1',
        functionId: 'handler',
        kind: 'parameter',
        label: 'Parameter input',
        valueText: 'string',
        location,
        evidence: [evidence],
      },
      {
        id: 'step-2',
        functionId: 'handler',
        kind: 'mutation',
        label: 'Mutate result.value',
        valueText: 'result.value.toUpperCase()',
        location: { ...location, startLine: 5, endLine: 5 },
        evidence: [evidence],
      },
      {
        id: 'step-3',
        functionId: 'normalize',
        kind: 'branch',
        label: 'Possible branch: value === ""',
        valueText: 'value === ""',
        location: { ...location, filePath: 'demo/src/normalize.ts' },
        evidence: [evidence],
      },
    ],
    relationships: [
      {
        id: 'passes',
        kind: 'PASSES_ARGUMENT',
        functionId: 'handler',
        sourceStepId: 'step-1',
        targetStepId: null,
        label: 'trimmed → value',
        evidence: [evidence],
      },
      {
        id: 'mutates',
        kind: 'MUTATES',
        functionId: 'handler',
        sourceStepId: null,
        targetStepId: 'step-2',
        label: 'Mutate result.value',
        evidence: [evidence],
      },
    ],
  },
};

afterEach(cleanup);

describe('static flow inspector panels', () => {
  it('shows source-backed function inputs, outputs, and argument mappings', () => {
    render(
      <FunctionDataPanel flow={flow} selectedNode={flow.nodes[0] ?? null} />,
    );

    expect(screen.getByText('Inputs')).toBeInTheDocument();
    expect(screen.getByText('input')).toBeInTheDocument();
    expect(screen.getAllByText('string')).not.toHaveLength(0);
    expect(screen.getByText('Outputs')).toBeInTheDocument();
    expect(screen.getByText('result.value')).toBeInTheDocument();
    expect(screen.getByText('Argument mappings')).toBeInTheDocument();
    expect(screen.getByText('trimmed → value')).toBeInTheDocument();
  });

  it('filters relationship evidence by the active semantic lens', () => {
    render(
      <RelationshipEvidencePanel
        flow={flow}
        selectedNode={flow.nodes[0] ?? null}
        selectedEdge={null}
        lens="MUTATES"
      />,
    );

    expect(screen.getByText('MUTATES')).toBeInTheDocument();
    expect(screen.getByText('Mutate result.value')).toBeInTheDocument();
    expect(screen.queryByText('handle → normalize')).not.toBeInTheDocument();
    expect(screen.queryByText('trimmed → value')).not.toBeInTheDocument();
  });

  it('steps deterministically without presenting static possibilities as runtime truth', () => {
    const onSelectNode = vi.fn();
    render(<StaticStepPanel flow={flow} onSelectNode={onSelectNode} />);

    expect(
      screen.getByText(/This is not observed runtime execution/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Parameter input')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Mutate result.value')).toBeInTheDocument();
    expect(screen.getByText(/Step 2\/3/)).toBeInTheDocument();
    expect(onSelectNode).toHaveBeenLastCalledWith('handler');

    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(
      screen.getByText('Possible branch: value === ""'),
    ).toBeInTheDocument();
    expect(onSelectNode).toHaveBeenLastCalledWith('normalize');
  });
});
