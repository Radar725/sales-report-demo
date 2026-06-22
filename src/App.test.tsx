import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import App from './App';
import { getDefaultComparisonDateRange } from './domain/comparison';

async function selectOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  const formItem = screen.getByText(label).closest('.ant-form-item')!;
  fireEvent.mouseDown(formItem.querySelector('.ant-select-selector')!);
  await waitFor(() => {
    expect(document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')).toBeTruthy();
  });
  const visibleDropdown = document.querySelector('.ant-select-dropdown:not(.ant-select-dropdown-hidden)') as HTMLElement;
  const dropdownOption = within(visibleDropdown).getByText(option);
  await user.click(dropdownOption);
}

async function applyFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(document.querySelector('.filter-bar')!).getByRole('button', { name: '查 询' }));
}

async function selectPrimaryDimension(user: ReturnType<typeof userEvent.setup>, option: string) {
  await user.click(screen.getByRole('combobox', { name: '主维度' }));
  await user.click(await screen.findByRole('option', { name: option }));
}

async function openFunnelReport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '转化漏斗报表' }));
}

async function setDateRange(user: ReturnType<typeof userEvent.setup>) {
  const statsTime = screen.getAllByText('统计时间')[0].closest('.ant-form-item')!;
  const inputs = statsTime.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
  await user.clear(inputs[0]);
  await user.type(inputs[0], '2026-06-01');
  await user.clear(inputs[1]);
  await user.type(inputs[1], '2026-06-30');
}

function getComparisonFormItem() {
  return screen.getByText('对比时间').closest('.ant-form-item')!;
}

function getComparisonInputs() {
  return getComparisonFormItem().querySelectorAll<HTMLInputElement>('.ant-picker-input input');
}

describe('App', () => {
  it('defaults to performance report and exposes both report tabs', () => {
    render(<App />);
    expect(screen.getByRole('tab', { name: '业绩报表' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '转化漏斗报表' })).toBeInTheDocument();
  });

  it('defaults customer scope to new customers', () => {
    render(<App />);
    expect(screen.getByText('客户统计范围').closest('.ant-form-item')).toHaveTextContent('新客');
  });

  it('always shows the seven new-customer metric columns by default', () => {
    render(<App />);

    for (const column of [
      '新客上报业绩', '新客成交单量', '新客成交客户数', '新客客单价',
      '新客业绩占比', '新客成交单量占比', '新客成交客户占比',
    ]) {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
    expect(screen.queryByRole('columnheader', { name: '新客数' })).not.toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: '新客成交率' })).not.toBeInTheDocument();
  });

  it('uses combined prefixes in the main table and shows 100 percent for all scope', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '新客');
    await selectOption(user, '成交类型', '新诊');
    await applyFilters(user);
    expect(screen.getByRole('columnheader', { name: '新客新诊成交客户占比' })).toBeInTheDocument();

    await selectOption(user, '客户统计范围', '全部');
    await selectOption(user, '成交类型', '全部');
    await applyFilters(user);
    expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(screen.getAllByText('100.0%').length).toBeGreaterThanOrEqual(3);
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

    await setDateRange(user);
    await applyFilters(user);
    await selectPrimaryDimension(user, '部门');
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });

  it('does not allow consultant to break down by department', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    expect(within(screen.getByRole('dialog', { name: /业绩拆解/ })).queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('allows project category to break down by project but not the reverse', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await applyFilters(user);
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
    const detailButtons = await screen.findAllByRole('button', { name: '业绩明细' });
    await user.click(detailButtons[0]);

    const drawer = await screen.findByRole('dialog');
    expect(drawer).toHaveTextContent('业绩明细');
    for (const column of [
      '成交金额', '合作比例', '合作业绩', '成交渠道', '合作人名称', '确认金额', '确认日期',
      '客户ID', '电话', '成交项目', '业绩确认状态', '成交机构', '成交日期', '上报时间',
    ]) {
      expect(within(drawer).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
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

  it('uses the same dynamic metric names in the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '老客');
    await selectOption(user, '成交类型', '复购');
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    for (const column of [
      '老客复购上报业绩', '老客复购成交单量', '老客复购成交客户数',
      '老客复购客单价', '老客复购业绩占比',
      '老客复购成交单量占比', '老客复购成交客户占比',
    ]) {
      expect(within(drawer).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }
  });

  it('uses recorded-at time and omits customer scope in the funnel filters', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openFunnelReport(user);
    expect(screen.getByText('录单时间')).toBeInTheDocument();
    expect(screen.queryByText('客户统计范围')).not.toBeInTheDocument();
    expect(screen.queryByText('客户类型')).not.toBeInTheDocument();
  });

  it('shows fixed status cohort columns in the funnel table', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openFunnelReport(user);
    for (const name of ['录单客户数', '有效客户数', '已加微客户数', '已复购客户数', '有效客户率', '复购率']) {
      expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
    }
  });

  it('shows funnel tab with default controls after switching tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openFunnelReport(user);

    expect(screen.getByRole('combobox', { name: '漏斗主维度' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '录单客户数' })).toBeInTheDocument();
  });

  it('keeps performance filter state isolated from funnel changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openFunnelReport(user);
    await user.click(screen.getByRole('tab', { name: '业绩报表' }));

    const perfScopeItems = screen.getAllByText('客户统计范围');
    expect(perfScopeItems[0].closest('.ant-form-item')).toHaveTextContent('新客');
  });

  it('shows the default comparison date range on load', () => {
    render(<App />);
    const [start, end] = getDefaultComparisonDateRange(dayjs());
    const inputs = getComparisonInputs();
    expect(inputs[0].value).toBe(start);
    expect(inputs[1].value).toBe(end);
  });

  it('keeps a cleared comparison range after the statistic range changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    const comparison = getComparisonFormItem();
    fireEvent.mouseEnter(comparison);
    fireEvent.mouseDown(comparison.querySelector('.ant-picker-clear')!);
    fireEvent.click(comparison.querySelector('.ant-picker-clear')!);
    await setDateRange(user);
    expect(getComparisonInputs()[0].value).toBe('');
  });

  it('restores the default comparison range after reset', async () => {
    const user = userEvent.setup();
    render(<App />);
    const comparison = getComparisonFormItem();
    fireEvent.mouseEnter(comparison);
    fireEvent.mouseDown(comparison.querySelector('.ant-picker-clear')!);
    fireEvent.click(comparison.querySelector('.ant-picker-clear')!);
    await user.click(within(document.querySelector('.filter-bar')!).getByRole('button', { name: '重 置' }));
    const [start, end] = getDefaultComparisonDateRange(dayjs());
    const inputs = getComparisonInputs();
    expect(inputs[0].value).toBe(start);
    expect(inputs[1].value).toBe(end);
  });

  it('shows comparison change indicators in the performance summary after query', async () => {
    const user = userEvent.setup();
    render(<App />);
    await setDateRange(user);
    await applyFilters(user);
    expect(document.querySelector('.report-table .metric-change')).toBeTruthy();
    const changeText = document.querySelector('.report-table')!.textContent ?? '';
    expect(changeText).toMatch(/↑|↓|—/);
  });

  it('shows comparison change indicators in the performance breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await setDateRange(user);
    await applyFilters(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    const breakdownDrawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(breakdownDrawer.querySelector('.metric-change')).toBeTruthy();
  });

  it('does not show comparison change indicators in the performance detail drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await setDateRange(user);
    await applyFilters(user);
    const detailButtons = await screen.findAllByRole('button', { name: '业绩明细' });
    await user.click(detailButtons[0]);
    const detailDrawer = await screen.findByRole('dialog');
    expect(detailDrawer.querySelector('.metric-change')).toBeNull();
  });

  it('shows comparison change indicators in the funnel summary and breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: '转化漏斗报表' }));
    const queryBtns = screen.getAllByRole('button', { name: '查 询' });
    await user.click(queryBtns[queryBtns.length - 1]);
    expect(document.querySelector('.report-table .metric-change')).toBeTruthy();

    await user.click(screen.getAllByRole('button', { name: '维度拆解' })[0]);
    const funnelDrawer = screen.getByRole('dialog', { name: /转化漏斗拆解/ });
    expect(funnelDrawer.querySelector('.metric-change')).toBeTruthy();
  });

  it('shows repurchase total contribution columns and omits comparison deltas for them', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '新客');
    await selectOption(user, '成交类型', '复购');
    await applyFilters(user);

    for (const column of [
      '新客复购客户占总复购比',
      '新客复购单量占总复购比',
      '新客复购业绩占总复购比',
    ]) {
      expect(screen.getByRole('columnheader', { name: column })).toBeInTheDocument();
    }

    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);
    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    for (const column of [
      '新客复购客户占总复购比',
      '新客复购单量占总复购比',
      '新客复购业绩占总复购比',
    ]) {
      expect(within(drawer).getByRole('columnheader', { name: column })).toBeInTheDocument();
    }

    const reportTable = document.querySelector('.report-table')!;
    const totalRateHeader = within(reportTable as HTMLElement).getByRole('columnheader', {
      name: '新客复购客户占总复购比',
    });
    const totalRateCell = totalRateHeader.closest('table')!.querySelector(
      'tbody tr td:nth-child(' +
        (Array.from(totalRateHeader.closest('table')!.querySelectorAll('th') as NodeListOf<HTMLElement>).indexOf(
          totalRateHeader,
        ) +
          1) +
        ')',
    );
    expect(totalRateCell?.querySelector('.metric-change')).toBeNull();

    const reportedAmountHeader = within(reportTable as HTMLElement).getByRole('columnheader', {
      name: '新客复购上报业绩',
    });
    const reportedAmountCell = reportedAmountHeader.closest('table')!.querySelector(
      'tbody tr td:nth-child(' +
        (Array.from(reportedAmountHeader.closest('table')!.querySelectorAll('th') as NodeListOf<HTMLElement>).indexOf(
          reportedAmountHeader,
        ) +
          1) +
        ')',
    );
    expect(reportedAmountCell?.querySelector('.metric-change')).toBeTruthy();
  });

  it('hides repurchase total contribution columns for non-repurchase deal types', async () => {
    const user = userEvent.setup();
    render(<App />);

    await setDateRange(user);
    await selectOption(user, '客户统计范围', '新客');
    await selectOption(user, '成交类型', '新诊');
    await applyFilters(user);

    expect(screen.queryByRole('columnheader', { name: '新客复购客户占总复购比' })).toBeNull();
  });

});

