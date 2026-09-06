import {
  Braces,
  Files,
  FolderGit2,
  GitBranch,
  Network,
  Package,
  PanelRight,
  Play,
  Route,
  ScanSearch,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Button } from '../../components/ui/primitives';
import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

type PreviewNodeId =
  | 'repository'
  | 'sources'
  | 'entries'
  | 'symbols'
  | 'relationships'
  | 'calls'
  | 'dependencies'
  | 'types'
  | 'graph'
  | 'evidence';

type PreviewNode = {
  id: PreviewNodeId;
  label: string;
  meta: string;
  detail: string;
  outputs: string[];
  group: 'intake' | 'analysis' | 'output';
  icon: typeof Braces;
  x: string;
  y: string;
};

type PreviewEdge = {
  from: PreviewNodeId;
  to: PreviewNodeId;
  path: string;
};

const PREVIEW_NODES: PreviewNode[] = [
  {
    id: 'repository',
    label: 'Public repository',
    meta: 'GitHub source',
    detail: 'The source boundary CodeFlow reads before any graph is projected.',
    outputs: ['Repository identity', 'Default branch source'],
    group: 'intake',
    icon: FolderGit2,
    x: '50%',
    y: '8%',
  },
  {
    id: 'sources',
    label: 'Source discovery',
    meta: 'files · modules',
    detail: 'Finds analyzable source structure and the files that can participate in navigation.',
    outputs: ['Source files', 'Module boundaries'],
    group: 'intake',
    icon: Files,
    x: '50%',
    y: '21%',
  },
  {
    id: 'entries',
    label: 'Entry points',
    meta: 'starts · exports',
    detail: 'Surfaces plausible starting symbols so the user can begin from behavior instead of browsing folders.',
    outputs: ['Starting symbols', 'Initial trace targets'],
    group: 'analysis',
    icon: Play,
    x: '29%',
    y: '36%',
  },
  {
    id: 'symbols',
    label: 'Symbol index',
    meta: 'functions · types',
    detail: 'Indexes source-backed symbols that relationships can resolve to stable navigation targets.',
    outputs: ['Functions', 'Types and declarations'],
    group: 'analysis',
    icon: Braces,
    x: '71%',
    y: '36%',
  },
  {
    id: 'relationships',
    label: 'Relationship map',
    meta: 'resolve edges',
    detail: 'Connects indexed symbols into the relationship model used by the interactive workspace.',
    outputs: ['Resolved edges', 'Relationship evidence'],
    group: 'analysis',
    icon: Route,
    x: '50%',
    y: '52%',
  },
  {
    id: 'calls',
    label: 'Calls',
    meta: 'caller → callee',
    detail: 'Shows executable call direction so a behavior path can be followed through functions and methods.',
    outputs: ['Outgoing calls', 'Incoming callers'],
    group: 'analysis',
    icon: GitBranch,
    x: '18%',
    y: '68%',
  },
  {
    id: 'dependencies',
    label: 'Dependencies',
    meta: 'imports · boundaries',
    detail: 'Exposes dependency edges that explain which modules or services a path relies on.',
    outputs: ['Imports', 'Dependency boundaries'],
    group: 'analysis',
    icon: Package,
    x: '50%',
    y: '68%',
  },
  {
    id: 'types',
    label: 'Types & references',
    meta: 'usage · definition',
    detail: 'Connects definitions to references so data shapes and symbol usage remain inspectable beside call flow.',
    outputs: ['Definition links', 'Reference sites'],
    group: 'analysis',
    icon: ScanSearch,
    x: '82%',
    y: '68%',
  },
  {
    id: 'graph',
    label: 'Semantic graph',
    meta: 'navigable projection',
    detail: 'Projects the resolved relationships into the bounded graph the user can explore without losing context.',
    outputs: ['Focused graph', 'Traceable neighborhoods'],
    group: 'output',
    icon: Network,
    x: '36%',
    y: '88%',
  },
  {
    id: 'evidence',
    label: 'Source & evidence',
    meta: 'inspect · verify',
    detail: 'Keeps selected relationships grounded in source context so graph navigation remains evidence-first.',
    outputs: ['Source context', 'Relationship detail'],
    group: 'output',
    icon: PanelRight,
    x: '70%',
    y: '88%',
  },
];

const PREVIEW_EDGES: PreviewEdge[] = [
  {
    from: 'repository',
    to: 'sources',
    path: 'M 360 40 C 360 58, 360 72, 360 94',
  },
  {
    from: 'sources',
    to: 'entries',
    path: 'M 360 105 C 330 125, 265 130, 209 166',
  },
  {
    from: 'sources',
    to: 'symbols',
    path: 'M 360 105 C 390 125, 455 130, 511 166',
  },
  {
    from: 'entries',
    to: 'relationships',
    path: 'M 209 179 C 250 205, 315 210, 360 244',
  },
  {
    from: 'symbols',
    to: 'relationships',
    path: 'M 511 179 C 470 205, 405 210, 360 244',
  },
  {
    from: 'relationships',
    to: 'calls',
    path: 'M 360 255 C 305 275, 205 278, 130 320',
  },
  {
    from: 'relationships',
    to: 'dependencies',
    path: 'M 360 255 C 360 278, 360 292, 360 320',
  },
  {
    from: 'relationships',
    to: 'types',
    path: 'M 360 255 C 415 275, 515 278, 590 320',
  },
  {
    from: 'calls',
    to: 'graph',
    path: 'M 130 334 C 165 365, 215 382, 260 414',
  },
  {
    from: 'dependencies',
    to: 'graph',
    path: 'M 360 334 C 340 365, 310 386, 260 414',
  },
  {
    from: 'types',
    to: 'graph',
    path: 'M 590 334 C 500 370, 375 385, 260 414',
  },
  {
    from: 'graph',
    to: 'evidence',
    path: 'M 276 420 C 340 420, 410 420, 504 420',
  },
];

const CAPABILITIES = [
  'Entry points',
  'Calls',
  'References',
  'Dependencies',
  'Types',
  'Evidence',
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
  const [activeNode, setActiveNode] = useState<PreviewNodeId>('relationships');
  const selectedNode =
    PREVIEW_NODES.find((node) => node.id === activeNode) ?? PREVIEW_NODES[4]!;

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

          <h2 id="landing-title">Understand how the code actually flows.</h2>
          <p className="landing-lede">
            Open a public GitHub repository and follow entry points, calls,
            dependencies, references, and source evidence from one navigable
            graph.
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

          <div
            className="landing-capabilities"
            aria-label="CodeFlow relationships"
          >
            {CAPABILITIES.map((capability) => (
              <span key={capability}>{capability}</span>
            ))}
          </div>

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
            <span>repository analysis</span>
            <span>Source → evidence</span>
          </div>

          <div className="landing-preview-canvas">
            <svg
              className="landing-preview-edges"
              viewBox="0 0 720 460"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {PREVIEW_EDGES.map((edge, index) => {
                const connected =
                  edge.from === activeNode || edge.to === activeNode;

                return (
                  <motion.path
                    key={`${edge.from}-${edge.to}`}
                    className={connected ? 'is-active' : undefined}
                    d={edge.path}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: connected ? 1 : 0.28,
                    }}
                    transition={{
                      pathLength: {
                        duration: 0.45,
                        delay: 0.03 + index * 0.025,
                      },
                      opacity: { duration: 0.16 },
                    }}
                  />
                );
              })}
            </svg>

            <div className="landing-preview-flow">
              {PREVIEW_NODES.map((node, index) => {
                const Icon = node.icon;
                const selected = node.id === activeNode;

                return (
                  <motion.button
                    key={node.id}
                    type="button"
                    className={`landing-preview-node landing-preview-node--${node.group}`}
                    style={{ left: node.x, top: node.y }}
                    aria-pressed={selected}
                    onClick={() => setActiveNode(node.id)}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.04 + index * 0.035 }}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="landing-preview-node-icon">
                      <Icon size={12} aria-hidden="true" />
                    </span>
                    <span className="landing-preview-node-copy">
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
              <div className="landing-preview-detail-heading">
                <span>{selectedNode.group}</span>
                <strong>{selectedNode.label}</strong>
              </div>
              <p>{selectedNode.detail}</p>
              <div
                className="landing-preview-outputs"
                aria-label={`${selectedNode.label} outputs`}
              >
                {selectedNode.outputs.map((output) => (
                  <span key={output}>{output}</span>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
