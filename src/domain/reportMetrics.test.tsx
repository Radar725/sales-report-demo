import { describe, expect, it } from 'vitest';
import { buildReportMetricColumns, REPORT_METRIC_WIDTHS } from './reportMetrics';

const allFilters = { customerScope: 'all', dealType: 'all' } as const;

describe('report metric columns', () => {
  it('always exposes the seven report metrics with semantic widths', () => {
    const columns = buildReportMetricColumns(allFilters);

    expect(columns.map((column) => column.key)).toEqual([
      'reportedAmount',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountRate',
      'dealCountRate',
      'customerCountRate',
    ]);
    expect(columns.map((column) => column.width)).toEqual([
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.rate,
    ]);
  });

  it('keeps original metric names when both filters are all', () => {
    expect(buildReportMetricColumns(allFilters).map((column) => column.title)).toEqual([
      '上报业绩', '成交单量', '成交客户数', '客单价',
      '业绩占比', '成交单量占比', '成交客户占比',
    ]);
  });

  it('prefixes every metric with customer scope then deal type', () => {
    expect(
      buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'newDiagnosis' })
        .map((column) => column.title),
    ).toEqual([
      '新客新诊上报业绩', '新客新诊成交单量', '新客新诊成交客户数',
      '新客新诊客单价', '新客新诊业绩占比',
      '新客新诊成交单量占比', '新客新诊成交客户占比',
    ]);
  });
});
