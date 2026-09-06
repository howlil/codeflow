import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/index.css';
import './styles/workbench.css';
import './styles/graph-workspace.css';
import './styles/anthropic-theme.css';
import './styles/landing.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
