from pathlib import Path
import textwrap

workflow = Path('.github/workflows/m14-apply-v2.yml').read_text()
marker = "python - <<'PY'\n"
start = workflow.index(marker) + len(marker)
end = workflow.index('\n          PY\n', start)
script = textwrap.dedent(workflow[start:end])

source_start = script.index(
    'text = replace_once(\n    text,\n    """          <pre className="graph-source-snippet">'
)
source_end_marker = "    'source peek render',\n)"
source_end = script.index(source_end_marker, source_start) + len(source_end_marker)
source_patch = r'''text = replace_once(
    text,
    '<code>{snippet}</code>',
    """<code>
              {snippet.map((line) => (
                <span
                  key={line.lineNumber}
                  className={`graph-source-line${
                    line.active ? ' graph-source-line--active' : ''
                  }`}
                  aria-current={line.active ? 'location' : undefined}
                >
                  <span className="graph-source-line-number">
                    {line.lineNumber}
                  </span>
                  <span className="graph-source-line-code">
                    {line.text === '' ? ' ' : line.text}
                  </span>
                </span>
              ))}
            </code>""",
    'source peek render',
)'''
script = script[:source_start] + source_patch + script[source_end:]

test_start = script.index('anchor = """    expect(')
test_end_marker = "tests = replace_once(tests, anchor, insertion, 'viewport test')"
test_end = script.index(test_end_marker, test_start) + len(test_end_marker)
test_patch = r'''test_anchor = "screen.getByRole('button', { name: /Function createOrder/ })"
test_index = tests.find(test_anchor)
if test_index < 0:
    raise SystemExit('missing anchor: viewport test')
expect_start = tests.rfind('    expect(', 0, test_index)
expect_end = tests.find(').toBeInTheDocument();', test_index)
if expect_start < 0 or expect_end < 0:
    raise SystemExit('unable to bound viewport test anchor')
expect_end += len(').toBeInTheDocument();')
existing_expect = tests[expect_start:expect_end]
viewport_expectations = """    expect(
      screen.getByRole('button', { name: 'Zoom out' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Zoom in' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Fit graph' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Center focus' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByText('110%')).toBeInTheDocument();

"""
tests = tests[:expect_start] + viewport_expectations + existing_expect + tests[expect_end:]
test_path.write_text(tests)'''
script = script[:test_start] + test_patch + script[test_end:]

exec(compile(script, 'm14_patch_inner.py', 'exec'))
