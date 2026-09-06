import { Moon, Sun } from 'lucide-react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { useEffect, useState } from 'react';

import {
  analyzeGitHubRepository,
  type FlowProjection,
} from './integrations/api/flow-client';
import { AnalysisLoading } from './features/acquisition/AnalysisLoading';
import { LandingExperience } from './features/acquisition/LandingExperience';
import { GraphWorkspace } from './features/workspace/GraphWorkspace';
import type { RepositorySelectionSummary } from './features/acquisition/RepositoryPicker';
import type { SemanticGraphNode } from './domain/graph/graph-model';
import { IconButton, ProductIcon } from './components/ui/primitives';

type Theme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'codeflow-theme';

export function App() {
  const [flow, setFlow] = useState<FlowProjection | null>(null);
  const [selectionSummary, setSelectionSummary] =
    useState<RepositorySelectionSummary | null>(null);
  const [githubRepositoryUrl, setGithubRepositoryUrl] = useState<string | null>(
    null,
  );
  const [analysisTarget, setAnalysisTarget] = useState<string | null>(null);
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

  async function analyzeGitHub(
    repositoryUrl: string,
    entryPoint?: { filePath: string; name: string },
  ) {
    setAnalyzing(true);
    setError(null);
    setGithubRepositoryUrl(repositoryUrl);
    setAnalysisTarget(repositoryUrl);
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

  function selectEntry(entryPoint: { filePath: string; name: string }) {
    if (githubRepositoryUrl !== null) {
      void analyzeGitHub(githubRepositoryUrl, entryPoint);
    }
  }

  function traceFunction(node: SemanticGraphNode) {
    if (node.kind !== 'Function' || githubRepositoryUrl === null) {
      return;
    }
    const filePath = node.path ?? node.location?.filePath;
    if (filePath === undefined || filePath === null) {
      return;
    }
    void analyzeGitHub(githubRepositoryUrl, {
      filePath,
      name: node.label,
    });
  }

  function resetRepository() {
    setFlow(null);
    setSelectionSummary(null);
    setGithubRepositoryUrl(null);
    setAnalysisTarget(null);
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
            {flow === null && !analyzing ? (
              <span>Source-backed code navigation</span>
            ) : null}
          </div>
          <IconButton
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            onClick={() =>
              setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
            }
          >
            <ProductIcon icon={theme === 'dark' ? Sun : Moon} size={13} />
          </IconButton>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {analyzing ? (
            <AnalysisLoading key="analyzing" target={analysisTarget} />
          ) : flow !== null ? (
            <GraphWorkspace
              key={`${flow.id}:${flow.entryPointId}`}
              flow={flow}
              changeAnalysis={null}
              selectionSummary={selectionSummary}
              onSelectEntry={selectEntry}
              onTraceFunction={traceFunction}
              onChangeRepository={resetRepository}
            />
          ) : (
            <LandingExperience
              key="acquisition"
              error={error}
              onAnalyzeGitHub={analyzeGitHub}
              onClearError={() => setError(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
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
