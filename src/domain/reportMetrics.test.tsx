import { isValidElement, type ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MetricColumnTitle } from '../components/MetricColumnTitle';
import { buildReportMetricColumns, getPerformanceReportSettingCatalog, REPORT_METRIC_WIDTHS } from './reportMetrics';

const allFilters = { customerScope: 'all', dealType: 'all' } as const;

const reportMetricDescriptions: Record<string, string> = {
  上报业绩: '当前维度下上报的成交金额，不含定金。',
  确认业绩: '当前维度下上报的成交记录对应的财务确认金额。',
  业绩确认率: '确认业绩占上报业绩的比例，反映已上报业绩的确认进度。',
  成交单量: '当前维度下的成交记录数，不含定金。',
  成交客户数: '当前维度下有成交的去重客户数，不含定金。',
  客单价: '平均每笔成交金额，计算公式：上报业绩 ÷ 成交单量。',
  业绩占比: '当前行上报业绩占同维度总业绩的比例。',
  成交单量占比: '当前行成交单量占同维度总成交单量的比例。',
  成交客户占比: '当前行成交客户数占同维度总成交客户数的比例。',
  业绩贡献: '当前行上报业绩占当前列表汇总业绩的比例。',
  成交单量贡献: '当前行成交单量占当前列表汇总成交单量的比例。',
  成交客户贡献: '当前行成交客户数占当前列表汇总成交客户数的比例。',
  复购客户历史占比: '当期复购客户数占截至统计期末累计复购客户数的比例，反映复购客户的当期活跃度。',
  复购单量历史占比: '当期复购单量占截至统计期末累计复购单量的比例，反映复购频次的当期活跃度。',
  复购业绩历史占比: '当期复购业绩占截至统计期末累计复购业绩的比例，反映复购业绩的当期贡献。',
};

function getMetricColumnTitleProps(title: unknown) {
  expect(isValidElement(title)).toBe(true);
  const element = title as ReactElement<{ label: string; description: string }>;
  expect(element.type).toBe(MetricColumnTitle);
  return element.props;
}

const repurchaseTotalMetricLabels = ['复购客户历史占比', '复购单量历史占比', '复购业绩历史占比'] as const;

function getBaseMetricLabel(prefixedLabel: string) {
  let label = prefixedLabel.replace(/^新客|^老客/, '');

  if (repurchaseTotalMetricLabels.includes(label as (typeof repurchaseTotalMetricLabels)[number])) {
    return label;
  }

  return label.replace(/^新诊|^复购/, '');
}

function expectApprovedMetricDescription(title: unknown) {
  const { label, description } = getMetricColumnTitleProps(title);
  expect(description).toBe(reportMetricDescriptions[getBaseMetricLabel(label)]);
  return { label, description };
}

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
  reportedAmountContributionRate: 0.4,
  dealCountContributionRate: 0.4,
  customerCountContributionRate: 0.4,
  repurchaseCustomerTotalRate: null,
  repurchaseDealCountTotalRate: null,
  repurchaseAmountTotalRate: null,
} as const;

describe('report metric columns', () => {
  it('exposes base and contribution metrics when both filters are all', () => {
    const columns = buildReportMetricColumns(allFilters);

    expect(columns.map((column) => column.key)).toEqual([
      'reportedAmount',
      'confirmedAmount',
      'confirmedAmountRate',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountContributionRate',
      'dealCountContributionRate',
      'customerCountContributionRate',
    ]);
    expect(columns.map((column) => column.width)).toEqual([
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.count,
      REPORT_METRIC_WIDTHS.amount,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.rate,
      REPORT_METRIC_WIDTHS.rate,
    ]);
  });

  it('renders MetricColumnTitle with approved labels and descriptions when both filters are all', () => {
    const columns = buildReportMetricColumns(allFilters);

    expect(columns.map((column) => getMetricColumnTitleProps(column.title).label)).toEqual([
      '上报业绩', '确认业绩', '业绩确认率', '成交单量', '成交客户数', '客单价',
      '业绩贡献', '成交单量贡献', '成交客户贡献',
    ]);
    columns.forEach((column) => {
      expectApprovedMetricDescription(column.title);
    });
  });

  it('includes share and contribution metrics when either filter is narrowed', () => {
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
      'reportedAmountContributionRate',
      'dealCountContributionRate',
      'customerCountContributionRate',
    ]);
    expect(columns.map((column) => getMetricColumnTitleProps(column.title).label)).toEqual([
      '新客上报业绩', '新客确认业绩', '新客业绩确认率', '新客成交单量', '新客成交客户数', '新客客单价',
      '新客业绩占比', '新客成交单量占比', '新客成交客户占比',
      '新客业绩贡献', '新客成交单量贡献', '新客成交客户贡献',
    ]);
    columns.forEach((column) => {
      expectApprovedMetricDescription(column.title);
    });
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

  it('prefixes every metric label with customer scope then deal type', () => {
    const columns = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'newDiagnosis' });
    const labels = columns.map((column) => getMetricColumnTitleProps(column.title).label);

    expect(labels).toEqual([
      '新客新诊上报业绩', '新客新诊确认业绩', '新客新诊业绩确认率',
      '新客新诊成交单量', '新客新诊成交客户数', '新客新诊客单价',
      '新客新诊业绩占比', '新客新诊成交单量占比', '新客新诊成交客户占比',
      '新客新诊业绩贡献', '新客新诊成交单量贡献', '新客新诊成交客户贡献',
    ]);
    expect(labels).toContain('新客新诊确认业绩');
    expect(labels).toContain('新客新诊业绩确认率');
    columns.forEach((column) => {
      expectApprovedMetricDescription(column.title);
    });
  });

  it('uses base descriptions for prefixed metric titles', async () => {
    const user = userEvent.setup();
    const column = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'newDiagnosis' })
      .find((item) => item.key === 'reportedAmount')!;
    const { label, description } = getMetricColumnTitleProps(column.title);

    expect(label).toBe('新客新诊上报业绩');
    expect(description).toBe(reportMetricDescriptions['上报业绩']);

    render(<>{column.title}</>);
    await user.hover(screen.getByText('新客新诊上报业绩'));
    expect(await screen.findByText(reportMetricDescriptions['上报业绩'])).toBeInTheDocument();
  });

  it('renders contribution comparison deltas when hasComparison is true', () => {
    const column = buildReportMetricColumns(allFilters, true)
      .find((item) => item.key === 'reportedAmountContributionRate')!;
    render(<>{column.render?.(0.4, {
      ...baseReportRecord,
      reportedAmountContributionRate: 0.4,
      comparison: { reportedAmountContributionRate: 0.25 },
    }, 0)}</>);
    expect(screen.getByText('40.0%')).toBeInTheDocument();
    expect(screen.getByText('↑ 25.0%')).toBeInTheDocument();
  });

  it('adds customer-scoped repurchase total columns only for repurchase', () => {
    const repurchase = buildReportMetricColumns({ customerScope: 'currentNewCustomers', dealType: 'repurchase' });
    expect(repurchase.slice(-3).map((column) => getMetricColumnTitleProps(column.title).label)).toEqual([
      '新客复购客户历史占比', '新客复购单量历史占比', '新客复购业绩历史占比',
    ]);
    repurchase.slice(-3).forEach((column) => {
      expectApprovedMetricDescription(column.title);
    });
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

  it('exposes full setting catalog with canonical labels regardless of filters', () => {
    const catalog = getPerformanceReportSettingCatalog();

    expect(catalog.map((column) => column.key)).toEqual([
      'reportedAmount',
      'confirmedAmount',
      'confirmedAmountRate',
      'dealCount',
      'customerCount',
      'averageDealAmount',
      'reportedAmountRate',
      'dealCountRate',
      'customerCountRate',
      'reportedAmountContributionRate',
      'dealCountContributionRate',
      'customerCountContributionRate',
      'repurchaseCustomerTotalRate',
      'repurchaseDealCountTotalRate',
      'repurchaseAmountTotalRate',
    ]);
    expect(catalog.map((column) => column.filterTitle)).toEqual([
      '上报业绩',
      '确认业绩',
      '业绩确认率',
      '成交单量',
      '成交客户数',
      '客单价',
      '业绩占比',
      '成交单量占比',
      '成交客户占比',
      '业绩贡献',
      '成交单量贡献',
      '成交客户贡献',
      '复购客户历史占比',
      '复购单量历史占比',
      '复购业绩历史占比',
    ]);
    expect(catalog.find((column) => column.key === 'reportedAmount')?.filterTitle).toBe('上报业绩');
    expect(catalog.find((column) => column.key === 'repurchaseCustomerTotalRate')?.filterTitle).toBe(
      '复购客户历史占比',
    );
  });
});
