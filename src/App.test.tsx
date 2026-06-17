import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

async function openReportTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '报表' }));
}

describe('App', () => {
  it('renders expanded grouped metrics in the summary table', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);

    expect(screen.getByRole('columnheader', { name: '业绩总览' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '上报业绩 ?' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '新诊业绩 ?' })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '历史复购业绩当期贡献率 ?' }),
    ).toBeInTheDocument();
  });

  it('renders the same expanded metrics inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('columnheader', { name: '业绩总览' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '复购业绩 ?' })).toBeInTheDocument();
    expect(
      within(drawer).getByRole('columnheader', { name: '历史复购客户当期贡献率 ?' }),
    ).toBeInTheDocument();
  });

  it('shows date and project dimensions in the primary dimension selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));

    expect(await screen.findByRole('option', { name: '日期' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目分类' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目' })).toBeInTheDocument();
  });

  it('allows department to break down by consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '部门' }));
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });

  it('does not allow consultant to break down by department', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('allows project category to break down by project', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '项目分类' }));
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '项目' })).toBeInTheDocument();
  });

  it('renders the inline filters and removes performance status', () => {
    render(<App />);

    expect(screen.getByText('统计时间')).toBeInTheDocument();
    expect(screen.queryByText('主维度')).not.toBeInTheDocument();
    expect(screen.getByText('客户统计范围')).toBeInTheDocument();
    expect(screen.getAllByText('咨询师').length).toBeGreaterThan(0);
    expect(screen.getAllByText('渠道').length).toBeGreaterThan(0);
    expect(screen.getAllByText('项目').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '展开 ▼' })).toBeInTheDocument();
    expect(screen.queryByText('业绩状态')).not.toBeInTheDocument();
  });

  it('shows secondary filters after expanding inline filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '展开 ▼' }));

    expect(screen.getByText('城市&机构')).toBeInTheDocument();
    expect(screen.getByText('客户池')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '收起 ▲' })).toBeInTheDocument();
  });

  it('does not allow project to break down by project category', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '项目' }));
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '项目分类' })).not.toBeInTheDocument();
  });

  it('filters the summary table by customer statistical scope', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);

    // With today's default date filter, only D004 (repurchase, not new customer) shows.
    // Selecting "当期新客" should hide D004 since customerCreatedInPeriod is false.
    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem!.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('当期新客'));

    // Click 查询 in the toolbar to apply the filter
    const filterBar = document.querySelector('.filter-bar')!;
    await user.click(within(filterBar as HTMLElement).getByRole('button', { name: '查 询' }));

    // After filtering, the table should be empty (no record is both today AND a new customer)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: '业绩拆解' })).not.toBeInTheDocument();
    });
  });

  it('uses filtered records inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);

    // First widen date range: type a broad range into the picker inputs
    const inputs = document.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '2026-06-01');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '2026-06-30');

    // Now apply customer scope filter
    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem!.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);

    const option = await screen.findByText('当期新客');
    fireEvent.click(option);

    // Click 查询 in the toolbar to apply the filters
    const filterBar2 = document.querySelector('.filter-bar')!;
    await user.click(within(filterBar2 as HTMLElement).getByRole('button', { name: '查 询' }));

    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: '李然' })).toBeInTheDocument();
    });

    // Open breakdown drawer — first row should now be 张敏 with filtered data
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    // Switch to channel tab — "自然流量" (D005) should NOT appear since it's not a new customer
    await user.click(within(drawer).getByRole('tab', { name: '渠道' }));
    expect(within(drawer).getByRole('cell', { name: '信息流' })).toBeInTheDocument();
    expect(within(drawer).queryByRole('cell', { name: '自然流量' })).not.toBeInTheDocument();
  });

  it('opens performance detail drawer with row-level underlying deal records', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getAllByRole('button', { name: '业绩明细' })[0]);

    const drawer = screen.getByRole('dialog', { name: '张敏 · 业绩明细' });
    expect(within(drawer).getByRole('columnheader', { name: '成交金额' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '合作比例' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '合作业绩' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交渠道' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '合作人名称' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '确认金额' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '确认日期' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '客户ID' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '电话' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交项目' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '业绩确认状态' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交机构' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '成交日期' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '上报时间' })).toBeInTheDocument();
    expect(within(drawer).getByRole('cell', { name: 'C003' })).toBeInTheDocument();
    expect(within(drawer).getByRole('cell', { name: '13800010003' })).toBeInTheDocument();
    expect(within(drawer).getByRole('cell', { name: '转介绍' })).toBeInTheDocument();
  });

  it('renders dashboard tab with grouped total metrics', () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: '仪表盘' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '报表' })).toBeInTheDocument();
    expect(screen.getByText('上报业绩')).toBeInTheDocument();
    expect(screen.getByText('成交概况')).toBeInTheDocument();
    expect(screen.getByText('确认业绩')).toBeInTheDocument();
    expect(screen.getByText('成交单量')).toBeInTheDocument();
    expect(screen.getByText('成交客户数')).toBeInTheDocument();
    expect(screen.getByText('新诊成交')).toBeInTheDocument();
    expect(screen.getByText('新诊业绩')).toBeInTheDocument();
    expect(screen.getByText('新诊单量')).toBeInTheDocument();
    expect(screen.getByText('新诊客户数')).toBeInTheDocument();
    expect(screen.getByText('复购成交')).toBeInTheDocument();
    expect(screen.getByText('复购业绩')).toBeInTheDocument();
    expect(screen.getByText('复购单量')).toBeInTheDocument();
    expect(screen.getByText('复购客户数')).toBeInTheDocument();
  });

  it('shows primary dimension only inside the report tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('combobox', { name: '主维度' })).not.toBeInTheDocument();

    await openReportTab(user);

    expect(screen.getByRole('combobox', { name: '主维度' })).toBeInTheDocument();
  });

  it('uses global filters for both dashboard totals and report rows', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Dashboard shows deal count 1 (today has one deal)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);

    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('当期新客'));

    const filterBar = document.querySelector('.filter-bar')!;
    await user.click(within(filterBar as HTMLElement).getByRole('button', { name: '查 询' }));

    // After filtering, dashboard moves to zero and report has no rows
    await waitFor(() => {
      expect(screen.getAllByText('¥0').length).toBeGreaterThan(0);
    });

    await openReportTab(user);

    expect(screen.queryByRole('button', { name: '业绩拆解' })).not.toBeInTheDocument();
  });
});
