import type { ColumnsType } from 'antd/es/table';
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
  { key: 'reportedAmount', label: '上报业绩', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
  { key: 'confirmedAmount', label: '确认业绩', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
  { key: 'confirmedAmountRate', label: '业绩确认率', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'dealCount', label: '成交单量', format: 'integer', width: REPORT_METRIC_WIDTHS.count },
  { key: 'customerCount', label: '成交客户数', format: 'integer', width: REPORT_METRIC_WIDTHS.count },
  { key: 'averageDealAmount', label: '客单价', format: 'amount', width: REPORT_METRIC_WIDTHS.amount },
];

const contributionMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmountRate', label: '业绩贡献', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'dealCountRate', label: '成交单量贡献', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
  { key: 'customerCountRate', label: '成交客户贡献', format: 'percent', width: REPORT_METRIC_WIDTHS.rate },
];

const repurchaseTotalContributionMetrics: ReportMetricDefinition[] = [
  { key: 'repurchaseCustomerTotalRate', label: '复购客户历史占比', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
  { key: 'repurchaseDealCountTotalRate', label: '复购单量历史占比', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
  { key: 'repurchaseAmountTotalRate', label: '复购业绩历史占比', format: 'percent', width: REPORT_METRIC_WIDTHS.rate, customerScopePrefixOnly: true },
];

export function buildReportMetricColumns<T extends ReportMetricValue & ComparableRecord>(
  filters: ReportColumnFilters,
  hasComparison = false,
): ColumnsType<T> {
  const metrics = [
    ...baseMetrics,
    ...contributionMetrics,
    ...(filters.dealType === 'repurchase' ? repurchaseTotalContributionMetrics : []),
  ];

  return metrics.map((metric) => ({
    title: getMetricLabel(metric.label, filters, metric),
    dataIndex: metric.key,
    key: metric.key,
    align: 'right',
    width: metric.width,
    sorter: (left: T, right: T) => (left[metric.key] ?? 0) - (right[metric.key] ?? 0),
    render: (value: number | null, record: T) =>
      renderMetricCell(value, metric, record, hasComparison && metric.participatesInComparison !== false),
  }));
}
