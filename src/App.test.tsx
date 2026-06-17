import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders expanded grouped metrics in the summary table', () => {
    render(<App />);

    expect(screen.getByRole('columnheader', { name: '基础业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '新诊业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '历史复购业绩当期贡献率' })).toBeInTheDocument();
  });

  it('renders the same expanded metrics inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('columnheader', { name: '基础业绩' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '复购业绩' })).toBeInTheDocument();
    expect(
      within(drawer).getByRole('columnheader', { name: '历史复购客户当期贡献率' }),
    ).toBeInTheDocument();
  });
});
