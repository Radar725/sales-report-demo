import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FilterBar from './FilterBar';

const defaultFilters = {
  dateRange: ['2026-06-01', '2026-06-30'] as [string, string],
  comparisonDateRange: null,
  departments: [],
  consultants: [],
  dealType: 'all' as const,
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'currentNewCustomers' as const,
  customerPools: [],
  cities: [],
  institutions: [],
};

const customerScopeTooltip =
  '按客户创建时间划分统计范围：新客为统计期内创建，老客为统计期开始前创建，全部不限制。该筛选不等同于首次成交，可与新诊、复购组合使用。';

const dealTypeTooltip =
  '按成交记录类型筛选：新诊为新诊成交，复购为复购成交，全部会同时统计两类成交。可与客户统计范围组合使用。';

describe('FilterBar filter explanations', () => {
  it('shows info icons for customer scope and deal type labels', () => {
    render(
      <FilterBar filters={defaultFilters} records={[]} onFiltersChange={vi.fn()} />,
    );

    expect(screen.getByLabelText('客户统计范围说明')).toBeInTheDocument();
    expect(screen.getByLabelText('成交类型说明')).toBeInTheDocument();
  });

  it('shows approved tooltips when hovering the filter info icons', async () => {
    const user = userEvent.setup();
    render(
      <FilterBar filters={defaultFilters} records={[]} onFiltersChange={vi.fn()} />,
    );

    await user.hover(screen.getByLabelText('客户统计范围说明'));
    expect(await screen.findByText(customerScopeTooltip)).toBeInTheDocument();

    await user.hover(screen.getByLabelText('成交类型说明'));
    expect(await screen.findByText(dealTypeTooltip)).toBeInTheDocument();
  });
});
