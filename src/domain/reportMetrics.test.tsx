import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { buildReportMetricColumns, REPORT_METRIC_WIDTHS } from './reportMetrics';

const allFilters = { customerScope: 'all', dealType: 'all' } as const;

const baseReportRecord = {
  reportedAmount: 12000,
  confirmedAmount: 9600,
  confirmedAmountRate: 0.8,
  dealCount: 2,
  customerCount: 2,
  averageDealAmount: 6000,
  reportedAmountRate: 1,
  dealCountRate: 1,
  customerCountRate: 1,
  repurchaseCustomerTotalRate: null,
  repurchaseDealCountTotalRate: null,
  repurchaseAmountTotalRate: null,
} as const;

describe('report metric columns', () => {
  it('exposes only base metrics when both filters are all', () => {
    const columns = buildReportMetricColumns(allFilters);

    expect(columns.map((column) => column.key)).toEqual([
      'reportedAmount',
      'confirmedAmount',
      'confirmedAmountRate',
      'dealCount',
      'customerCount',
      'averageDealAmount',
    ]);
    expect(columns.map((column) => column.width)).toEqual([
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.amount,
    ]);
  });

  it('keeps original metric names without ratio columns when both filters are all', () => {
    expect(buildReportMetricColumns(allFilters).map((column) => column.title)).toEqual([
      '上报业绩', '确认业绩', '业绩确认率', '成交单量', '成交客户数', '客单价',
    ]);
  });

  it('includes contribution metrics when either filter is narrowed', () => {
    const columns = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'all' });

    expect(columns.map((column) => column.key)).toEqual([
      'reportedAmount',
      'confirmedAmount',
      'confirmedAmountRate',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountRate',
      'dealCountRate',
      'customerCountRate',
    ]);
  });

  it('renders comparison deltas when hasComparison is true', () => {
    const columns = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'all' }, true);
    const record = {
      ...baseReportRecord,
      comparison: {
        reportedAmount: 0.25,
        confirmedAmount: 0.2,
        confirmedAmountRate: 0.1,
        customerCount: null,
      },
    };

    render(<>{columns[0].render?.(12000, record, 0)}</>);
    expect(screen.getByText('¥12,000')).toBeInTheDocument();
    expect(screen.getByText('↑ 25.0%')).toBeInTheDocument();

    render(<>{columns[2].render?.(0.8, record, 0)}</>);
    expect(screen.getByText('80.0%')).toBeInTheDocument();
    expect(screen.getByText('↑ 10.0%')).toBeInTheDocument();

    cleanup();
    render(<>{columns[2].render?.(null, { ...record, confirmedAmountRate: null, comparison: { confirmedAmountRate: null } }, 0)}</>);
    expect(screen.getAllByText('—')).toHaveLength(2);

    cleanup();
    render(<>{columns[4].render?.(2, record, 0)}</>);
    expect(screen.getAllByText('—')).toHaveLength(1);
  });

  it('prefixes every metric with customer scope then deal type', () => {
    const titles = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'newDiagnosis' })
      .map((column) => column.title);

    expect(titles).toEqual([
      '新客新诊上报业绩', '新客新诊确认业绩', '新客新诊业绩确认率',
      '新客新诊成交单量', '新客新诊成交客户数', '新客新诊客单价',
      '新客新诊业绩占比', '新客新诊成交单量占比', '新客新诊成交客户占比',
    ]);
    expect(titles).toContain('新客新诊确认业绩');
    expect(titles).toContain('新客新诊业绩确认率');
  });

  it('adds customer-scoped repurchase total columns only for repurchase', () => {
    const repurchase = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'repurchase' });
    expect(repurchase.slice(-3).map((column) => column.title)).toEqual([
      '新客复购客户历史占比', '新客复购单量历史占比', '新客复购业绩历史占比',
    ]);
    expect(buildReportMetricColumns({ customerScope: 'existingCustomers', dealType: 'newDiagnosis' })
      .map((column) => column.key)).not.toContain('repurchaseCustomerTotalRate');
  });

  it('renders repurchase total values with comparison deltas', () => {
    const columns = buildReportMetricColumns({ customerScope: 'all', dealType: 'repurchase' }, true);
    const column = columns.find((item) => item.key === 'repurchaseCustomerTotalRate')!;
    render(<>{column.render?.(0.25, {
      ...baseReportRecord,
      repurchaseCustomerTotalRate: 0.25,
      comparison: { repurchaseCustomerTotalRate: 0.5 },
    }, 0)}</>);
    expect(screen.getByText('25.0%')).toBeInTheDocument();
    expect(screen.getByText('↑ 50.0%')).toBeInTheDocument();
  });
});
