import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

const allFilters = { customerScope: 'all', customerType: 'all' } as const;

describe('funnel metric columns', () => {
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
