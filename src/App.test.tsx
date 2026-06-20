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

async function selectPrimaryDimension(user: ReturnType<typeof userEvent.setup>, option: string) {
  await user.click(screen.getByRole('combobox', { name: '主维度' }));
  await user.click(await screen.findByRole('option', { name: option }));
}

async function setDateRange(user: ReturnType<typeof userEvent.setup>) {
  const inputs = document.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
  await user.clear(inputs[0]);
  await user.type(inputs[0], '2026-06-01');
  await user.clear(inputs[1]);
  await user.type(inputs[1], '2026-06-30');
}

describe('App', () => {
  it('shows the primary dimension selector directly without any tabs', () => {
    render(<App />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '主维度' })).toBeInTheDocument();
  });

  it('shows only the four base columns by default', () => {
    render(<App />);

    expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '成交单量' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '成交客户数' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '客单价' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '新客数' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '业绩占比' })).not.toBeInTheDocument();
  });

  it('shows only the four base columns in the breakdown drawer by default', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });

    expect(within(drawer).getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交单量' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交客户数' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '客单价' })).toBeInTheDocument();
    expect(within(drawer).queryByRole('columnheader', { name: '新客数' })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('columnheader', { name: '业绩占比' })).not.toBeInTheDocument();
  });

  it('shows only old customer records when old customers are selected', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '老客');
    await applyFilters(user);

    expect(screen.getByRole('cell', { name: '张敏' })).toBeInTheDocument();
  });

  it('includes date and project dimensions in the primary dimension selector', async () => {
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

    await selectPrimaryDimension(user, '部门');
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });

  it('does not allow consultant to break down by department', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('allows project category to break down by project but not the reverse', async () => {
    const user = userEvent.setup();
    render(<App />);

    await selectPrimaryDimension(user, '项目分类');
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).getByRole('tab', { name: '项目' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await selectPrimaryDimension(user, '项目');
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).queryByRole('tab', { name: '项目分类' })).not.toBeInTheDocument();
  });

  it('shows secondary inline filters after expanding', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '展开 ▼' }));

    expect(screen.getByText('城市&机构')).toBeInTheDocument();
    expect(screen.getByText('客户池')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起 ▲' })).toBeInTheDocument();
  });

  it('uses filtered records in the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '新客');
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    await user.click(within(drawer).getByRole('tab', { name: '渠道' }));
    expect(within(drawer).getByRole('cell', { name: '演示渠道 A' })).toBeInTheDocument();
    expect(within(drawer).queryByRole('cell', { name: '自然流量' })).not.toBeInTheDocument();
  });

  it('opens the performance detail drawer with the complete detail columns', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩明细' })[0]);

    const drawer = screen.getByRole('dialog', { name: '张敏 · 业绩明细' });
    for (const column of [
      '成交金额', '合作比例', '合作业绩', '成交渠道', '合作人名称', '确认金额', '确认日期',
      '客户ID', '电话', '成交项目', '业绩确认状态', '成交机构', '成交日期', '上报时间',
    ]) {
      expect(within(drawer).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
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

  it('shows contribution rate columns for restricted new customer and new diagnosis results', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '新客');
    await selectOption(user, '成交类型', '新诊');
    await applyFilters(user);

    for (const column of ['业绩占比', '单量占比', '客户占比']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument();
    }

    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    for (const column of ['业绩占比', '单量占比', '客户占比']) {
      expect(within(drawer).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
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
