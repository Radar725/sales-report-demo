import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

const allFilters = { customerScope: 'all', customerType: 'all' } as const;

describe('funnel metric columns', () => {
  it('combines customer scope into each label', () => {
    expect(
      buildFunnelMetricColumns({
        customerScope: 'currentNewCustomers',
        customerType: 'valid',
      }).map((column) => column.title),
    ).toContain('新客到院成交率');
  });

  it('does not include customer type in column labels', () => {
    const validColumns = buildFunnelMetricColumns({
      customerScope: 'all',
      customerType: 'valid',
    }).map((column) => column.title);
    const invalidColumns = buildFunnelMetricColumns({
      customerScope: 'all',
      customerType: 'invalid',
    }).map((column) => column.title);

    expect(validColumns).toContain('客户数');
    expect(invalidColumns).toContain('客户数');
    expect(validColumns).not.toContain('有效客户数');
    expect(invalidColumns).not.toContain('无效客户数');
  });

  it('removes the prefix when customer scope is all', () => {
    expect(
      buildFunnelMetricColumns({
        customerScope: 'all',
        customerType: 'all',
      }).map((column) => column.title),
    ).toContain('客户数');
  });

  it('renders comparison deltas when hasComparison is true', () => {
    const columns = buildFunnelMetricColumns(allFilters, true);
    const record = {
      customerCount: 3,
      dispatchedCustomerCount: 0,
      invitedCustomerCount: 0,
      visitedCustomerCount: 0,
      convertedCustomerCount: 0,
      dispatchRate: null,
      invitationRate: null,
      visitRate: null,
      conversionRate: null,
      dispatchInvitationRate: null,
      inviteVisitRate: null,
      visitConversionRate: null,
      comparison: {
        customerCount: 0.5,
      },
    };

    render(<>{columns[0].render?.(3, record, 0)}</>);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('↑ 50.0%')).toBeInTheDocument();
  });
});
