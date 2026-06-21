import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

describe('funnel metric columns', () => {
  it('combines scope and customer type into each label', () => {
    expect(
      buildFunnelMetricColumns({
        customerScope: 'currentNewCustomers',
        customerType: 'valid',
      }).map((column) => column.title),
    ).toContain('新客有效到院成交率');
  });

  it('removes the prefix only when both filters are all', () => {
    expect(
      buildFunnelMetricColumns({
        customerScope: 'all',
        customerType: 'all',
      }).map((column) => column.title),
    ).toContain('客户数');
  });
});
