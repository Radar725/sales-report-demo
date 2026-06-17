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
    // Click 查询 to apply the toolbar primary dimension
    await user.click(
      within(document.querySelector('.filter-bar') as HTMLElement).getByRole('button', {
        name: '查 询',
      }),
    );
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
    // Click 查询 to apply the toolbar primary dimension
    await user.click(
      within(document.querySelector('.filter-bar') as HTMLElement).getByRole('button', {
        name: '查 询',
      }),
    );
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '项目' })).toBeInTheDocument();
  });

  it('renders the toolbar-visible filters and removes performance status', () => {
    render(<App />);

    expect(screen.getByText('统计时间')).toBeInTheDocument();
    expect(screen.getByText('主维度')).toBeInTheDocument();
    expect(screen.getByText('客户统计范围')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部筛选' })).toBeInTheDocument();
    expect(screen.queryByText('业绩状态')).not.toBeInTheDocument();
  });

  it('shows detailed filters in Modal after clicking more filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '全部筛选' }));

    const modal = screen.getByRole('dialog', { name: '全部筛选' });
    // All 12 filters are shown in a 3-column grid
    const gridLabels = modal.querySelectorAll('.filter-grid-label');
    const labelTexts = Array.from(gridLabels).map((el) => el.textContent?.trim());
    expect(labelTexts).toEqual(
      expect.arrayContaining([
        '统计时间',
        '主维度',
        '客户统计范围',
        '咨询师',
        '渠道',
        '项目',
        '城市&机构',
        '客户池',
        '成交类型',
      ]),
    );
  });

  it('does not allow project to break down by project category', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '项目' }));
    // Click 查询 to apply the toolbar primary dimension
    await user.click(
      within(document.querySelector('.filter-bar') as HTMLElement).getByRole('button', {
        name: '查 询',
      }),
    );
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '项目分类' })).not.toBeInTheDocument();
  });

  it('filters the summary table by customer statistical scope', async () => {
    const user = userEvent.setup();
    render(<App />);

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
