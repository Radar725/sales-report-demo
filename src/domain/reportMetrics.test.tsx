import { describe, expect, it } from 'vitest';
import { buildReportMetricColumns } from './reportMetrics';

describe('report metric columns', () => {
  it('shows only the four base report metrics by default', () => {
    expect(buildReportMetricColumns({ showContributionRates: false, showNewCustomerMetrics: false }).map((column) => column.key)).toEqual([
      'reportedAmount',
      'dealCount',
      'customerCount',
      'averageDealAmount',
    ]);
  });

  it('appends three contribution ratios for a restricted scope', () => {
    expect(buildReportMetricColumns({ showContributionRates: true, showNewCustomerMetrics: false }).map((column) => column.key)).toEqual([
      'reportedAmount',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountRate',
      'dealCountRate',
      'customerCountRate',
    ]);
  });

  it('inserts new customer metrics immediately after reported amount when requested', () => {
    expect(buildReportMetricColumns({ showContributionRates: false, showNewCustomerMetrics: true }).map((column) => column.key)).toEqual([
      'reportedAmount',
      'newCustomerCount',
      'newCustomerConversionRate',
      'dealCount',
      'customerCount',
      'averageDealAmount',
    ]);
  });

  it('renders an unavailable new customer metric as an em dash', () => {
    const column = buildReportMetricColumns({
      showContributionRates: false,
      showNewCustomerMetrics: true,
    }).find((item) => item.key === 'newCustomerCount');

    expect(column?.render?.(null, {} as never, 0)).toBe('—');
  });
});
