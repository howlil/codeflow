import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

describe('GitHubRepositoryPicker', () => {
  afterEach(cleanup);

  it('presents GitHub acquisition as the primary code-graph journey', () => {
    render(
      <GitHubRepositoryPicker busy={false} error={null} onAnalyze={vi.fn()} />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'GitHub repository',
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Repository URL')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open code graph' }),
    ).toBeInTheDocument();
  });

  it('validates the repository shape before requesting analysis', () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(
      <GitHubRepositoryPicker
        busy={false}
        error={null}
        onAnalyze={onAnalyze}
      />,
    );

    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/howlil/codeflow/src/index.ts' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Open code graph' }));

    expect(onAnalyze).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a public GitHub repository URL',
    );
  });

  it('submits a valid public repository URL', () => {
    const onAnalyze = vi.fn().mockResolvedValue(undefined);
    render(
      <GitHubRepositoryPicker
        busy={false}
        error={null}
        onAnalyze={onAnalyze}
      />,
    );

    fireEvent.change(screen.getByLabelText('Repository URL'), {
      target: { value: 'https://github.com/howlil/codeflow' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Open code graph' }));

    expect(onAnalyze).toHaveBeenCalledWith(
      'https://github.com/howlil/codeflow',
    );
  });
});
