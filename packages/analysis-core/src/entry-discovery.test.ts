import { describe, expect, it } from 'vitest';

import { discoverEntryPoints } from './entry-discovery.js';

describe('entry discovery', () => {
  it('surfaces exported functions using deterministic confidence labels', () => {
    const entries = discoverEntryPoints([
      {
        filePath: 'src/index.ts',
        sourceText: 'export function main() { return createOrder(); }',
      },
      {
        filePath: 'src/orders.ts',
        sourceText: 'export function createOrder() { return "ok"; }',
      },
    ]);

    expect(entries.map((entry) => entry.name)).toEqual(['main', 'createOrder']);
    expect(entries[0]).toMatchObject({
      filePath: 'src/index.ts',
      confidence: 'detected',
    });
    expect(entries[1]?.confidence).toBe('likely');
  });
});
