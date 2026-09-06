import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App acquisition experience', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('starts from an interactive public-repository landing', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Follow the code, not the file tree.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Public GitHub repository URL'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Analyze a local repository'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Visualize pull request changes on the graph'),
    ).not.toBeInTheDocument();

    const entryNode = screen.getByRole('button', { name: /createOrder/ });
    fireEvent.click(entryNode);
    expect(entryNode).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Selected relationship')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an honest animated activity state while analysis is pending', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://github.com/owner/demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open code graph' }));

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Mapping the codebase into something you can follow.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('https://github.com/owner/demo'),
    ).toBeInTheDocument();
    expect(screen.getByText('Scanning source structure')).toBeInTheDocument();
    expect(
      screen.getByText(
        /activity indicator rather than a fake completion estimate/i,
      ),
    ).toBeInTheDocument();
  });

  it('persists explicit theme selection', () => {
    render(<App />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to light theme' }),
    );
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('codeflow-theme')).toBe('light');
  });
});
