import { AnimatePresence, motion } from 'motion/react';

import { Button } from '../../components/ui/primitives';
import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

export function LandingExperience({
  error,
  onAnalyzeGitHub,
  onClearError,
}: {
  error: string | null;
  onAnalyzeGitHub: (repositoryUrl: string) => Promise<void>;
  onClearError: () => void;
}) {
  return (
    <motion.section
      className="landing-experience"
      aria-labelledby="landing-title"
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
    >
      <div className="landing-launcher">
        <div className="landing-intro">
          <h2 id="landing-title">Open a codebase</h2>
          <p>
            Trace calls, references, dependencies, and types from a public
            GitHub repository.
          </p>
        </div>

        <GitHubRepositoryPicker
          busy={false}
          error={null}
          onAnalyze={onAnalyzeGitHub}
        />

        <p className="landing-constraints">
          Static analysis · source-backed relationships · no repository code
          execution
        </p>

        <AnimatePresence initial={false}>
          {error !== null ? (
            <motion.div
              key="landing-error"
              className="landing-error"
              role="alert"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
            >
              <span>{error}</span>
              <Button variant="ghost" onClick={onClearError}>
                Dismiss
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
