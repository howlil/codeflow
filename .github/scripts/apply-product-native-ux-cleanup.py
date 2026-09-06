from pathlib import Path
import re


def replace(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text()
    if old not in text:
        raise SystemExit(f"missing expected block in {path}: {old[:80]!r}")
    target.write_text(text.replace(old, new))


# Slice 1 — one canonical visual system; remove stacked design skins.
replace(
    "apps/web/src/main.tsx",
    "import './styles/index.css';\nimport './styles/workbench.css';\nimport './styles/graph-workspace.css';\nimport './styles/anthropic-theme.css';",
    "import './styles/index.css';\nimport './styles/graph-workspace.css';",
)

index = Path("apps/web/src/styles/index.css")
css = index.read_text()
start = css.index("@theme {")
end = css.index("*,\n*::before,", start)
canonical = """@theme {
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
  --shadow-node: none;
  --shadow-overlay: 0 14px 36px rgb(0 0 0 / 28%);
  --shadow-selected: 0 0 0 1px var(--color-cs-focus);
  --radius-workspace: 0;
  --radius-panel: 4px;
  --radius-node: 4px;
  --radius-control: 5px;
  --radius-overlay: 6px;
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

"""
css = css[:start] + canonical + css[end:]
css = css.replace(
    ".workspace-shell {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  width: 100%;\n  height: 100dvh;\n  min-height: 0;\n  padding: 10px;\n  overflow: auto;\n  background: var(--color-cs-bg);\n  color: var(--color-cs-text);\n}",
    ".workspace-shell {\n  display: flex;\n  flex-direction: column;\n  gap: 0;\n  width: 100%;\n  height: 100dvh;\n  min-height: 0;\n  padding: 0;\n  overflow: auto;\n  background: var(--color-cs-bg);\n  color: var(--color-cs-text);\n}",
)
css = css.replace(
    ".workspace-header,\n.workspace-context-bar,\n.repository-input,\n.workspace-grid {\n  width: min(100%, 1680px);\n  margin-inline: auto;\n}",
    ".workspace-header {\n  width: 100%;\n}",
)
css = css.replace(
    ".workspace-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  min-height: 30px;\n  padding: 0 2px;\n}",
    ".workspace-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  min-height: 40px;\n  padding: 0 10px;\n  background: var(--color-cs-panel);\n  border-bottom: 1px solid var(--color-cs-border);\n}",
)
css = css.replace(
    ".workspace-brand h1 {\n  margin-bottom: 0;\n  font-size: 15px;\n  font-weight: 650;\n  letter-spacing: -0.02em;\n}",
    ".workspace-brand h1 {\n  margin-bottom: 0;\n  font-size: 13px;\n  font-weight: 650;\n  letter-spacing: -0.02em;\n}",
)
css = css.replace(
    ".panel-kicker {\n  margin: 0 0 3px;\n  color: var(--color-cs-muted);\n  font-size: 11px;\n  font-weight: 600;\n  letter-spacing: 0.1em;\n  text-transform: uppercase;\n}",
    ".panel-kicker {\n  margin: 0 0 3px;\n  color: var(--color-cs-muted);\n  font-size: 10px;\n  font-weight: 600;\n  letter-spacing: 0;\n  text-transform: none;\n}",
)
index.write_text(css)

primitives = Path("apps/web/src/components/ui/primitives.tsx")
text = primitives.read_text()
text = text.replace("rounded-[8px]", "rounded-[5px]")
text = text.replace("rounded-[10px]", "rounded-[6px]")
text = text.replace("rounded-[7px]", "rounded-[4px]")
text = text.replace(
    "rounded-[5px] border border-cs-border bg-cs-control",
    "rounded-[3px] border border-cs-border bg-cs-control",
)
primitives.write_text(text)

# Slice 2/3/4 — state clarity, progressive hierarchy, restrained motion.
app = Path("apps/web/src/App.tsx")
text = app.read_text()
text = text.replace(
    "          <div className=\"workspace-brand\">\n            <h1>CodeFlow</h1>\n            <span>\n              See where code starts, where it goes, and what it depends on.\n            </span>\n          </div>",
    "          <div className=\"workspace-brand\">\n            <h1>CodeFlow</h1>\n            {flow === null && !analyzing ? (\n              <span>Trace code relationships from source-backed evidence.</span>\n            ) : null}\n          </div>",
)
text = text.replace(
    "      <div className=\"graph-acquisition-intro\">\n        <span className=\"panel-kicker\">Code graph</span>\n        <h2 id=\"graph-acquisition-title\">Visualize how a codebase connects</h2>\n        <p>\n          Open a repository, start from an entry point or symbol, then follow\n          calls, references, dependencies, and type relationships through one\n          semantic graph.\n        </p>\n      </div>",
    "      <div className=\"graph-acquisition-intro\">\n        <h2 id=\"graph-acquisition-title\">Open a codebase</h2>\n        <p>Trace calls, references, dependencies, and types from a repository or pull request.</p>\n      </div>",
)
text = text.replace("initial={{ opacity: 0, y: 6 }}", "initial={{ opacity: 0, y: 2 }}")
text = text.replace("exit={{ opacity: 0, y: -4 }}", "exit={{ opacity: 0, y: -2 }}")
app.write_text(text)

picker = Path("apps/web/src/features/acquisition/GitHubRepositoryPicker.tsx")
text = picker.read_text()
old = """      <div>
        <p className="panel-kicker">Repository</p>
        <h2 id="github-acquisition-title">Open a public GitHub repository</h2>
        <p>
          CodeFlow finds entry points and builds a bounded semantic graph of
          source-backed code relationships.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-repository-url">
          Public GitHub repository URL
        </label>
"""
new = """      <div>
        <h2 id="github-acquisition-title">GitHub repository</h2>
      </div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="github-repository-url">Repository URL</label>
"""
if old not in text:
    raise SystemExit("GitHub picker heading block changed unexpectedly")
text = text.replace(old, new)
text = re.sub(r'\n        <p className="github-note">.*?</p>', "", text, flags=re.S)
picker.write_text(text)

graph = Path("apps/web/src/features/workspace/GraphWorkspace.tsx")
text = graph.read_text()
text = text.replace(
    "              <strong>{focusNode?.label ?? 'Semantic graph'}</strong>\n              <span>\n                {levelLabel(level)} · {lensLabel(lens)} · {visibleNodes.length}/\n                {levelNodes.length} visible · static projection\n              </span>",
    "              <strong>Focus · {focusNode?.label ?? 'Semantic graph'}</strong>\n              <span>{levelLabel(level)} · {lensLabel(lens)}</span>",
)
text = text.replace(
    "              initial={{ opacity: 0, y: -4, scale: 0.99 }}\n              animate={{ opacity: 1, y: 0, scale: 1 }}\n              exit={{ opacity: 0, y: -4, scale: 0.99 }}",
    "              initial={{ opacity: 0, y: -2 }}\n              animate={{ opacity: 1, y: 0 }}\n              exit={{ opacity: 0, y: -2 }}",
)
text = text.replace("              <small>{count}</small>\n", "")
text = text.replace(
    "                      {node.entryPoint ? <span>ENTRY</span> : null}\n                      {node.changeKind !== undefined ? (",
    "                      {node.entryPoint ? (\n                        <span className=\"semantic-graph-node-state semantic-graph-node-state--entry\">ENTRY</span>\n                      ) : null}\n                      {focusId === node.id ? (\n                        <span className=\"semantic-graph-node-state semantic-graph-node-state--focus\">FOCUS</span>\n                      ) : null}\n                      {node.changeKind !== undefined ? (",
)
text = text.replace("<motion.aside", "<aside")
text = text.replace("</motion.aside>", "</aside>")
text = re.sub(
    r"\n        initial=\{\{ opacity: 0(?:, x: 5)? \}\}\n        animate=\{\{ opacity: 1(?:, x: 0)? \}\}\n        transition=\{\{ duration: 0\.1[02] \}\}",
    "",
    text,
)
text = re.sub(
    r"\n      initial=\{\{ opacity: 0, x: 5 \}\}\n      animate=\{\{ opacity: 1, x: 0 \}\}\n      transition=\{\{ duration: 0\.12 \}\}",
    "",
    text,
)
text = text.replace(
    '<span className="panel-kicker">Relationship</span>',
    '<span className="panel-kicker">Selected relationship</span>',
)
text = text.replace(
    '<span className="panel-kicker">{node.kind}</span>',
    '<span className="panel-kicker">Selected · {node.kind}</span>',
)
text = text.replace(
    "        <span>\n          <strong>{relatedEdges.length}</strong> total\n        </span>\n",
    "",
)
old_actions = """        <div className="graph-node-primary-actions">
          <Button
            aria-pressed={expandedOutgoing.has(node.id)}
            onClick={() => onExpandOutgoing(node.id)}
          >
            Expand outgoing
          </Button>
          <Button
            aria-pressed={expandedIncoming.has(node.id)}
            onClick={() => onExpandIncoming(node.id)}
          >
            Expand incoming
          </Button>
        </div>
        <div className="graph-node-secondary-actions">
          <Button variant="ghost" onClick={() => onShowBoth(node.id)}>
            Show both
          </Button>
          <Button
            variant="ghost"
            aria-pressed={focusId === node.id}
            onClick={() => onFocus(node)}
          >
            {focusId === node.id ? 'Focused' : 'Focus here'}
          </Button>
          <Button variant="ghost" onClick={() => onCollapse(node.id)}>
            Collapse branch
          </Button>
          {node.kind !== 'Repository' && node.kind !== 'Workspace' ? (
            <Button
              variant="ghost"
              disabled={impactLoading}
              onClick={() => void onShowDependents(node)}
            >
              {impactLoading ? 'Tracing…' : 'Show dependents'}
            </Button>
          ) : null}
          {node.kind === 'Function' && !projectedFunction ? (
            <Button onClick={() => onTraceFunction(node)}>
              Trace calls from here
            </Button>
          ) : null}
        </div>
"""
new_actions = """        <div className="graph-node-primary-actions">
          {!expandedOutgoing.has(node.id) && outgoing.length > 0 ? (
            <Button onClick={() => onExpandOutgoing(node.id)}>
              Expand outgoing
            </Button>
          ) : null}
          {!expandedIncoming.has(node.id) && incoming.length > 0 ? (
            <Button onClick={() => onExpandIncoming(node.id)}>
              Expand incoming
            </Button>
          ) : null}
          {expandedOutgoing.has(node.id) && expandedIncoming.has(node.id) ? (
            <Button onClick={() => onCollapse(node.id)}>Collapse branch</Button>
          ) : null}
        </div>
        <div className="graph-node-secondary-actions">
          {!expandedOutgoing.has(node.id) &&
          !expandedIncoming.has(node.id) &&
          outgoing.length > 0 &&
          incoming.length > 0 ? (
            <Button variant="ghost" onClick={() => onShowBoth(node.id)}>
              Expand both
            </Button>
          ) : null}
          {focusId !== node.id ? (
            <Button variant="ghost" onClick={() => onFocus(node)}>
              Focus here
            </Button>
          ) : null}
          {(expandedOutgoing.has(node.id) || expandedIncoming.has(node.id)) &&
          !(expandedOutgoing.has(node.id) && expandedIncoming.has(node.id)) ? (
            <Button variant="ghost" onClick={() => onCollapse(node.id)}>
              Collapse branch
            </Button>
          ) : null}
          {node.kind !== 'Repository' && node.kind !== 'Workspace' ? (
            <Button
              variant="ghost"
              disabled={impactLoading}
              onClick={() => void onShowDependents(node)}
            >
              {impactLoading ? 'Tracing…' : 'Show dependents'}
            </Button>
          ) : null}
          {node.kind === 'Function' && !projectedFunction ? (
            <Button onClick={() => onTraceFunction(node)}>
              Trace calls from here
            </Button>
          ) : null}
        </div>
"""
if old_actions not in text:
    raise SystemExit("inspector action block changed unexpectedly")
text = text.replace(old_actions, new_actions)
graph.write_text(text)

graph_css = Path("apps/web/src/styles/graph-workspace.css")
text = graph_css.read_text()
text = text.replace(
    "border-radius: 4px;\n  box-shadow: none;",
    "border-radius: var(--radius-node);\n  box-shadow: none;",
)
text = text.replace(
    ".semantic-graph-node--selected,\n.semantic-graph-node--focus {\n  border-color: var(--color-cs-focus);\n}\n\n.semantic-graph-node--focus {\n  box-shadow: inset 2px 0 0 var(--color-cs-focus);\n}",
    ".semantic-graph-node--selected {\n  border-color: var(--color-cs-focus);\n  box-shadow: var(--shadow-selected);\n}\n\n.semantic-graph-node--focus {\n  border-color: var(--color-cs-border);\n  background: color-mix(in srgb, var(--color-cs-panel) 86%, var(--color-cs-focus));\n  box-shadow: inset 3px 0 0 var(--color-cs-focus);\n}\n\n.semantic-graph-node--focus.semantic-graph-node--selected {\n  border-color: var(--color-cs-focus);\n  box-shadow:\n    inset 3px 0 0 var(--color-cs-focus),\n    var(--shadow-selected);\n}",
)
marker_css = """
.semantic-graph-node-state {
  font-size: 9px;
  font-weight: 650;
  letter-spacing: 0.04em;
}

.semantic-graph-node-state--entry {
  color: var(--color-cs-subtle);
}

.semantic-graph-node-state--focus {
  color: var(--color-cs-focus);
}
"""
anchor = ".semantic-graph-node strong {"
if marker_css.strip() not in text:
    text = text.replace(anchor, marker_css + "\n" + anchor)
graph_css.write_text(text)

# Durable product/design authority.
design = Path(".agents/DESIGN.md")
text = design.read_text()
text = text.replace(
    "- restrained selected/focus treatment using the steel-blue accent;",
    "- one restrained semantic accent reserved for focus, selection, and actionable attention;",
)
text = text.replace(
    "Focus and selection may use a steel-blue border/inset rule. Impact may use a quiet active neutral surface. Avoid double borders, glow, and saturated category colors.",
    "Entry, focus, and selection are different states and must not share the same visual treatment. Entry is an origin marker, focus is the graph's spatial anchor using an inset rule/label, and selection is an inspection outline. Impact may use a quiet active neutral surface. Avoid glow and saturated category colors.",
)
text = text.replace(
    "A selected node supports graph-native actions where applicable:\n\n```text\nExpand outgoing\nExpand incoming\nShow both\nCollapse branch\nFocus here\nTrace calls from here\nShow dependents\n```\n\n`Expand outgoing` and `Expand incoming` are primary trace actions. `Show both`, `Collapse branch`, focus, impact, and re-tracing are quieter contextual operations.",
    "A selected node exposes only graph-native actions that can change the current state. `Expand outgoing` and `Expand incoming` are primary when those directions are not already expanded. `Expand both`, `Collapse branch`, `Focus here`, impact, and re-tracing appear contextually instead of forming a permanent action buffet.",
)
text = text.replace(
    "- visible/available node count;\n",
    "- optional projection counts only when they materially aid orientation;\n",
)
text = text.replace(
    "incoming/outgoing counts\nprimary trace actions\nsecondary focus/impact operations",
    "incoming/outgoing counts\nnext applicable trace action\ncontextual focus/impact operations",
)
design.write_text(text)

test = Path("apps/web/src/App.test.tsx")
text = test.read_text()
text = text.replace("name: 'Visualize how a codebase connects'", "name: 'Open a codebase'")
test.write_text(text)

current = Path(".agents/CURRENT_ITERATION.md")
current.write_text("""# Current Iteration

Status: READY_FOR_MILESTONE

Last Completed Milestone: M15 - Product-Native UX Cleanup

## Product Outcome Delivered

CodeFlow now presents one coherent code-navigation instrument instead of layered aesthetic skins. Entry, graph focus, and inspector selection are visually distinct; acquisition is a compact launcher; inspector actions are progressive and contextual; and motion is reserved for state/spatial continuity rather than repeated selection polish.

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

- S1 removed stacked `workbench.css` and Anthropic skin ownership from runtime, consolidated canonical neutral/terracotta tokens in `index.css`, and tightened shared control/node geometry.
- S2 made Entry, Focus, and Selected explicit independent states: Entry remains the origin marker, Focus is the spatial anchor, and Selected is inspector context.
- S3 reduced acquisition copy, removed redundant projection/relationship metrics, and changed the inspector from a permanent action buffet to contextual progressive actions.
- S4 removed high-frequency inspector slide motion and search scaling while preserving restrained cross-state and graph-node spatial transitions; legacy skin files were removed.

## Boundaries Preserved

- No analysis, API, persistence, graph truth, or repository-selection contract changed.
- No graph database, physics layout, AI feature, or new product capability was added.
- Layout remains deterministic and graph expansion remains bounded and user-directed.
- Selection and relationship meaning remain legible without relying on color alone.
- The visual system is CodeFlow-native: compact, code-oriented, direct, spatially stable, evidence-first, quiet, and precise.

## Verification

Implementation must pass formatting, lint, production build, and web behavior tests before integration. Production Compose validation is not required for this frontend-only milestone.
""")

Path("apps/web/src/styles/workbench.css").unlink()
Path("apps/web/src/styles/anthropic-theme.css").unlink()
