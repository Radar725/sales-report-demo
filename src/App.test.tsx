import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders expanded grouped metrics in the summary table', () => {
    render(<App />);

    expect(screen.getByRole('columnheader', { name: '业绩总览' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '新诊业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '历史复购业绩当期贡献率' })).toBeInTheDocument();
  });

  it('renders the same expanded metrics inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('columnheader', { name: '业绩总览' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '复购业绩' })).toBeInTheDocument();
    expect(
      within(drawer).getByRole('columnheader', { name: '历史复购客户当期贡献率' }),
    ).toBeInTheDocument();
  });

  it('shows date and project dimensions in the primary dimension selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));

    expect(await screen.findByRole('option', { name: '日期' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目分类' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目' })).toBeInTheDocument();
  });

  it('allows department to break down by consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '部门' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });

  it('does not allow consultant to break down by department', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('allows project category to break down by project', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '项目分类' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '项目' })).toBeInTheDocument();
  });

  it('does not allow project to break down by project category', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '项目' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '项目分类' })).not.toBeInTheDocument();
  });
});
