import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MetricColumnTitle } from './MetricColumnTitle';

describe('MetricColumnTitle', () => {
  it('shows the approved explanation when its label is hovered', async () => {
    const user = userEvent.setup();
    render(<MetricColumnTitle label="上报业绩" description="当前维度下上报的成交金额，不含定金。" />);

    await user.hover(screen.getByText('上报业绩'));

    expect(await screen.findByText('当前维度下上报的成交金额，不含定金。')).toBeInTheDocument();
  });
});
