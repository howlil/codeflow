import { describe, expect, it } from 'vitest';

import { buildFunctionBehaviorDeltas } from './behavior-delta.js';
import { analyzeTypeScriptRepository } from './repository-architecture.js';

function flow(sourceText: string) {
  return analyzeTypeScriptRepository({
    files: [{ filePath: 'core.ts', sourceText }],
    entryPoint: { filePath: 'core.ts', name: 'processPayment' },
  });
}

function change(baseEntityId: string | null, headEntityId: string | null) {
  return {
    id: 'change:modified:Function:core.ts:processPayment',
    entityKind: 'Function',
    name: 'processPayment',
    path: 'core.ts',
    baseEntityId,
    headEntityId,
  };
}

describe('M10 static behavior delta projection', () => {
  it('compares supported function contract and static flow facts across frozen revisions', () => {
    const base = flow(`export function processPayment(amount: number) {
  const total = amount + 1;
  if (total > 10) {
    throw new Error('high');
  }
  return total;
}
`);
    const head = flow(`export function processPayment(amount: string) {
  const total = Number(amount) + 2;
  if (total > 20) {
    return 0;
  }
  return total;
}
`);

    const delta = buildFunctionBehaviorDeltas(base, head, [
      change(base.nodes[0]?.id ?? null, head.nodes[0]?.id ?? null),
    ])[0];

    expect(delta).toBeDefined();
    expect(delta?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeKind: 'removed',
          category: 'parameter',
          label: 'amount',
          detail: 'number',
          snapshot: 'base',
        }),
        expect.objectContaining({
          changeKind: 'added',
          category: 'parameter',
          label: 'amount',
          detail: 'string',
          snapshot: 'head',
        }),
        expect.objectContaining({
          changeKind: 'removed',
          category: 'step',
          kind: 'failure',
          snapshot: 'base',
        }),
        expect.objectContaining({
          changeKind: 'added',
          category: 'step',
          kind: 'branch',
          snapshot: 'head',
        }),
      ]),
    );
    expect(delta?.summary.addedCount).toBeGreaterThan(0);
    expect(delta?.summary.removedCount).toBeGreaterThan(0);
    expect(delta?.summary.relationshipCount).toBeGreaterThan(0);
  });

  it('ignores source-location movement when supported static semantics are unchanged', () => {
    const base = flow(`export function processPayment(amount: number) {
  const total = amount + 1;
  return total;
}
`);
    const head = flow(`

export function processPayment(amount: number) {
  const total = amount + 1;
  return total;
}
`);

    const delta = buildFunctionBehaviorDeltas(base, head, [
      change(base.nodes[0]?.id ?? null, head.nodes[0]?.id ?? null),
    ])[0];

    expect(delta?.items).toEqual([]);
    expect(delta?.summary).toEqual({
      addedCount: 0,
      removedCount: 0,
      parameterCount: 0,
      returnCount: 0,
      stepCount: 0,
      relationshipCount: 0,
    });
  });

  it('represents one-sided added functions as added static facts without inventing a prior behavior', () => {
    const base = flow('export function processPayment() { return 1; }\n');
    const head = flow(
      'export function processPayment(amount: number) { return amount + 1; }\n',
    );
    const delta = buildFunctionBehaviorDeltas(base, head, [
      change(null, head.nodes[0]?.id ?? null),
    ])[0];

    expect(delta?.items.length).toBeGreaterThan(0);
    expect(delta?.items.every((item) => item.changeKind === 'added')).toBe(true);
    expect(delta?.items.every((item) => item.snapshot === 'head')).toBe(true);
  });
});
