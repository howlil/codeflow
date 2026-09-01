import type { FlowProjection } from './model.js';
import { analyzeTypeScriptFlow } from './typescript-flow.js';

const sampleRequestFlowSource = `function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function formatGreeting(name: string): string {
  return \`Hello, \${name}!\`;
}

export function handleGreeting(name: string): string {
  const formatter = formatGreeting;
  return formatter(normalizeName(name));
}
`;

export function buildSampleRequestFlow(): FlowProjection {
  return analyzeTypeScriptFlow({
    filePath: 'fixtures/request-flow/greeting.ts',
    sourceText: sampleRequestFlowSource,
    entryPointName: 'handleGreeting',
  });
}
