import type { ColumnsType } from 'antd/es/table';
import { formatMetricValue } from './metrics';

export type FunnelColumnFilters = {
  customerScope: 'all' | 'currentNewCustomers' | 'existingCustomers';
  customerType: 'all' | 'valid' | 'invalid';
};

const scopeLabel: Record<FunnelColumnFilters['customerScope'], string> = {
  all: '',
  currentNewCustomers: '新客',
  existingCustomers: '老客',
};

function prefix(filters: FunnelColumnFilters) {
  return scopeLabel[filters.customerScope];
}

type FunnelMetricDef = {
  key: string;
  label: string;
  format: 'integer' | 'percent';
  width: number;
};

const funnelMetrics: FunnelMetricDef[] = [
  { key: 'customerCount', label: '客户数', format: 'integer', width: 104 },
  { key: 'dispatchedCustomerCount', label: '派单客户数', format: 'integer', width: 120 },
  { key: 'invitedCustomerCount', label: '邀约客户数', format: 'integer', width: 120 },
  { key: 'visitedCustomerCount', label: '到院客户数', format: 'integer', width: 120 },
  { key: 'convertedCustomerCount', label: '成交客户数', format: 'integer', width: 120 },
  { key: 'dispatchRate', label: '派单率', format: 'percent', width: 104 },
  { key: 'invitationRate', label: '邀约率', format: 'percent', width: 104 },
  { key: 'visitRate', label: '到院率', format: 'percent', width: 104 },
  { key: 'conversionRate', label: '成交率', format: 'percent', width: 104 },
  { key: 'dispatchInvitationRate', label: '派单邀约率', format: 'percent', width: 120 },
  { key: 'inviteVisitRate', label: '邀约到院率', format: 'percent', width: 120 },
  { key: 'visitConversionRate', label: '到院成交率', format: 'percent', width: 120 },
];

export function buildFunnelMetricColumns<T extends Record<string, unknown>>(
  filters: FunnelColumnFilters,
): ColumnsType<T> {
  const p = prefix(filters);
  return funnelMetrics.map((metric) => ({
    title: `${p}${metric.label}`,
    dataIndex: metric.key,
    key: metric.key,
    align: 'right' as const,
    width: metric.width,
    sorter: (left: T, right: T) =>
      ((left[metric.key] as number) ?? 0) - ((right[metric.key] as number) ?? 0),
    render: (value: number | null) =>
      value === null ? '—' : formatMetricValue(value, metric.format),
  }));
}
