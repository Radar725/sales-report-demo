import type { ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';
import { Popover } from 'antd';

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
  description?: ReactNode;
};

export type MetricGroup = {
  title: string;
  metrics: MetricDefinition[];
};

export const metricGroups: MetricGroup[] = [
  {
    title: '业绩总览',
    metrics: [
      { key: 'reportedAmount', label: '上报业绩', format: 'amount',
        description: '统计周期内所有成交记录的上报金额总和（排除定金）' },
      { key: 'confirmedAmount', label: '确认业绩', format: 'amount',
        description: '统计周期内所有成交记录的确认金额总和（排除定金）' },
    ],
  },
  {
    title: '成交概况',
    metrics: [
      { key: 'dealCount', label: '成交单量', format: 'integer',
        description: '统计周期内成交记录总数（排除定金）' },
      { key: 'customerCount', label: '成交客户数', format: 'integer',
        description: '统计周期内成交去重客户数（排除定金）' },
      { key: 'averageDealAmount', label: '客单价', format: 'amount',
        description: '计算公式：上报业绩 ÷ 成交单量' },
    ],
  },
  {
    title: '新诊成交',
    metrics: [
      { key: 'newDiagnosisAmount', label: '新诊业绩', format: 'amount',
        description: '统计周期内成交类型为「新诊」的上报金额总和（排除定金）' },
      { key: 'newDiagnosisAmountRate', label: '新诊业绩占比', format: 'percent',
        description: '计算公式：新诊业绩 ÷ 上报业绩' },
      { key: 'newDiagnosisDealCount', label: '新诊单量', format: 'integer',
        description: '统计周期内成交类型为「新诊」的成交记录数（排除定金）' },
      { key: 'newDiagnosisDealCountRate', label: '新诊单量占比', format: 'percent',
        description: '计算公式：新诊单量 ÷ 成交单量' },
      { key: 'newDiagnosisCustomerCount', label: '新诊客户数', format: 'integer',
        description: '统计周期内成交类型为「新诊」的去重客户数（排除定金）' },
      { key: 'newDiagnosisCustomerRate', label: '新诊客户占比', format: 'percent',
        description: '计算公式：新诊客户数 ÷ 成交客户数' },
    ],
  },
  {
    title: '复购成交',
    metrics: [
      { key: 'repurchaseAmount', label: '复购业绩', format: 'amount',
        description: '统计周期内成交类型为「复购」的上报金额总和（排除定金）' },
      { key: 'repurchaseAmountRate', label: '复购业绩占比', format: 'percent',
        description: '计算公式：复购业绩 ÷ 上报业绩' },
      { key: 'repurchaseDealCount', label: '复购单量', format: 'integer',
        description: '统计周期内成交类型为「复购」的成交记录数（排除定金）' },
      { key: 'repurchaseDealCountRate', label: '复购单量占比', format: 'percent',
        description: '计算公式：复购单量 ÷ 成交单量' },
      { key: 'repurchaseCustomerCount', label: '复购客户数', format: 'integer',
        description: '统计周期内成交类型为「复购」的去重客户数（排除定金）' },
      { key: 'repurchaseCustomerRate', label: '复购客户占比', format: 'percent',
        description: '计算公式：复购客户数 ÷ 成交客户数' },
    ],
  },
  {
    title: '新客转化',
    metrics: [
      { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent',
        description: '计算公式：本期成交新客数量 ÷ 本期新客数量' },
      { key: 'newCustomerAmountContributionRate', label: '新客业绩贡献占比', format: 'percent',
        description: '计算公式：本期新客户业绩 ÷ 上报业绩' },
    ],
  },
  {
    title: '历史复购贡献',
    metrics: [
      {
        key: 'historicalRepurchaseCustomerContributionRate',
        label: '历史复购客户当期贡献率',
        format: 'percent',
        description: '计算公式：复购客户数 ÷ 历史复购客户总数',
      },
      {
        key: 'historicalRepurchaseAmountContributionRate',
        label: '历史复购业绩当期贡献率',
        format: 'percent',
        description: '计算公式：复购业绩 ÷ 历史复购总业绩',
      },
    ],
  },
];

export function formatAmount(value: number) {
  return `¥${value}`;
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
      title: metric.description ? (
        <span style={{ whiteSpace: 'nowrap' }}>
          {metric.label}
          <Popover content={metric.description}>
            <span
              style={{
                marginLeft: 4,
                color: '#999',
                cursor: 'help',
                border: '1px solid #999',
                borderRadius: '50%',
                width: 14,
                height: 14,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                lineHeight: 1,
              }}
            >
              ?
            </span>
          </Popover>
        </span>
      ) : (
        metric.label
      ),
      dataIndex: metric.key,
      key: metric.key,
      align: 'right' as const,
      width: metric.format === 'percent' ? 140 : 120,
      sorter: (left: T, right: T) => left[metric.key] - right[metric.key],
      render: (value: number) => formatMetricValue(value, metric.format),
    })),
  }));
}
