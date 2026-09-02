import type { FlowProjection } from '@codeflow/analysis-core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from './app.js';

const handlerSource = `import { normalize } from './normalize';

export function handle(input: string): string {
  const trimmed = input.trim();
  const normalized = normalize(trimmed);
  if (normalized === '') {
    throw new Error('empty');
  }
  const result = { value: normalized };
  result.value = result.value.toUpperCase();
  return result.value;
}
`;

const normalizeSource = `export function normalize(value: string): string {
  return value.toLowerCase();
}
`;

describe('M4 static data flow', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    app = buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  async function analyze(): Promise<FlowProjection> {
    const response = await app.inject({
      method: 'POST',
      url: '/api/flows/analyze',
      payload: {
        entryPoint: {
          filePath: 'demo/src/handler.ts',
          name: 'handle',
        },
        files: [
          {
            filePath: 'demo/src/handler.ts',
            sourceText: handlerSource,
          },
          {
            filePath: 'demo/src/normalize.ts',
            sourceText: normalizeSource,
          },
        ],
      },
    });

    expect(response.statusCode).toBe(200);
    return response.json<FlowProjection>();
  }

  it('projects function inputs, returns, and caller-to-callee argument mapping', async () => {
    const flow = await analyze();
    const handleId = 'function:demo/src/handler.ts:handle';
    const normalizeId = 'function:demo/src/normalize.ts:normalize';
    const handleData = flow.functionData.find(
      (data) => data.functionId === handleId,
    );
    const normalizeData = flow.functionData.find(
      (data) => data.functionId === normalizeId,
    );

    expect(handleData?.parameters.map((parameter) => parameter.name)).toEqual([
      'input',
    ]);
    expect(
      handleData?.returns.map((returnPath) => returnPath.expressionText),
    ).toEqual(['result.value']);
    expect(handleData?.callArguments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          calleeFunctionId: normalizeId,
          argumentText: 'trimmed',
          parameterName: 'value',
        }),
      ]),
    );
    expect(normalizeData?.parameters[0]).toMatchObject({
      name: 'value',
      typeText: 'string',
    });
    expect(normalizeData?.returns[0]?.expressionText).toBe(
      'value.toLowerCase()',
    );
  });

  it('projects source-backed value flow, side effects, branches, and failure possibilities', async () => {
    const flow = await analyze();
    const relationshipKinds = new Set(
      flow.staticFlow.relationships.map((relationship) => relationship.kind),
    );
    const stepKinds = new Set(flow.staticFlow.steps.map((step) => step.kind));

    expect(relationshipKinds.has('PASSES_ARGUMENT')).toBe(true);
    expect(relationshipKinds.has('FLOWS_TO')).toBe(true);
    expect(relationshipKinds.has('READS')).toBe(true);
    expect(relationshipKinds.has('WRITES')).toBe(true);
    expect(relationshipKinds.has('MUTATES')).toBe(true);
    expect(relationshipKinds.has('RETURNS_TO')).toBe(true);

    expect(stepKinds.has('parameter')).toBe(true);
    expect(stepKinds.has('argument')).toBe(true);
    expect(stepKinds.has('declaration')).toBe(true);
    expect(stepKinds.has('transform')).toBe(true);
    expect(stepKinds.has('branch')).toBe(true);
    expect(stepKinds.has('failure')).toBe(true);
    expect(stepKinds.has('mutation')).toBe(true);
    expect(stepKinds.has('return')).toBe(true);

    expect(
      flow.staticFlow.steps.find((step) => step.kind === 'branch')?.label,
    ).toMatch(/^Possible branch:/);
    expect(
      flow.staticFlow.steps.find((step) => step.kind === 'failure')?.label,
    ).toMatch(/^Possible failure:/);
    expect(
      flow.staticFlow.steps
        .flatMap((step) => step.evidence)
        .map((evidence) => evidence.kind),
    ).not.toContain('observed-runtime');
  });

  it('keeps the static projection deterministic for identical repository input', async () => {
    const first = await analyze();
    const second = await analyze();

    expect(second.functionData).toEqual(first.functionData);
    expect(second.staticFlow).toEqual(first.staticFlow);
  });
});
