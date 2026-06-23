import type { ColumnsType } from 'antd/es/table';
import { MetricColumnTitle } from '../components/MetricColumnTitle';
import type { FunnelMetricKey } from './funnel';
import { formatMetricValue, formatPercent } from './metrics';

type ComparableRecord = {
  comparison?: Partial<Record<FunnelMetricKey, number | null>> | null;
};

type FunnelMetricDef = {
  key: FunnelMetricKey;
  label: string;
  description: string;
  format: 'integer' | 'percent';
  width: number;
};

const funnelMetrics: FunnelMetricDef[] = [
  { key: 'recordedCustomerCount', label: '录单客户数', description: '录单时间落在统计期内的去重客户数，包含有效和无效客户。', format: 'integer', width: 120 },
  { key: 'validCustomerCount', label: '有效客户数', description: '录单客户中被标记为有效的去重客户数。', format: 'integer', width: 120 },
  { key: 'addedWechatCustomerCount', label: '已加微客户数', description: '有效客户中，当前已完成加微及后续阶段的客户数。', format: 'integer', width: 132 },
  { key: 'dispatchedCustomerCount', label: '已派单客户数', description: '有效客户中，当前已完成派单及后续阶段的客户数。', format: 'integer', width: 132 },
  { key: 'invitedCustomerCount', label: '已邀约客户数', description: '有效客户中，当前已完成邀约及后续阶段的客户数。', format: 'integer', width: 132 },
  { key: 'visitedCustomerCount', label: '已到院客户数', description: '有效客户中，当前已到院及后续阶段的客户数。', format: 'integer', width: 132 },
  { key: 'convertedCustomerCount', label: '已成交客户数', description: '有效客户中，当前已成交及后续阶段的客户数。', format: 'integer', width: 132 },
  { key: 'repurchasedCustomerCount', label: '已复购客户数', description: '有效客户中，当前已进入持续复购的客户数。', format: 'integer', width: 132 },
  { key: 'validCustomerRate', label: '有效客户率', description: '有效客户数占录单客户数的比例，反映录单质量。', format: 'percent', width: 112 },
  { key: 'addedWechatRate', label: '加微率', description: '已加微客户数占有效客户数的比例。', format: 'percent', width: 104 },
  { key: 'dispatchRate', label: '派单率', description: '已派单客户数占有效客户数的比例。', format: 'percent', width: 104 },
  { key: 'invitationRate', label: '邀约率', description: '已邀约客户数占有效客户数的比例。', format: 'percent', width: 104 },
  { key: 'visitRate', label: '到院率', description: '已到院客户数占有效客户数的比例。', format: 'percent', width: 104 },
  { key: 'conversionRate', label: '成交率', description: '已成交客户数占有效客户数的比例。', format: 'percent', width: 104 },
  { key: 'repurchaseRate', label: '复购率', description: '已复购客户数占有效客户数的比例。', format: 'percent', width: 104 },
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
    title: <MetricColumnTitle label={metric.label} description={metric.description} />,
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
