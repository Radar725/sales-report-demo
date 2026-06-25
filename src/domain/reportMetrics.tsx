import type { ColumnsType } from 'antd/es/table';
import { MetricColumnTitle } from '../components/MetricColumnTitle';
import { formatMetricValue, formatPercent, type MetricValue } from './metrics';
import type { CustomerScopeFilter, DealTypeFilter } from './filters';

export type ReportColumnFilters = {
  customerScope: CustomerScopeFilter;
  dealType: DealTypeFilter;
};

export type ReportMetricValue = Pick<
  MetricValue,
  'reportedAmount' | 'confirmedAmount' | 'confirmedAmountRate'
    | 'dealCount' | 'customerCount' | 'averageDealAmount'
> & {
  reportedAmountRate: number | null;
  dealCountRate: number | null;
  customerCountRate: number | null;
  reportedAmountContributionRate: number | null;
  dealCountContributionRate: number | null;
  customerCountContributionRate: number | null;
  repurchaseCustomerTotalRate: number | null;
  repurchaseDealCountTotalRate: number | null;
  repurchaseAmountTotalRate: number | null;
};

export type ReportMetricKey = keyof ReportMetricValue;

export const REPORT_METRIC_WIDTHS = {
  amount: 132,
  count: 104,
  rate: 116,
} as const;

type ReportMetricFormat = 'amount' | 'integer' | 'percent';

type ReportMetricDefinition = {
  key: ReportMetricKey;
  label: string;
  description: string;
  format: ReportMetricFormat;
  width: number;
  customerScopePrefixOnly?: boolean;
  participatesInComparison?: boolean;
};

type ComparableRecord = {
  comparison?: Partial<Record<ReportMetricKey, number | null>> | null;
};

const customerScopeLabels: Record<CustomerScopeFilter, string> = {
  all: '',
  currentNewCustomers: '新客',
  existingCustomers: '老客',
};

const dealTypeLabels: Record<DealTypeFilter, string> = {
  all: '',
  newDiagnosis: '新诊',
  repurchase: '复购',
};

function getMetricLabel(label: string, filters: ReportColumnFilters, metric: ReportMetricDefinition) {
  if (metric.customerScopePrefixOnly) {
    return `${customerScopeLabels[filters.customerScope]}${label}`;
  }
  return `${customerScopeLabels[filters.customerScope]}${dealTypeLabels[filters.dealType]}${label}`;
}

function renderMetricCell(
  value: number | null,
  metric: ReportMetricDefinition,
  record: ComparableRecord,
  hasComparison: boolean,
) {
  if (!hasComparison) {
    return value === null ? '—' : formatMetricValue(value, metric.format);
  }

  const change = record.comparison?.[metric.key] ?? null;

  return (
    <div className="metric-cell">
      <div>{value === null ? '—' : formatMetricValue(value, metric.format)}</div>
      <div
        className={
          change === null
            ? 'metric-change is-unavailable'
            : change > 0
              ? 'metric-change is-up'
              : change < 0
                ? 'metric-change is-down'
                : 'metric-change is-flat'
        }
      >
        {change === null
          ? '—'
          : `${change > 0 ? '↑ ' : change < 0 ? '↓ ' : ''}${formatPercent(Math.abs(change))}`}
      </div>
    </div>
  );
}

const baseMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmount', label: '上报业绩', description: '当前维度下上报的成交金额，不含定金。', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
  { key: 'confirmedAmount', label: '确认业绩', description: '当前维度下上报的成交记录对应的财务确认金额。', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
  { key: 'confirmedAmountRate', label: '业绩确认率', description: '确认业绩占上报业绩的比例，反映已上报业绩的确认进度。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'dealCount', label: '成交单量', description: '当前维度下的成交记录数，不含定金。', format: 'integer', width: REPORT_METRIC_WIDTHS.count },
  { key: 'customerCount', label: '成交客户数', description: '当前维度下有成交的去重客户数，不含定金。', format: 'integer', width: REPORT_METRIC_WIDTHS.count },
  { key: 'averageDealAmount', label: '客单价', description: '平均每笔成交金额，计算公式：上报业绩 ÷ 成交单量。', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
];

const shareMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmountRate', label: '业绩占比', description: '当前行上报业绩占同维度总业绩的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'dealCountRate', label: '成交单量占比', description: '当前行成交单量占同维度总成交单量的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'customerCountRate', label: '成交客户占比', description: '当前行成交客户数占同维度总成交客户数的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
];

const contributionMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmountContributionRate', label: '业绩贡献', description: '当前行上报业绩占当前列表汇总业绩的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'dealCountContributionRate', label: '成交单量贡献', description: '当前行成交单量占当前列表汇总成交单量的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'customerCountContributionRate', label: '成交客户贡献', description: '当前行成交客户数占当前列表汇总成交客户数的比例。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
];

const repurchaseTotalContributionMetrics: ReportMetricDefinition[] = [
  { key: 'repurchaseCustomerTotalRate', label: '复购客户历史占比', description: '当期复购客户数占截至统计期末累计复购客户数的比例，反映复购客户的当期活跃度。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
  { key: 'repurchaseDealCountTotalRate', label: '复购单量历史占比', description: '当期复购单量占截至统计期末累计复购单量的比例，反映复购频次的当期活跃度。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
  { key: 'repurchaseAmountTotalRate', label: '复购业绩历史占比', description: '当期复购业绩占截至统计期末累计复购业绩的比例，反映复购业绩的当期贡献。', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
];

function shouldShowShareRates(filters: ReportColumnFilters) {
  return !(filters.customerScope === 'all' && filters.dealType === 'all');
}

const allReportMetrics: ReportMetricDefinition[] = [
  ...baseMetrics,
  ...shareMetrics,
  ...contributionMetrics,
  ...repurchaseTotalContributionMetrics,
];

/** 列表设置弹窗用的完整字段目录（规范名、无前缀，不受筛选影响） */
export function getPerformanceReportSettingCatalog() {
  return allReportMetrics.map((metric) => ({
    key: metric.key,
    title: metric.label,
    filterTitle: metric.label,
    dataIndex: metric.key,
    align: 'right' as const,
    width: metric.width,
  }));
}

export function getReportMetricDefinitions(filters: ReportColumnFilters) {
  const metrics = [
    ...baseMetrics,
    ...(shouldShowShareRates(filters) ? shareMetrics : []),
    ...contributionMetrics,
    ...(filters.dealType === 'repurchase' ? repurchaseTotalContributionMetrics : []),
  ];

  return metrics.map((metric) => ({
    key: metric.key,
    label: getMetricLabel(metric.label, filters, metric),
    format: metric.format,
  }));
}

export function buildReportMetricColumns<T extends ReportMetricValue & ComparableRecord>(
  filters: ReportColumnFilters,
  hasComparison = false,
): ColumnsType<T> {
  const metrics = [
    ...baseMetrics,
    ...(shouldShowShareRates(filters) ? shareMetrics : []),
    ...contributionMetrics,
    ...(filters.dealType === 'repurchase' ? repurchaseTotalContributionMetrics : []),
  ];

  return metrics.map((metric) => ({
    title: (
      <MetricColumnTitle
        label={getMetricLabel(metric.label, filters, metric)}
        description={metric.description}
      />
    ),
    filterTitle: getMetricLabel(metric.label, filters, metric),
    dataIndex: metric.key,
    key: metric.key,
    align: 'right',
    width: metric.width,
    sorter: (left: T, right: T) => (left[metric.key] ?? 0) - (right[metric.key] ?? 0),
    render: (value: number | null, record: T) =>
      renderMetricCell(value, metric, record, hasComparison && metric.participatesInComparison !== false),
  }));
}
