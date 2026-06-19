import type { ColumnsType } from 'antd/es/table';
import { formatMetricValue, type MetricValue } from './metrics';

export type ReportMetricValue = Pick<
  MetricValue,
  'reportedAmount' | 'dealCount' | 'customerCount' | 'averageDealAmount'
> & {
  reportedAmountRate: number | null;
  dealCountRate: number | null;
  customerCountRate: number | null;
};

type ReportMetricKey = keyof ReportMetricValue;
type ReportMetricFormat = 'amount' | 'integer' | 'percent';

type ReportMetricDefinition = {
  key: ReportMetricKey;
  label: string;
  format: ReportMetricFormat;
};

const baseMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmount', label: '上报业绩', format: 'amount' },
  { key: 'dealCount', label: '成交单量', format: 'integer' },
  { key: 'customerCount', label: '成交客户数', format: 'integer' },
  { key: 'averageDealAmount', label: '客单价', format: 'amount' },
];

const contributionMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmountRate', label: '业绩占比', format: 'percent' },
  { key: 'dealCountRate', label: '单量占比', format: 'percent' },
  { key: 'customerCountRate', label: '客户占比', format: 'percent' },
];

export function buildReportMetricColumns<T extends ReportMetricValue>(
  showContributionRates: boolean,
): ColumnsType<T> {
  const metrics = showContributionRates
    ? [...baseMetrics, ...contributionMetrics]
    : baseMetrics;

  return metrics.map((metric) => ({
    title: metric.label,
    dataIndex: metric.key,
    key: metric.key,
    align: 'right',
    width: 170,
    sorter: (left, right) => {
      const leftValue = left[metric.key] ?? 0;
      const rightValue = right[metric.key] ?? 0;
      return leftValue - rightValue;
    },
    render: (value: number | null) =>
      value === null ? '—' : formatMetricValue(value, metric.format),
  }));
}
