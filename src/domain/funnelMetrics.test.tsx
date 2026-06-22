import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

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
});
