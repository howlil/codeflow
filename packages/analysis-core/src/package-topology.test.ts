import { describe, expect, it } from 'vitest';

import { buildPackageTopology } from './package-topology.js';

const metadata = [
  {
    filePath: 'pnpm-workspace.yaml',
    text: "packages:\n  - 'apps/*'\n  - 'packages/*'\n",
  },
  {
    filePath: 'apps/web/package.json',
    text: JSON.stringify({
      name: '@demo/web',
      dependencies: { '@demo/core': 'workspace:*', react: '^19.0.0' },
    }),
  },
  {
    filePath: 'packages/core/package.json',
    text: JSON.stringify({ name: '@demo/core' }),
  },
  {
    filePath: 'tsconfig.json',
    text: JSON.stringify({
      compilerOptions: {
        baseUrl: '.',
        paths: { '@core/*': ['packages/core/src/*'] },
      },
    }),
  },
];

const files = [
  {
    filePath: 'apps/web/src/app.ts',
    sourceText:
      "import { core } from '@core/index';\nexport function app() { return core(); }",
  },
  {
    filePath: 'packages/core/src/index.ts',
    sourceText: 'export function core() { return 1; }',
  },
];

describe('buildPackageTopology', () => {
  it('projects configured workspace packages and internal dependencies', () => {
    const topology = buildPackageTopology(files, metadata);

    expect(topology).toBeDefined();
    expect(topology?.rootId).toBe('workspace:.');
    expect(
      topology?.entities.map((entity) => `${entity.kind}:${entity.name}`),
    ).toEqual(
      expect.arrayContaining([
        'Workspace:Workspace',
        'Package:@demo/web',
        'Package:@demo/core',
      ]),
    );
    const dependency = topology?.relationships.find(
      (relationship) =>
        relationship.kind === 'DEPENDS_ON' &&
        relationship.sourceId === 'package:apps/web' &&
        relationship.targetId === 'package:packages/core',
    );
    expect(dependency?.evidence.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['configured', 'verified-static']),
    );
    expect(topology?.fileOwners['apps/web/src/app.ts']).toBe('package:apps/web');
    expect(topology?.fileOwners['packages/core/src/index.ts']).toBe(
      'package:packages/core',
    );
    expect(topology?.externalDependencies).toContainEqual({
      packageId: 'package:apps/web',
      name: 'react',
    });
  });

  it('keeps invalid metadata partial without discarding valid package evidence', () => {
    const topology = buildPackageTopology(files, [
      ...metadata,
      { filePath: 'tsconfig.bad.json', text: '{ bad json' },
    ]);

    expect(topology?.status).toBe('partial');
    expect(topology?.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'invalid',
          filePath: 'tsconfig.bad.json',
        }),
      ]),
    );
    expect(topology?.entities.some((entity) => entity.name === '@demo/web')).toBe(
      true,
    );
  });
});
