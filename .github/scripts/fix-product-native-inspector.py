from pathlib import Path

path = Path('apps/web/src/features/workspace/GraphWorkspace.tsx')
text = path.read_text()
text = text.replace(
    "\n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        transition={{ duration: 0.1 }}",
    "",
)
path.write_text(text)
