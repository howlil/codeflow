import {
  ArrowRight,
  Braces,
  Database,
  GitBranch,
  Network,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '../../components/ui/primitives';
import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

type DemoNodeId = 'entry' | 'service' | 'data';

const DEMO_NODES: Array<{
  id: DemoNodeId;
  label: string;
  detail: string;
  icon: typeof Braces;
}> = [
  {
    id: 'entry',
    label: 'createOrder()',
    detail: 'Entry point · src/orders.ts',
    icon: Braces,
  },
  {
    id: 'service',
    label: 'OrderService',
    detail: 'Calls saveOrder() and validates state',
    icon: GitBranch,
  },
  {
    id: 'data',
    label: 'ordersRepository',
    detail: 'Persists through the data boundary',
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
  const [activeNode, setActiveNode] = useState<DemoNodeId>('service');
  const selectedNode =
    DEMO_NODES.find((node) => node.id === activeNode) ?? DEMO_NODES[1];

  return (
    <motion.section
      className="landing-experience"
      aria-labelledby="landing-title"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <div className="landing-hero">
        <div className="landing-copy">
          <div className="landing-eyebrow">
            <Network size={13} aria-hidden="true" />
            <span>Semantic code exploration</span>
          </div>

          <h2 id="landing-title">Follow the code, not the file tree.</h2>
          <p className="landing-lede">
            Paste a public GitHub repository. CodeFlow maps entry points, calls,
            imports, references, and dependencies into one source-backed graph
            you can explore from the path that matters.
          </p>

          <GitHubRepositoryPicker
            busy={false}
            error={null}
            onAnalyze={onAnalyzeGitHub}
          />

          <div className="landing-trust-row" aria-label="Analysis properties">
            <span>Static analysis only</span>
            <span>Source-backed relationships</span>
            <span>No repository code execution</span>
          </div>

          <AnimatePresence initial={false}>
            {error !== null ? (
              <motion.div
                key="landing-error"
                className="graph-acquisition-error landing-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <span>{error}</span>
                <Button variant="ghost" onClick={onClearError}>
                  Dismiss
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="landing-demo" aria-label="Interactive CodeFlow preview">
          <div className="landing-demo-toolbar">
            <div>
              <span className="landing-window-dot" />
              <span className="landing-window-dot" />
              <span className="landing-window-dot" />
            </div>
            <span>checkout-service · code graph</span>
          </div>

          <div className="landing-demo-canvas">
            <svg
              className="landing-demo-edges"
              viewBox="0 0 440 290"
              aria-hidden="true"
            >
              <motion.path
                d="M 220 62 C 220 100, 220 108, 220 132"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.12 }}
              />
              <motion.path
                d="M 220 174 C 220 205, 220 214, 220 238"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.25 }}
              />
            </svg>

            <div className="landing-demo-flow">
              {DEMO_NODES.map((node, index) => {
                const Icon = node.icon;
                const selected = node.id === activeNode;
                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    className="landing-demo-node"
                    aria-pressed={selected}
                    onClick={() => setActiveNode(node.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 + index * 0.09 }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                  >
                    <span className="landing-demo-node-icon">
                      <Icon size={14} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>{node.label}</strong>
                      <small>{node.detail}</small>
                    </span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </motion.button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedNode.id}
              className="landing-demo-inspector"
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
            >
              <span>Selected relationship</span>
              <strong>{selectedNode.label}</strong>
              <p>{selectedNode.detail}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="landing-outcome-strip">
        <div>
          <strong>Start from behavior</strong>
          <span>Find the entry point, then expand only the path you need.</span>
        </div>
        <div>
          <strong>Keep evidence visible</strong>
          <span>Relationships stay tied to source locations and analysis evidence.</span>
        </div>
        <div>
          <strong>Reduce codebase archaeology</strong>
          <span>Move from “where is this?” to “what does this reach?” in one surface.</span>
        </div>
      </div>
    </motion.section>
  );
}
