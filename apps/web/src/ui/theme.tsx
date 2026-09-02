import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { IconButton } from './primitives';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'codeflow-theme';

function initialTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
  const label = `Use ${nextTheme} theme`;

  return (
    <IconButton aria-label={label} title={label} onClick={() => setTheme(nextTheme)}>
      {theme === 'dark' ? (
        <Sun size={13} strokeWidth={1.7} aria-hidden="true" />
      ) : (
        <Moon size={13} strokeWidth={1.7} aria-hidden="true" />
      )}
    </IconButton>
  );
}
