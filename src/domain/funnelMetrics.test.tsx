import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

describe('funnel metric columns', () => {
  it('always exposes the thirteen status-cohort columns without a prefix', () => {
    expect(buildFunnelMetricColumns().map((column) => column.title)).toEqual([
      '录单客户数',
      '已加微客户数',
      '已派单客户数',
      '已邀约客户数',
      '已到院客户数',
      '已成交客户数',
      '已复购客户数',
      '加微率',
      '派单率',
      '邀约率',
      '到院率',
      '成交率',
      '复购率',
    ]);
  });

  it('renders comparison deltas when hasComparison is true', () => {
    const columns = buildFunnelMetricColumns(true);
    const record = {
      recordedCustomerCount: 3,
      addedWechatCustomerCount: 0,
      dispatchedCustomerCount: 0,
      invitedCustomerCount: 0,
      visitedCustomerCount: 0,
      convertedCustomerCount: 0,
      repurchasedCustomerCount: 0,
      addedWechatRate: null,
      dispatchRate: null,
      invitationRate: null,
      visitRate: null,
      conversionRate: null,
      repurchaseRate: null,
      comparison: {
        recordedCustomerCount: 0.5,
      },
    };

    render(<>{columns[0].render?.(3, record, 0)}</>);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('↑ 50.0%')).toBeInTheDocument();
  });
});
