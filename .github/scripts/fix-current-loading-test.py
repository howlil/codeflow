from pathlib import Path

path = Path('apps/web/src/App.test.tsx')
text = path.read_text()
text = text.replace(
    "it('shows an honest animated activity state while analysis is pending', () => {",
    "it('shows an honest animated activity state while analysis is pending', async () => {",
)
text = text.replace(
    "    expect(screen.getByRole('status')).toBeInTheDocument();",
    "    expect(await screen.findByRole('status')).toBeInTheDocument();",
)
path.write_text(text)
