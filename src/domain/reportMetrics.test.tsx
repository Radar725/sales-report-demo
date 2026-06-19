import { describe, expect, it } from 'vitest';
import { buildReportMetricColumns } from './reportMetrics';

describe('report metric columns', () => {
  it('shows only the four base report metrics by default', () => {
    expect(buildReportMetricColumns(false).map((column) => column.key)).toEqual([
      'reportedAmount',
      'dealCount',
      'customerCount',
      'averageDealAmount',
    ]);
  });

  it('appends three contribution ratios for a restricted scope', () => {
    expect(buildReportMetricColumns(true).map((column) => column.key)).toEqual([
      'reportedAmount',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountRate',
      'dealCountRate',
      'customerCountRate',
    ]);
  });
});
