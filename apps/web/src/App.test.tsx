import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from './App';

describe('App', () => {
  it('shows the M0 foundation readiness state', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'CodeFlow' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Foundation workspace ready',
    );
  });
});
