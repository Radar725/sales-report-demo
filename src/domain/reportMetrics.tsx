import type { ColumnsType } from 'antd/es/table';
import { formatMetricValue, type MetricValue } from './metrics';

export type ReportMetricValue = Pick<
  MetricValue,
  'reportedAmount' | 'dealCount' | 'customerCount' | 'averageDealAmount'
> & {
  newCustomerCount: number | null;
  newCustomerConversionRate: number | null;
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
  width: number;
};

const baseMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmount', label: '上报业绩', format: 'amount', width: 100 },
  { key: 'dealCount', label: '成交单量', format: 'integer', width: 70 },
  { key: 'customerCount', label: '成交客户数', format: 'integer', width: 80 },
  { key: 'averageDealAmount', label: '客单价', format: 'amount', width: 90 },
];

const newCustomerMetrics: ReportMetricDefinition[] = [
  { key: 'newCustomerCount', label: '新客数', format: 'integer', width: 80 },
  { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent', width: 96 },
];

const contributionMetrics: ReportMetricDefinition[] = [
  { key: 'reportedAmountRate', label: '业绩占比', format: 'percent', width: 70 },
  { key: 'dealCountRate', label: '单量占比', format: 'percent', width: 70 },
  { key: 'customerCountRate', label: '客户占比', format: 'percent', width: 70 },
];

export function buildReportMetricColumns<T extends ReportMetricValue>(
  options: { showContributionRates: boolean; showNewCustomerMetrics: boolean },
): ColumnsType<T> {
  const metrics = [
    baseMetrics[0],
    ...(options.showNewCustomerMetrics ? newCustomerMetrics : []),
    ...baseMetrics.slice(1),
    ...(options.showContributionRates ? contributionMetrics : []),
  ];

  return metrics.map((metric) => ({
    title: metric.label,
    dataIndex: metric.key,
    key: metric.key,
    align: 'right',
    width: metric.width,
    sorter: (left, right) => {
      const leftValue = left[metric.key] ?? 0;
      const rightValue = right[metric.key] ?? 0;
      return leftValue - rightValue;
    },
    render: (value: number | null) =>
      value === null ? '—' : formatMetricValue(value, metric.format),
  }));
}
