from pathlib import Path

# Canonical global tokens and shell only. Feature CSS owns feature-specific layout.
Path('apps/web/src/styles/index.css').write_text("""@import 'tailwindcss';

@theme {
  --color-cs-bg: #101112;
  --color-cs-panel: #151718;
  --color-cs-surface: #1b1e20;
  --color-cs-raised: #222629;
  --color-cs-border: #2d3134;
  --color-cs-control: #191c1e;
  --color-cs-hover: #202427;
  --color-cs-active: #292e31;
  --color-cs-focus: #d07a59;
  --color-cs-primary: #e9e7e2;
  --color-cs-primary-contrast: #161719;
  --color-cs-text: #e5e3df;
  --color-cs-muted: #a09d97;
  --color-cs-subtle: #73716c;
  --color-cs-danger: #e08d7e;
  --color-cs-danger-surface: #2b1a17;
  --color-cs-danger-border: #6f4038;
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI',
    sans-serif;
  --font-mono: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

:root {
  --font-display: var(--font-sans);
  --shadow-node: none;
  --shadow-overlay: 0 14px 36px rgb(0 0 0 / 28%);
  --shadow-selected: 0 0 0 1px var(--color-cs-focus);
  --radius-workspace: 0;
  --radius-panel: 4px;
  --radius-node: 4px;
  --radius-control: 5px;
  --radius-overlay: 6px;
  --radius-pill: 999px;
  color: var(--color-cs-text);
  background: var(--color-cs-bg);
  font-family: var(--font-sans);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
}

html {
  color-scheme: dark;
  background: var(--color-cs-bg);
}

html[data-theme='light'] {
  color-scheme: light;
  --color-cs-bg: #f4f4f2;
  --color-cs-panel: #fbfbf9;
  --color-cs-surface: #eeeeeb;
  --color-cs-raised: #e4e4e0;
  --color-cs-border: #d1d2ce;
  --color-cs-control: #ffffff;
  --color-cs-hover: #eceeeb;
  --color-cs-active: #e3e6e2;
  --color-cs-focus: #ad5f43;
  --color-cs-primary: #242526;
  --color-cs-primary-contrast: #fafaf7;
  --color-cs-text: #292a2b;
  --color-cs-muted: #666863;
  --color-cs-subtle: #898b85;
  --color-cs-danger: #a94436;
  --color-cs-danger-surface: #f6e9e5;
  --color-cs-danger-border: #d3a097;
  --shadow-overlay: 0 14px 34px rgb(32 34 30 / 14%);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  min-width: 320px;
  margin: 0;
}

body {
  overflow: hidden;
  background: var(--color-cs-bg);
  color: var(--color-cs-text);
  font-family: var(--font-sans);
  font-size: 12px;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  scrollbar-color: var(--color-cs-border) transparent;
  scrollbar-width: thin;
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  -webkit-tap-highlight-color: transparent;
}

button:focus-visible,
input:focus-visible,
select:focus-visible,
summary:focus-visible {
  outline: 2px solid var(--color-cs-focus);
  outline-offset: 2px;
}

::selection {
  background: var(--color-cs-active);
}

.workspace-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100dvh;
  min-height: 0;
  overflow: auto;
  background: var(--color-cs-bg);
  color: var(--color-cs-text);
}

.workspace-header {
  display: flex;
  z-index: 60;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 40px;
  padding: 0 10px;
  background: var(--color-cs-panel);
  border-bottom: 1px solid var(--color-cs-border);
}

.workspace-brand {
  display: flex;
  align-items: baseline;
  gap: 9px;
  min-width: 0;
}

.workspace-brand h1,
h2,
p {
  margin-top: 0;
}

.workspace-brand h1 {
  margin-bottom: 0;
  font-size: 13px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.workspace-brand span {
  overflow: hidden;
  color: var(--color-cs-muted);
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

h2 {
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.panel-kicker {
  margin: 0 0 3px;
  color: var(--color-cs-muted);
  font-size: 10px;
  font-weight: 600;
}
""")

# Keep the newer honest loading state, but replace the marketing/demo landing with a compact launcher.
landing_path = Path('apps/web/src/styles/landing.css')
landing_css = landing_path.read_text()
loading_start = landing_css.index('.analysis-loading {')
loading_css = landing_css[loading_start:]
landing_path.write_text(""".landing-experience {
  display: grid;
  place-items: start center;
  width: 100%;
  padding: clamp(28px, 8vh, 76px) 16px 24px;
}

.landing-launcher {
  display: grid;
  gap: 14px;
  width: min(100%, 680px);
}

.landing-intro {
  display: grid;
  gap: 5px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-cs-border);
}

.landing-intro h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 620;
}

.landing-intro p {
  max-width: 580px;
  margin: 0;
  color: var(--color-cs-muted);
  font-size: 11px;
  line-height: 1.5;
}

.landing-experience .github-acquisition {
  display: grid;
  gap: 8px;
}

.landing-experience .github-acquisition > div {
  display: none;
}

.landing-experience .github-acquisition form {
  display: grid;
  gap: 6px;
}

.landing-experience .github-acquisition label {
  color: var(--color-cs-muted);
  font-size: 10px;
  font-weight: 600;
}

.landing-experience .github-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 6px;
}

.landing-experience .github-input-row input {
  min-width: 0;
  height: 34px;
  padding: 0 9px;
  color: var(--color-cs-text);
  background: var(--color-cs-control);
  border: 1px solid var(--color-cs-border);
  border-radius: var(--radius-control);
  outline: none;
}

.landing-experience .github-input-row input:focus {
  border-color: var(--color-cs-focus);
}

.landing-experience .primary-action {
  min-height: 34px;
  padding: 0 12px;
  color: var(--color-cs-primary-contrast);
  background: var(--color-cs-primary);
  border: 1px solid var(--color-cs-primary);
  border-radius: var(--radius-control);
  cursor: pointer;
}

.landing-experience .primary-action:disabled {
  cursor: default;
  opacity: 0.45;
}

.landing-constraints {
  margin: 0;
  color: var(--color-cs-subtle);
  font-size: 10px;
}

.landing-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 8px;
  color: var(--color-cs-danger);
  background: var(--color-cs-danger-surface);
  border: 1px solid var(--color-cs-danger-border);
  border-radius: var(--radius-control);
}

.repository-input-error {
  margin: 0;
  color: var(--color-cs-danger);
  font-size: 10px;
}

@media (max-width: 560px) {
  .landing-experience {
    padding-top: 24px;
  }

  .landing-experience .github-input-row {
    grid-template-columns: 1fr;
  }
}

""" + loading_css)

Path('apps/web/src/features/acquisition/LandingExperience.tsx').write_text("""import { AnimatePresence, motion } from 'motion/react';

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
      className=\"landing-experience\"
      aria-labelledby=\"landing-title\"
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
    >
      <div className=\"landing-launcher\">
        <div className=\"landing-intro\">
          <h2 id=\"landing-title\">Open a codebase</h2>
          <p>
            Trace calls, references, dependencies, and types from a public GitHub repository.
          </p>
        </div>

        <GitHubRepositoryPicker
          busy={false}
          error={null}
          onAnalyze={onAnalyzeGitHub}
        />

        <p className=\"landing-constraints\">
          Static analysis · source-backed relationships · no repository code execution
        </p>

        <AnimatePresence initial={false}>
          {error !== null ? (
            <motion.div
              key=\"landing-error\"
              className=\"landing-error\"
              role=\"alert\"
              initial={{ opacity: 0, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -2 }}
            >
              <span>{error}</span>
              <Button variant=\"ghost\" onClick={onClearError}>
                Dismiss
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
""")

# Runtime should have one canonical design system plus feature-owned CSS.
main = Path('apps/web/src/main.tsx')
text = main.read_text()
text = text.replace("import './styles/workbench.css';\n", '')
text = text.replace("import './styles/anthropic-theme.css';\n", '')
main.write_text(text)

# Make the application header operational once a graph is active.
app = Path('apps/web/src/App.tsx')
text = app.read_text()
text = text.replace(
    "          <div className=\"workspace-brand\">\n            <h1>CodeFlow</h1>\n            <span>\n              See where code starts, where it goes, and what it depends on.\n            </span>\n          </div>",
    "          <div className=\"workspace-brand\">\n            <h1>CodeFlow</h1>\n            {flow === null && !analyzing ? (\n              <span>Source-backed code navigation</span>\n            ) : null}\n          </div>",
)
app.write_text(text)

# Compact GitHub picker copy; behavior remains unchanged.
picker = Path('apps/web/src/features/acquisition/GitHubRepositoryPicker.tsx')
text = picker.read_text()
text = text.replace('<p className="panel-kicker">Repository</p>\n        ', '')
text = text.replace('Open a public GitHub repository', 'GitHub repository')
text = text.replace(
    "        <p>\n          CodeFlow finds entry points and builds a bounded semantic graph of\n          source-backed code relationships.\n        </p>\n",
    '',
)
text = text.replace(
    '<label htmlFor="github-repository-url">\n          Public GitHub repository URL\n        </label>',
    '<label htmlFor="github-repository-url">Repository URL</label>',
)
text = text.replace(
    "        <p className=\"github-note\">\n          Public repositories · bounded TypeScript source · request-scoped ·\n          static analysis only\n        </p>\n",
    '',
)
picker.write_text(text)

# Keep latest landing/loading tests, but align them to the intentional compact launcher.
app_test = Path('apps/web/src/App.test.tsx')
text = app_test.read_text()
text = text.replace("it('starts from an interactive public-repository landing'", "it('starts from a compact public-repository launcher'")
text = text.replace("name: 'Follow the code, not the file tree.'", "name: 'Open a codebase'")
text = text.replace('Public GitHub repository URL', 'Repository URL')
old_demo_assertions = """    const entryNode = screen.getByRole('button', { name: /createOrder/ });
    fireEvent.click(entryNode);
    expect(entryNode).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Selected relationship')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
"""
text = text.replace(
    old_demo_assertions,
    """    expect(
      screen.getByText(/static analysis · source-backed relationships/i),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Interactive CodeFlow preview')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
""",
)
app_test.write_text(text)

picker_test = Path('apps/web/src/features/acquisition/GitHubRepositoryPicker.test.tsx')
text = picker_test.read_text()
text = text.replace('Open a public GitHub repository', 'GitHub repository')
text = text.replace('Public GitHub repository URL', 'Repository URL')
picker_test.write_text(text)

# Durable milestone record must reflect the current-master landing cleanup as well.
Path('.agents/CURRENT_ITERATION.md').write_text("""# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M15 - Product-Native UX Cleanup

## Product Outcome Delivered

CodeFlow now behaves and reads as one code-navigation instrument instead of a sequence of aesthetic/demo layers. The landing is a compact repository launcher, Entry/Focus/Selected are independent states, inspector actions are progressive and contextual, and motion is reserved for orientation/state continuity.

The resulting comprehension loop is:

```text
OPEN CODEBASE
-> FIND / CHOOSE SYMBOL
-> FOLLOW CURRENT FOCUS
-> EXPAND ONLY THE NEEDED DIRECTION
-> SELECT NODE OR RELATIONSHIP
-> INSPECT SOURCE + EVIDENCE
-> REFOCUS / TRACE DEPENDENTS WHEN NEEDED
```

## Completed Slices

- S1 removed stacked workbench/Anthropic skin ownership from runtime, reduced global CSS to canonical tokens/shell responsibilities, and tightened technical geometry.
- S2 made Entry, Focus, and Selected explicit independent graph states with separate markers/treatments.
- S3 replaced marketing/demo acquisition with a compact launcher, removed redundant graph metadata, and changed inspector actions from a permanent buffet to contextual progressive actions.
- S4 removed high-frequency inspector/search polish while preserving graph spatial transitions and the honest analysis activity state; superseded skin files were removed.

## Boundaries Preserved

- Public-repository analysis behavior and API contracts are unchanged.
- No graph truth, persistence, analysis engine, or repository-selection contract changed.
- No graph database, physics layout, AI feature, or new product capability was added.
- Deterministic bounded graph expansion remains the core interaction.
- The visual system is CodeFlow-native: compact, code-oriented, direct, spatially stable, evidence-first, quiet, and precise.

## Verification

Formatting, lint, production build, and web behavior tests are required before integration. Production Compose validation is not required for this frontend-only milestone.
""")

# Superseded aesthetic skins are no longer sources of truth.
for obsolete in (
    Path('apps/web/src/styles/workbench.css'),
    Path('apps/web/src/styles/anthropic-theme.css'),
):
    if obsolete.exists():
        obsolete.unlink()
