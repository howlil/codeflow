import { readFileSync, writeFileSync } from 'node:fs';

const path = 'apps/web/src/ImpactPanel.tsx';
const text = readFileSync(path, 'utf8');
const before = `                  <span>\n                    Supported static analysis did not find a matching downstream\n                    relationship for this scope and filter.\n                  </span>\n`;
const after = `                  <span>\n                    Supported static analysis did not find a matching downstream\n                    relationship for this scope and filter.\n                  </span>\n                  {impact.status === 'partial' ? (\n                    <span>\n                      Impact coverage is partial; absence from the result set is\n                      not a safety guarantee.\n                    </span>\n                  ) : null}\n`;
if (!text.includes(before)) {
  throw new Error('M8 partial-impact empty-state target not found');
}
writeFileSync(path, text.replace(before, after));
