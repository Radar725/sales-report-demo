import { render, screen } from '@testing-library/react';
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

  it('renders comparison deltas when hasComparison is true', () => {
    const columns = buildReportMetricColumns(allFilters, true);
    const record = {
      reportedAmount: 12000,
      dealCount: 2,
      customerCount: 2,
      averageDealAmount: 6000,
      reportedAmountRate: 1,
      dealCountRate: 1,
      customerCountRate: 1,
      comparison: {
        reportedAmount: 0.25,
        customerCount: null,
      },
    };

    render(<>{columns[0].render?.(12000, record, 0)}</>);
    expect(screen.getByText('¥12,000')).toBeInTheDocument();
    expect(screen.getByText('↑ 25.0%')).toBeInTheDocument();

    render(<>{columns[2].render?.(2, record, 0)}</>);
    expect(screen.getAllByText('—')).toHaveLength(1);
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

  it('adds customer-scoped repurchase total columns only for repurchase', () => {
    const repurchase = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'repurchase' });
    expect(repurchase.slice(-3).map((column) => column.title)).toEqual([
      '新客复购客户占总复购比', '新客复购单量占总复购比', '新客复购业绩占总复购比',
    ]);
    expect(buildReportMetricColumns({ customerScope: 'existingCustomers', dealType: 'newDiagnosis' })
      .map((column) => column.key)).not.toContain('repurchaseCustomerTotalRate');
  });

  it('renders repurchase total values without comparison deltas', () => {
    const columns = buildReportMetricColumns({ customerScope: 'all', dealType: 'repurchase' }, true);
    const column = columns.find((item) => item.key === 'repurchaseCustomerTotalRate')!;
    render(<>{column.render?.(0.25, { repurchaseCustomerTotalRate: 0.25, comparison: { repurchaseCustomerTotalRate: 0.5 } }, 0)}</>);
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });
});
