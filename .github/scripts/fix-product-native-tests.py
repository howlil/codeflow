from pathlib import Path

for path in (
    Path('apps/web/src/App.test.tsx'),
    Path('apps/web/src/features/acquisition/GitHubRepositoryPicker.test.tsx'),
):
    text = path.read_text()
    text = text.replace('Public GitHub repository URL', 'Repository URL')
    text = text.replace('Open a public GitHub repository', 'GitHub repository')
    path.write_text(text)
