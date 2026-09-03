import { useState, type FormEvent } from 'react';

export function GitHubRepositoryPicker({
  busy,
  error,
  onAnalyze,
}: {
  busy: boolean;
  error: string | null;
  onAnalyze: (repositoryUrl: string) => Promise<void>;
}) {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = repositoryUrl.trim();
    if (!isPublicGitHubRepositoryUrl(value)) {
      setLocalError(
        'Enter a public GitHub repository URL such as https://github.com/owner/repository.',
      );
      return;
    }
    setLocalError(null);
    void onAnalyze(value);
  }

  return (
    <section
      className="github-acquisition"
      aria-labelledby="github-acquisition-title"
    >
      <div>
        <p className="panel-kicker">Start with a repository</p>
        <h2 id="github-acquisition-title">Understand an unfamiliar codebase</h2>
        <p>
          Paste a public GitHub URL. CodeFlow will find deterministic entry
          points and open the evidence-backed semantic workspace.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-repository-url">
          Public GitHub repository URL
        </label>
        <div className="github-input-row">
          <input
            id="github-repository-url"
            type="url"
            value={repositoryUrl}
            placeholder="https://github.com/owner/repository"
            autoComplete="url"
            disabled={busy}
            onChange={(event) => setRepositoryUrl(event.target.value)}
          />
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? 'Analyzing…' : 'Analyze GitHub repository'}
          </button>
        </div>
        <p className="github-note">
          Public repositories · bounded TypeScript source · request-scoped ·
          static analysis only
        </p>
      </form>
      {localError !== null || error !== null ? (
        <p className="repository-input-error" role="alert">
          {localError ?? error}
        </p>
      ) : null}
    </section>
  );
}

function isPublicGitHubRepositoryUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'github.com' &&
      url.pathname.split('/').filter(Boolean).length === 2
    );
  } catch {
    return false;
  }
}
