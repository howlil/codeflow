import { Braces, FileSearch, GitBranch, Network } from 'lucide-react';
import { motion } from 'motion/react';

const ACTIVITY_LABELS = [
  { icon: FileSearch, label: 'Scanning source structure' },
  { icon: Braces, label: 'Resolving symbols and entry points' },
  { icon: GitBranch, label: 'Tracing code relationships' },
];

export function AnalysisLoading({ target }: { target: string | null }) {
  return (
    <motion.section
      className="analysis-loading"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <div className="analysis-loading-visual" aria-hidden="true">
        <svg viewBox="0 0 420 240">
          <motion.path
            className="analysis-loading-edge"
            d="M 210 58 C 210 88, 148 88, 148 122"
            animate={{ pathLength: [0.18, 1, 0.18], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            className="analysis-loading-edge"
            d="M 210 58 C 210 88, 274 88, 274 122"
            animate={{
              pathLength: [0.12, 1, 0.12],
              opacity: [0.25, 0.9, 0.25],
            }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              delay: 0.2,
              ease: 'easeInOut',
            }}
          />
          <motion.path
            className="analysis-loading-edge"
            d="M 148 154 C 148 184, 210 184, 210 204"
            animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.2, 0.85, 0.2] }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              delay: 0.4,
              ease: 'easeInOut',
            }}
          />
          <motion.path
            className="analysis-loading-edge"
            d="M 274 154 C 274 184, 210 184, 210 204"
            animate={{ pathLength: [0.1, 1, 0.1], opacity: [0.2, 0.85, 0.2] }}
            transition={{
              duration: 2.1,
              repeat: Infinity,
              delay: 0.55,
              ease: 'easeInOut',
            }}
          />
        </svg>

        <motion.div
          className="analysis-loading-node analysis-loading-node--entry"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Network size={16} />
          <span>entry</span>
        </motion.div>
        <motion.div
          className="analysis-loading-node analysis-loading-node--left"
          animate={{ y: [0, 3, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: 0.15,
            ease: 'easeInOut',
          }}
        >
          <Braces size={15} />
          <span>symbols</span>
        </motion.div>
        <motion.div
          className="analysis-loading-node analysis-loading-node--right"
          animate={{ y: [0, -2, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: 0.28,
            ease: 'easeInOut',
          }}
        >
          <GitBranch size={15} />
          <span>calls</span>
        </motion.div>
        <motion.div
          className="analysis-loading-node analysis-loading-node--result"
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FileSearch size={15} />
          <span>graph</span>
        </motion.div>
      </div>

      <div className="analysis-loading-copy">
        <span className="panel-kicker">Building semantic graph</span>
        <h2>Mapping the codebase into something you can follow.</h2>
        <p>{target !== null ? target : 'Public GitHub repository'}</p>

        <div className="analysis-loading-progress" aria-hidden="true">
          <motion.span
            animate={{ x: ['-100%', '260%'] }}
            transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="analysis-loading-activities">
          {ACTIVITY_LABELS.map(({ icon: Icon, label }, index) => (
            <motion.div
              key={label}
              initial={{ opacity: 0.35 }}
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: index * 0.36,
                ease: 'easeInOut',
              }}
            >
              <Icon size={13} aria-hidden="true" />
              <span>{label}</span>
            </motion.div>
          ))}
        </div>

        <small>
          CodeFlow does not receive backend percentage updates yet, so this is
          an activity indicator rather than a fake completion estimate.
        </small>
      </div>
    </motion.section>
  );
}
