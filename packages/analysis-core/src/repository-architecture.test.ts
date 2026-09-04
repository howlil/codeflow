import { describe, expect, it } from 'vitest';

import { analyzeTypeScriptRepository } from './repository-architecture.js';

const files = [
  {
    filePath: 'apps/api/src/handler.ts',
    sourceText: `import { formatUser, type User } from '../../../packages/core/src/user';

export function handleUser(user: User) {
  return formatUser(user);
}
`,
  },
  {
    filePath: 'packages/core/src/user.ts',
    sourceText: `export interface User { id: string }
export type UserLabel = string;

export function formatUser(user: User): UserLabel {
  return user.id;
}

export class UserFormatter {
  format(user: User) {
    return formatUser(user);
  }
}
`,
  },
];

describe('repository architecture projection', () => {
  it('projects repository hierarchy, dependencies, symbols, and references', () => {
    const flow = analyzeTypeScriptRepository({
      files,
      entryPoint: {
        filePath: 'apps/api/src/handler.ts',
        name: 'handleUser',
      },
    });

    const architecture = flow.architecture;
    expect(architecture).toBeDefined();
    expect(architecture?.rootId).toBe('repository:.');

    const kinds = new Set(architecture?.entities.map((entity) => entity.kind));
    expect(kinds).toEqual(
      expect.objectContaining({
        has: expect.any(Function),
      }),
    );
    expect(kinds.has('Repository')).toBe(true);
    expect(kinds.has('Module')).toBe(true);
    expect(kinds.has('File')).toBe(true);
    expect(kinds.has('Function')).toBe(true);
    expect(kinds.has('Interface')).toBe(true);
    expect(kinds.has('Type')).toBe(true);
    expect(kinds.has('Class')).toBe(true);
    expect(kinds.has('Method')).toBe(true);

    expect(
      architecture?.entities.find(
        (entity) => entity.id === 'function:apps/api/src/handler.ts:handleUser',
      ),
    ).toMatchObject({
      kind: 'Function',
      name: 'handleUser',
      exported: true,
    });

    expect(
      architecture?.relationships.some(
        (relationship) => relationship.kind === 'IMPORTS',
      ),
    ).toBe(true);
    expect(
      architecture?.relationships.some(
        (relationship) => relationship.kind === 'DEPENDS_ON',
      ),
    ).toBe(true);
    expect(
      architecture?.relationships.some(
        (relationship) => relationship.kind === 'EXPORTS',
      ),
    ).toBe(true);
    expect(
      architecture?.relationships.some(
        (relationship) =>
          relationship.kind === 'REFERENCES' &&
          relationship.targetId ===
            'function:packages/core/src/user.ts:formatUser',
      ),
    ).toBe(true);

    expect(flow.nodes.some((node) => node.label === 'formatUser')).toBe(true);
    expect(flow.staticFlow.steps.length).toBeGreaterThan(0);
  });

  it('keeps unresolved external imports out of the architecture graph', () => {
    const flow = analyzeTypeScriptRepository({
      files: [
        {
          filePath: 'src/main.ts',
          sourceText: `import leftPad from 'left-pad';\nexport function main() { return leftPad('x', 2); }`,
        },
      ],
      entryPoint: { filePath: 'src/main.ts', name: 'main' },
    });

    expect(
      flow.architecture?.relationships.some(
        (relationship) => relationship.kind === 'IMPORTS',
      ),
    ).toBe(false);
  });
});
