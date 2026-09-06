import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import {
  analyzeGitHubRepository,
  analyzeRepositoryFlow,
  type FlowProjection,
  type RepositoryAnalysisRequest,
} from './integrations/api/flow-client';
import {
  analyzeGitHubPullRequest,
  type PullRequestAnalysis,
} from './integrations/api/change-client';
import { GitHubPullRequestPicker } from './features/acquisition/GitHubPullRequestPicker';
import { GitHubRepositoryPicker } from './features/acquisition/GitHubRepositoryPicker';
import { GraphWorkspace } from './features/workspace/GraphWorkspace';
import {
  RepositoryPicker,
  type RepositorySelectionSummary,
} from './features/acquisition/RepositoryPicker';
import type { SemanticGraphNode } from './domain/graph/graph-model';
import { Button, IconButton } from './components/ui/primitives';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'codeflow-theme';

export function App() {
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [changeAnalysis, setChangeAnalysis] =
    useState<PullRequestAnalysis | null>(null);
  const [selectionSummary, setSelectionSummary] =
    useState<RepositorySelectionSummary | null>(null);
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState<string | null>(
    null,
  );
  const [localRequest, setLocalRequest] =
    useState<RepositoryAnalysisRequest | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // The selected theme remains applied when persistence is unavailable.
    }
  }, [theme]);

  async function analyzeRepository(
    request: RepositoryAnalysisRequest,
    summary: RepositorySelectionSummary,
  ) {
    setAnalyzing(true);
    setError(null);
    setChangeAnalysis(null);
    setGithubRepositoryUrl(null);
    setLocalRequest(request);
    setSelectionSummary(summary);
    try {
      const loaded = await analyzeRepositoryFlow(request);
      setFlow(loaded);
    } catch (caughtError: unknown) {
      setFlow(null);
      setError(
        errorMessage(caughtError, 'Unable to analyze the selected repository.'),
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzeGitHub(
    repositoryUrl: string,
    entryPoint?: { filePath: string; name: string },
  ) {
    setAnalyzing(true);
    setError(null);
    setChangeAnalysis(null);
    setGithubRepositoryUrl(repositoryUrl);
    setLocalRequest(null);
    try {
      const loaded = await analyzeGitHubRepository(repositoryUrl, entryPoint);
      setFlow(loaded);
      setSelectionSummary({
        rootLabel: loaded.repository?.name ?? repositoryUrl,
        selectedFileCount: loaded.sources.length,
        ignoredFileCount: loaded.analysis.ignoredFileCount,
      });
    } catch (caughtError: unknown) {
      setFlow(null);
      setError(
        errorMessage(
          caughtError,
          'Unable to analyze the public GitHub repository.',
        ),
      );
    } finally {
      setAnalyzing(false);
    }
  }

  async function analyzePullRequest(pullRequestUrl: string) {
    setAnalyzing(true);
    setError(null);
    setGithubRepositoryUrl(null);
    setLocalRequest(null);
    try {
      const loaded = await analyzeGitHubPullRequest(pullRequestUrl);
      setChangeAnalysis(loaded);
      setFlow(loaded.head);
      setSelectionSummary({
        rootLabel: `${loaded.change.source.repository} · PR #${loaded.change.source.pullRequestNumber}`,
        selectedFileCount: loaded.head.sources.length,
        ignoredFileCount: loaded.head.analysis.ignoredFileCount,
      });
    } catch (caughtError: unknown) {
      setFlow(null);
      setChangeAnalysis(null);
      setError(
        errorMessage(
          caughtError,
          'Unable to visualize the public pull request.',
        ),
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function selectEntry(entryPoint: { filePath: string; name: string }) {
    if (githubRepositoryUrl !== null) {
      void analyzeGitHub(githubRepositoryUrl, entryPoint);
      return;
    }
    if (localRequest !== null) {
      void analyzeRepository(
        { ...localRequest, entryPoint },
        selectionSummary ?? {
          rootLabel: entryPoint.filePath,
          selectedFileCount: localRequest.files.length,
          ignoredFileCount: 0,
        },
      );
      return;
    }
    if (changeAnalysis !== null) {
      const entry = (changeAnalysis.head.entryPoints ?? []).find(
        (candidate) =>
          candidate.filePath === entryPoint.filePath &&
          candidate.name === entryPoint.name,
      );
      if (entry !== undefined) {
        setFlow({ ...changeAnalysis.head, entryPointId: entry.id });
      }
    }
  }

  function traceFunction(node: SemanticGraphNode) {
    if (node.kind !== 'Function') {
      return;
    }
    const filePath = node.path ?? node.location?.filePath;
    if (filePath === undefined || filePath === null) {
      return;
    }
    const entryPoint = { filePath, name: node.label };
    if (githubRepositoryUrl !== null) {
      void analyzeGitHub(githubRepositoryUrl, entryPoint);
      return;
    }
    if (localRequest !== null) {
      void analyzeRepository(
        { ...localRequest, entryPoint },
        selectionSummary ?? {
          rootLabel: filePath,
          selectedFileCount: localRequest.files.length,
          ignoredFileCount: 0,
        },
      );
      return;
    }
    if (changeAnalysis !== null) {
      setFlow({ ...changeAnalysis.head, entryPointId: node.id });
    }
  }

  function resetRepository() {
    setFlow(null);
    setChangeAnalysis(null);
    setSelectionSummary(null);
    setGithubRepositoryUrl(null);
    setLocalRequest(null);
    setError(null);
  }

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
    >
      <main className="workspace-shell graph-app-shell">
        <header className="workspace-header graph-app-header">
          <div className="workspace-brand">
            <h1>CodeFlow</h1>
            <span>
              See where code starts, where it goes, and what it depends on.
            </span>
          </div>
          <IconButton
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={() =>
              setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
            }
          >
            {theme === 'dark' ? (
              <Sun size={14} aria-hidden="true" />
            ) : (
              <Moon size={14} aria-hidden="true" />
            )}
          </IconButton>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {analyzing ? (
            <motion.section
              key="analyzing"
              className="graph-loading-state"
              role="status"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <strong>Building semantic graph…</strong>
              <span>
                Finding entry points and source-backed relationships without
                executing repository code.
              </span>
            </motion.section>
          ) : flow !== null ? (
            <GraphWorkspace
              key={`${flow.id}:${flow.entryPointId}:${changeAnalysis?.change.source.headRevision ?? ''}`}
              flow={flow}
              changeAnalysis={changeAnalysis}
              selectionSummary={selectionSummary}
              onSelectEntry={selectEntry}
              onTraceFunction={traceFunction}
              onChangeRepository={resetRepository}
            />
          ) : (
            <AcquisitionWorkspace
              key="acquisition"
              error={error}
              onAnalyzeGitHub={analyzeGitHub}
              onAnalyzeLocal={analyzeRepository}
              onAnalyzePullRequest={analyzePullRequest}
              onClearError={() => setError(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}

function AcquisitionWorkspace({
  error,
  onAnalyzeGitHub,
  onAnalyzeLocal,
  onAnalyzePullRequest,
  onClearError,
}: {
  error: string | null;
  onAnalyzeGitHub: (repositoryUrl: string) => Promise<void>;
  onAnalyzeLocal: (
    request: RepositoryAnalysisRequest,
    summary: RepositorySelectionSummary,
  ) => Promise<void>;
  onAnalyzePullRequest: (pullRequestUrl: string) => Promise<void>;
  onClearError: () => void;
}) {
  return (
    <motion.section
      className="graph-acquisition"
      aria-labelledby="graph-acquisition-title"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <div className="graph-acquisition-intro">
        <span className="panel-kicker">Code graph</span>
        <h2 id="graph-acquisition-title">Visualize how a codebase connects</h2>
        <p>
          Open a repository, start from an entry point or symbol, then follow
          calls, references, dependencies, and type relationships through one
          semantic graph.
        </p>
      </div>

      <AnimatePresence initial={false}>
        {error !== null ? (
          <motion.div
            key="acquisition-error"
            className="graph-acquisition-error"
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
          >
            <span>{error}</span>
            <Button variant="ghost" onClick={onClearError}>
              Dismiss
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <GitHubRepositoryPicker
        busy={false}
        error={null}
        onAnalyze={onAnalyzeGitHub}
      />

      <div className="graph-acquisition-secondary">
        <details>
          <summary>Analyze a local repository</summary>
          <RepositoryPicker busy={false} onAnalyze={onAnalyzeLocal} />
        </details>
        <details>
          <summary>Visualize pull request changes on the graph</summary>
          <GitHubPullRequestPicker
            busy={false}
            onAnalyze={onAnalyzePullRequest}
          />
        </details>
      </div>
    </motion.section>
  );
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Fall through to system preference.
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

function errorMessage(caughtError: unknown, fallback: string): string {
  return caughtError instanceof Error ? caughtError.message : fallback;
}
