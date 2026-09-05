import { useState, type FormEvent } from 'react';

export function GitHubPullRequestPicker({
  busy,
  onAnalyze,
}: {
  busy: boolean;
  onAnalyze: (pullRequestUrl: string) => Promise<void>;
}) {
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = pullRequestUrl.trim();
    if (!isPublicGitHubPullRequestUrl(value)) {
      setLocalError(
        'Enter a public GitHub pull request URL such as https://github.com/owner/repository/pull/123.',
      );
      return;
    }
    setLocalError(null);
    void onAnalyze(value);
  }

  return (
    <section
      className="github-acquisition"
      aria-labelledby="github-pr-acquisition-title"
    >
      <div>
        <p className="panel-kicker">Change overlay</p>
        <h2 id="github-pr-acquisition-title">Visualize a pull request on the code graph</h2>
        <p>
          CodeFlow freezes BASE and HEAD, maps semantic changes, then overlays
          changed entities and relationships on the same navigable graph.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-pull-request-url">
          Public GitHub pull request URL
        </label>
        <div className="github-input-row">
          <input
            id="github-pull-request-url"
            type="url"
            value={pullRequestUrl}
            placeholder="https://github.com/owner/repository/pull/123"
            autoComplete="url"
            disabled={busy}
            onChange={(event) => setPullRequestUrl(event.target.value)}
          />
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? 'Analyzing…' : 'Open change graph'}
          </button>
        </div>
        <p className="github-note">
          Public PRs · immutable BASE/HEAD SHAs · bounded TypeScript analysis ·
          no repository execution
        </p>
      </form>
      {localError === null ? null : (
        <p className="repository-input-error" role="alert">
          {localError}
        </p>
      )}
    </section>
  );
}

function isPublicGitHubPullRequestUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const segments = url.pathname.split('/').filter(Boolean);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      segments.length === 4 &&
      segments[2] === 'pull' &&
      /^\d+$/.test(segments[3] ?? '')
    );
  } catch {
    return false;
  }
}
