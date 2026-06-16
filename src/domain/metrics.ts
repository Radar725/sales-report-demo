export type MetricKey = 'customerCount' | 'totalAmount';

export const metrics: { key: MetricKey; label: string }[] = [
  { key: 'customerCount', label: '成交客户数' },
  { key: 'totalAmount', label: '成交总金额' },
];

export function formatAmount(value: number) {
  return `${(value / 10000).toFixed(1)}万`;
}
