import { Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import {
  attachFunnelComparison,
  buildFunnelBreakdownRows,
  getFunnelBreakdownDimensions,
  type FunnelBreakdownRow,
  type FunnelDimensionKey,
  type FunnelSummaryRow,
} from '../domain/funnel';
import {
  buildFunnelMetricColumns,
  type FunnelColumnFilters,
} from '../domain/funnelMetrics';

type FunnelBreakdownDrawerProps = {
  open: boolean;
  records: FunnelCustomerRecord[];
  dateRange: [string, string];
  comparisonRecords: FunnelCustomerRecord[];
  comparisonDateRange: [string, string] | null;
  primaryDimension: { key: FunnelDimensionKey; label: string };
  row: FunnelSummaryRow | null;
  filters: FunnelColumnFilters;
  onClose: () => void;
};

export default function FunnelBreakdownDrawer({
  open,
  records,
  dateRange,
  comparisonRecords,
  comparisonDateRange,
  primaryDimension,
  row,
  filters,
  onClose,
}: FunnelBreakdownDrawerProps) {
  const breakdownDimensions = getFunnelBreakdownDimensions(primaryDimension.key);
  const hasComparison = comparisonDateRange !== null;

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 转化漏斗拆解` : '转化漏斗拆解'}
      width={1400}
      open={open}
      onClose={onClose}
    >
      {row ? (
        <Tabs
          items={breakdownDimensions.map((breakdownDimension) => {
            const query = {
              primaryDimension: primaryDimension.key,
              primaryDimensionValue: row.primaryDimensionValue,
              breakdownDimension: breakdownDimension.key as FunnelDimensionKey,
            };
            const currentRows = buildFunnelBreakdownRows(records, dateRange, query);
            const dataSource =
              hasComparison && comparisonDateRange
                ? attachFunnelComparison(
                    currentRows,
                    buildFunnelBreakdownRows(comparisonRecords, comparisonDateRange, query),
                    dateRange,
                    comparisonDateRange,
                    'breakdownDimensionValue',
                  )
                : currentRows;

            const columns: ColumnsType<FunnelBreakdownRow> = [
              {
                title: breakdownDimension.label,
                dataIndex: 'breakdownDimensionValue',
                key: 'breakdownDimensionValue',
                fixed: 'left',
                width: 140,
              },
              ...buildFunnelMetricColumns<FunnelBreakdownRow>(filters, hasComparison),
            ];

            return {
              key: breakdownDimension.key,
              label: breakdownDimension.label,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Table
                    className="report-table"
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    bordered
                    scroll={{ x: 1500 }}
                  />
                </Space>
              ),
            };
          })}
        />
      ) : null}
    </Drawer>
  );
}
