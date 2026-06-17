import type { ColumnsType } from 'antd/es/table';

export type MetricKey =
  | 'reportedAmount'
  | 'confirmedAmount'
  | 'dealCount'
  | 'customerCount'
  | 'averageDealAmount'
  | 'newDiagnosisAmount'
  | 'newDiagnosisDealCount'
  | 'newDiagnosisCustomerCount'
  | 'newDiagnosisDealCountRate'
  | 'newDiagnosisCustomerRate'
  | 'newDiagnosisAmountRate'
  | 'repurchaseAmount'
  | 'repurchaseDealCount'
  | 'repurchaseCustomerCount'
  | 'repurchaseDealCountRate'
  | 'repurchaseCustomerRate'
  | 'repurchaseAmountRate'
  | 'newCustomerConversionRate'
  | 'newCustomerAmountContributionRate'
  | 'historicalRepurchaseCustomerContributionRate'
  | 'historicalRepurchaseAmountContributionRate';

export type MetricValue = Record<MetricKey, number>;

type MetricFormat = 'amount' | 'integer' | 'percent';

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
};

export type MetricGroup = {
  title: string;
  metrics: MetricDefinition[];
};

export const metricGroups: MetricGroup[] = [
  {
    title: '业绩总览',
    metrics: [
      { key: 'reportedAmount', label: '上报业绩', format: 'amount' },
      { key: 'confirmedAmount', label: '确认业绩', format: 'amount' },
    ],
  },
  {
    title: '成交概况',
    metrics: [
      { key: 'dealCount', label: '成交单量', format: 'integer' },
      { key: 'customerCount', label: '成交客户数', format: 'integer' },
      { key: 'averageDealAmount', label: '客单价', format: 'amount' },
    ],
  },
  {
    title: '新诊成交',
    metrics: [
      { key: 'newDiagnosisAmount', label: '新诊业绩', format: 'amount' },
      { key: 'newDiagnosisAmountRate', label: '新诊业绩占比', format: 'percent' },
      { key: 'newDiagnosisDealCount', label: '新诊单量', format: 'integer' },
      { key: 'newDiagnosisDealCountRate', label: '新诊单量占比', format: 'percent' },
      { key: 'newDiagnosisCustomerCount', label: '新诊客户数', format: 'integer' },
      { key: 'newDiagnosisCustomerRate', label: '新诊客户占比', format: 'percent' },
    ],
  },
  {
    title: '复购成交',
    metrics: [
      { key: 'repurchaseAmount', label: '复购业绩', format: 'amount' },
      { key: 'repurchaseAmountRate', label: '复购业绩占比', format: 'percent' },
      { key: 'repurchaseDealCount', label: '复购单量', format: 'integer' },
      { key: 'repurchaseDealCountRate', label: '复购单量占比', format: 'percent' },
      { key: 'repurchaseCustomerCount', label: '复购客户数', format: 'integer' },
      { key: 'repurchaseCustomerRate', label: '复购客户占比', format: 'percent' },
    ],
  },
  {
    title: '新客转化',
    metrics: [
      { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent' },
      { key: 'newCustomerAmountContributionRate', label: '新客业绩贡献占比', format: 'percent' },
    ],
  },
  {
    title: '历史复购贡献',
    metrics: [
      {
        key: 'historicalRepurchaseCustomerContributionRate',
        label: '历史复购客户当期贡献率',
        format: 'percent',
      },
      {
        key: 'historicalRepurchaseAmountContributionRate',
        label: '历史复购业绩当期贡献率',
        format: 'percent',
      },
    ],
  },
];

export function formatAmount(value: number) {
  return `${(value / 10000).toFixed(1)}万`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMetricValue(value: number, format: MetricFormat) {
  if (format === 'amount') {
    return formatAmount(value);
  }

  if (format === 'percent') {
    return formatPercent(value);
  }

  return value;
}

export function buildMetricColumns<T extends MetricValue>(): ColumnsType<T> {
  return metricGroups.map((group) => ({
    title: group.title,
    children: group.metrics.map((metric) => ({
      title: metric.label,
      dataIndex: metric.key,
      key: metric.key,
      align: 'right' as const,
      width: metric.format === 'percent' ? 140 : 120,
      sorter: (left: T, right: T) => left[metric.key] - right[metric.key],
      render: (value: number) => formatMetricValue(value, metric.format),
    })),
  }));
}
