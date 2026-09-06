import { Braces, Database, GitBranch, Network } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '../../components/ui/primitives';
import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

type PreviewNodeId = 'entry' | 'service' | 'repository';

const PREVIEW_NODES: Array<{
  id: PreviewNodeId;
  label: string;
  meta: string;
  detail: string;
  icon: typeof Braces;
}> = [
  {
    id: 'entry',
    label: 'createOrder()',
    meta: 'src/orders.ts',
    detail: 'Entry point that starts the checkout path.',
    icon: Braces,
  },
  {
    id: 'service',
    label: 'OrderService',
    meta: 'calls · validates',
    detail: 'Connects the entry point to validation and persistence.',
    icon: GitBranch,
  },
  {
    id: 'repository',
    label: 'ordersRepository',
    meta: 'dependency · data',
    detail: 'The persistence boundary reached by this path.',
    icon: Database,
  },
];

export function LandingExperience({
  error,
  onAnalyzeGitHub,
  onClearError,
}: {
  error: string | null;
  onAnalyzeGitHub: (repositoryUrl: string) => Promise<void>;
  onClearError: () => void;
}) {
  const [activeNode, setActiveNode] = useState<PreviewNodeId>('service');
  const selectedNode =
    PREVIEW_NODES.find((node) => node.id === activeNode) ?? PREVIEW_NODES[1]!;

  return (
    <motion.section
      className="landing-experience"
      aria-labelledby="landing-title"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <div className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow">
            <Network size={13} aria-hidden="true" />
            <span>Source-backed code navigation</span>
          </div>

          <h2 id="landing-title">Follow the code, not the file tree.</h2>
          <p className="landing-lede">
            Open a public GitHub repository and trace calls, references,
            dependencies, and types from the path that matters.
          </p>

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

        <div
          className="landing-preview"
          aria-label="Interactive CodeFlow preview"
        >
          <div className="landing-preview-bar">
            <span>checkout-service</span>
            <span>Code graph</span>
          </div>

          <div className="landing-preview-canvas">
            <svg
              className="landing-preview-edges"
              viewBox="0 0 360 250"
              aria-hidden="true"
            >
              <motion.path
                d="M 180 52 C 180 78, 180 90, 180 108"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.08 }}
              />
              <motion.path
                d="M 180 148 C 180 174, 180 186, 180 204"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.18 }}
              />
            </svg>

            <div className="landing-preview-flow">
              {PREVIEW_NODES.map((node, index) => {
                const Icon = node.icon;
                const selected = node.id === activeNode;

                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    className="landing-preview-node"
                    aria-pressed={selected}
                    onClick={() => setActiveNode(node.id)}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + index * 0.08 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="landing-preview-node-icon">
                      <Icon size={13} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{node.label}</strong>
                      <small>{node.meta}</small>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedNode.id}
              className="landing-preview-detail"
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
            >
              <span>Selected</span>
              <strong>{selectedNode.label}</strong>
              <p>{selectedNode.detail}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
