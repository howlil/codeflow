import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildApp } from './app.js';

const baseFiles = {
  'core.ts': 'export function processPayment() {\n  return 1;\n}\n',
  'api.ts':
    "import { processPayment } from './core';\nexport function handle() {\n  return processPayment();\n}\n",
  'web.ts':
    "import { handle } from './api';\nexport function render() {\n  return handle();\n}\n",
};
const headFiles = {
  ...baseFiles,
  'core.ts': 'export function processPayment() {\n  return 2;\n}\n',
};

describe('M9 public pull request analysis API', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(mockGitHubFetch));
    app = buildApp();
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await app.close();
  });

  it('freezes base/head revisions, maps changed code, and derives downstream impact', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/changes/github',
      payload: {
        pullRequestUrl: 'https://github.com/demo/repo/pull/7',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      change: {
        source: { baseRevision: string; headRevision: string };
        entities: Array<{ name: string; changeKind: string }>;
        impact: {
          head: { results: Array<{ name: string; distance: number }> } | null;
        };
      };
      base: { repository?: { revision?: string } };
      head: { repository?: { revision?: string } };
    }>();
    expect(body.change.source).toEqual(
      expect.objectContaining({
        baseRevision: 'base123',
        headRevision: 'head456',
      }),
    );
    expect(body.base.repository?.revision).toBe('base123');
    expect(body.head.repository?.revision).toBe('head456');
    expect(body.change.entities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'processPayment',
          changeKind: 'modified',
        }),
      ]),
    );
    expect(body.change.impact.head?.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'handle', distance: 1 }),
        expect.objectContaining({ name: 'render', distance: 2 }),
      ]),
    );
  });

  it('rejects a non-PR GitHub URL before remote acquisition', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/changes/github',
      payload: { pullRequestUrl: 'https://github.com/demo/repo' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ code: string }>().code).toBe(
      'INVALID_PULL_REQUEST_URL',
    );
  });
});

async function mockGitHubFetch(
  input: string | URL | Request,
): Promise<Response> {
  const url = String(input);
  if (url.endsWith('/repos/demo/repo/pulls/7')) {
    return json({
      number: 7,
      title: 'Change payment flow',
      html_url: 'https://github.com/demo/repo/pull/7',
      changed_files: 1,
      base: {
        sha: 'base123',
        repo: {
          full_name: 'demo/repo',
          html_url: 'https://github.com/demo/repo',
          name: 'repo',
        },
      },
      head: {
        sha: 'head456',
        repo: {
          full_name: 'demo/repo',
          html_url: 'https://github.com/demo/repo',
          name: 'repo',
        },
      },
    });
  }
  if (url.includes('/pulls/7/files?')) {
    return json([
      {
        filename: 'core.ts',
        status: 'modified',
        additions: 1,
        deletions: 1,
        patch:
          '@@ -1,3 +1,3 @@\n export function processPayment() {\n-  return 1;\n+  return 2;\n }',
      },
    ]);
  }
  if (url.includes('/git/trees/base123?')) {
    return json(tree(baseFiles));
  }
  if (url.includes('/git/trees/head456?')) {
    return json(tree(headFiles));
  }
  if (url.includes('raw.githubusercontent.com/demo/repo/base123/')) {
    return rawFor(url, baseFiles, 'base123');
  }
  if (url.includes('raw.githubusercontent.com/demo/repo/head456/')) {
    return rawFor(url, headFiles, 'head456');
  }
  return new Response('not found', { status: 404 });
}

function tree(files: Record<string, string>) {
  return {
    truncated: false,
    tree: Object.entries(files).map(([path, text]) => ({
      path,
      type: 'blob',
      size: new TextEncoder().encode(text).byteLength,
    })),
  };
}

function rawFor(
  url: string,
  files: Record<string, string>,
  revision: string,
): Response {
  const marker = `/${revision}/`;
  const path = decodeURIComponent(
    url.slice(url.indexOf(marker) + marker.length),
  );
  const text = files[path];
  return text === undefined
    ? new Response('not found', { status: 404 })
    : new Response(text, { status: 200 });
}

function json(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
