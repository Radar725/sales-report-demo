import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('renders the approved sales-manager filters and removes performance status', () => {
    render(<App />);

    // Use getAllByText for labels that also appear as table headers
    expect(screen.getAllByText('统计时间').length).toBeGreaterThan(0);
    expect(screen.getAllByText('部门').length).toBeGreaterThan(0);
    expect(screen.getAllByText('咨询师').length).toBeGreaterThan(0);
    expect(screen.getByText('成交类型')).toBeInTheDocument();
    expect(screen.getByText('渠道分类')).toBeInTheDocument();
    expect(screen.getByText('项目分类')).toBeInTheDocument();
    expect(screen.getByText('客户统计范围')).toBeInTheDocument();
    expect(screen.getByText('主维度')).toBeInTheDocument();
    expect(screen.queryByText('业绩状态')).not.toBeInTheDocument();
  });

  it('shows detailed filters after expanding more filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '更多筛选' }));

    expect(screen.getByText('渠道')).toBeInTheDocument();
    expect(screen.getByText('项目')).toBeInTheDocument();
    expect(screen.getByText('城市')).toBeInTheDocument();
    expect(screen.getByText('机构')).toBeInTheDocument();
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

  it('filters the summary table by customer statistical scope', async () => {
    render(<App />);

    // With today's default date filter, only D004 (repurchase, not new customer) shows.
    // Selecting "当期新客" should hide D004 since customerCreatedInPeriod is false.
    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem!.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('当期新客'));

    // After filtering, the table should be empty (no record is both today AND a new customer)
    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: '20.0万' })).not.toBeInTheDocument();
    });
  });

  it('uses filtered records inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    // First widen date range: type a broad range into the picker inputs
    const inputs = document.querySelectorAll<HTMLInputElement>('.ant-picker-input input');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '2026-06-01');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '2026-06-30');
    // Trigger blur to commit the change
    fireEvent.blur(inputs[1]);

    // Now apply customer scope filter
    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem!.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);

    const option = await screen.findByText('当期新客');
    fireEvent.click(option);

    await waitFor(() => {
      expect(screen.queryByRole('cell', { name: '180.0万' })).not.toBeInTheDocument();
    });

    // Open breakdown drawer — first row should now be 张敏 with filtered data
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    // Switch to channel tab — "自然流量" (D005) should NOT appear since it's not a new customer
    await user.click(within(drawer).getByRole('tab', { name: '渠道' }));
    expect(within(drawer).getByRole('cell', { name: '信息流' })).toBeInTheDocument();
    expect(within(drawer).queryByRole('cell', { name: '自然流量' })).not.toBeInTheDocument();
  });
});
