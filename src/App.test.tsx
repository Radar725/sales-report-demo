import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  const formItem = screen.getByText(label).closest('.ant-form-item')!;
  fireEvent.mouseDown(formItem.querySelector('.ant-select-selector')!);
  await user.click(await screen.findByText(option));
}

async function applyFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(document.querySelector('.filter-bar')!).getByRole('button', { name: '查 询' }));
}

describe('App', () => {
  it('shows the primary dimension selector directly without any tabs', () => {
    render(<App />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '主维度' })).toBeInTheDocument();
  });

  it('shows new customer columns only when customer scope is new customers', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('columnheader', { name: '新客数' })).not.toBeInTheDocument();
    await selectOption(user, '客户统计范围', '新客');
    await applyFilters(user);

    expect(screen.getByRole('columnheader', { name: '新客数' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '新客成交率' })).toBeInTheDocument();
  });

  it('keeps new customer metrics independent from the deal type filter', async () => {
    const user = userEvent.setup();
    render(<App />);

    const inputs = document.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '2026-06-01');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '2026-06-30');
    await selectOption(user, '客户统计范围', '新客');
    await selectOption(user, '成交类型', '新诊');
    await applyFilters(user);

    const zhangMinRow = screen.getByRole('cell', { name: '张敏' }).closest('tr')!;
    expect(within(zhangMinRow).getByText('4')).toBeInTheDocument();
  });

  it('shows a single total row, disables breakdown, and opens total details', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '汇总' }));

    expect(screen.getByRole('cell', { name: '汇总' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '业绩拆解' })).toHaveLength(1);
    expect(screen.getByRole('button', { name: '业绩拆解' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '业绩明细' }));
    expect(screen.getByRole('dialog', { name: '汇总 · 业绩明细' })).toBeInTheDocument();
  });

  it('shows new customer columns in the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    const inputs = document.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '2026-06-01');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '2026-06-30');
    await selectOption(user, '客户统计范围', '新客');
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('columnheader', { name: '新客数' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '新客成交率' })).toBeInTheDocument();
  });
});
