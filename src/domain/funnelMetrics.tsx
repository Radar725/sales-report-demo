import type { ColumnsType } from 'antd/es/table';
import { formatMetricValue, formatPercent } from './metrics';

export type FunnelColumnFilters = {
  customerScope: 'all' | 'currentNewCustomers' | 'existingCustomers';
  customerType: 'all' | 'valid' | 'invalid';
};

export type FunnelMetricKey =
  | 'customerCount'
  | 'dispatchedCustomerCount'
  | 'invitedCustomerCount'
  | 'visitedCustomerCount'
  | 'convertedCustomerCount'
  | 'dispatchRate'
  | 'invitationRate'
  | 'visitRate'
  | 'conversionRate'
  | 'dispatchInvitationRate'
  | 'inviteVisitRate'
  | 'visitConversionRate';

const scopeLabel: Record<FunnelColumnFilters['customerScope'], string> = {
  all: '',
  currentNewCustomers: '新客',
  existingCustomers: '老客',
};

function prefix(filters: FunnelColumnFilters) {
  return scopeLabel[filters.customerScope];
}

type FunnelMetricDef = {
  key: FunnelMetricKey;
  label: string;
  format: 'integer' | 'percent';
  width: number;
};

type ComparableRecord = {
  comparison?: Partial<Record<FunnelMetricKey, number | null>> | null;
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

function renderMetricCell(
  value: number | null,
  metric: FunnelMetricDef,
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

export function buildFunnelMetricColumns<
  T extends Record<string, unknown> & ComparableRecord,
>(filters: FunnelColumnFilters, hasComparison = false): ColumnsType<T> {
  const p = prefix(filters);
  return funnelMetrics.map((metric) => ({
    title: `${p}${metric.label}`,
    dataIndex: metric.key,
    key: metric.key,
    align: 'right' as const,
    width: metric.width,
    sorter: (left: T, right: T) =>
      ((left[metric.key] as number) ?? 0) - ((right[metric.key] as number) ?? 0),
    render: (value: number | null, record: T) =>
      renderMetricCell(value, metric, record, hasComparison),
  }));
}
