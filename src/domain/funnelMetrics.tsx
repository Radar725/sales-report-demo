import type { ColumnsType } from 'antd/es/table';
import type { FunnelMetricKey } from './funnel';
import { formatMetricValue, formatPercent } from './metrics';

type ComparableRecord = {
  comparison?: Partial<Record<FunnelMetricKey, number | null>> | null;
};

type FunnelMetricDef = {
  key: FunnelMetricKey;
  label: string;
  format: 'integer' | 'percent';
  width: number;
};

const funnelMetrics: FunnelMetricDef[] = [
  { key: 'recordedCustomerCount', label: '录单客户数', format: 'integer', width: 120 },
  { key: 'validCustomerCount', label: '有效客户数', format: 'integer', width: 120 },
  { key: 'addedWechatCustomerCount', label: '已加微客户数', format: 'integer', width: 132 },
  { key: 'dispatchedCustomerCount', label: '已派单客户数', format: 'integer', width: 132 },
  { key: 'invitedCustomerCount', label: '已邀约客户数', format: 'integer', width: 132 },
  { key: 'visitedCustomerCount', label: '已到院客户数', format: 'integer', width: 132 },
  { key: 'convertedCustomerCount', label: '已成交客户数', format: 'integer', width: 132 },
  { key: 'repurchasedCustomerCount', label: '已复购客户数', format: 'integer', width: 132 },
  { key: 'validCustomerRate', label: '有效客户率', format: 'percent', width: 112 },
  { key: 'addedWechatRate', label: '加微率', format: 'percent', width: 104 },
  { key: 'dispatchRate', label: '派单率', format: 'percent', width: 104 },
  { key: 'invitationRate', label: '邀约率', format: 'percent', width: 104 },
  { key: 'visitRate', label: '到院率', format: 'percent', width: 104 },
  { key: 'conversionRate', label: '成交率', format: 'percent', width: 104 },
  { key: 'repurchaseRate', label: '复购率', format: 'percent', width: 104 },
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
>(hasComparison = false): ColumnsType<T> {
  return funnelMetrics.map((metric) => ({
    title: metric.label,
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
