import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';

describe('App acquisition experience', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('starts from a detailed interactive public-repository landing', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);

    expect(
      screen.getByRole('heading', {
        name: 'Understand how the code actually flows.',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
    expect(
      screen.queryByText('Analyze a local repository'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Visualize pull request changes on the graph'),
    ).not.toBeInTheDocument();

    const preview = screen.getByLabelText('Interactive CodeFlow preview');
    expect(within(preview).getByRole('button', { name: /Public repository/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Source discovery/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Entry points/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Symbol index/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Relationship map/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /^Calls/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Dependencies/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Types & references/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Semantic graph/ })).toBeInTheDocument();
    expect(within(preview).getByRole('button', { name: /Source & evidence/ })).toBeInTheDocument();

    const entryNode = within(preview).getByRole('button', { name: /Entry points/ });
    fireEvent.click(entryNode);
    expect(entryNode).toHaveAttribute('aria-pressed', 'true');
    expect(within(preview).getByText('Starting symbols')).toBeInTheDocument();
    expect(within(preview).getByText('Initial trace targets')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an honest animated activity state while analysis is pending', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    render(<App />);

    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/owner/demo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Open code graph' }));

    expect(await screen.findByRole('status')).toBeInTheDocument();
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
