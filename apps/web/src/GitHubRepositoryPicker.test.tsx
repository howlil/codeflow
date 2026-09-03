import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GitHubRepositoryPicker } from './GitHubRepositoryPicker';

describe('GitHubRepositoryPicker', () => {
  afterEach(cleanup);

  it('presents GitHub acquisition as the primary repository journey', () => {
    render(
      <GitHubRepositoryPicker busy={false} error={null} onAnalyze={vi.fn()} />,
    );

    expect(
      screen.getByRole('heading', {
        name: 'Understand an unfamiliar codebase',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Public GitHub repository URL'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Analyze GitHub repository' }),
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

    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://github.com/howlil/codeflow/src/index.ts' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Analyze GitHub repository' }),
    );

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

    fireEvent.change(screen.getByLabelText('Public GitHub repository URL'), {
      target: { value: 'https://github.com/howlil/codeflow' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Analyze GitHub repository' }),
    );

    expect(onAnalyze).toHaveBeenCalledWith(
      'https://github.com/howlil/codeflow',
    );
  });
});
