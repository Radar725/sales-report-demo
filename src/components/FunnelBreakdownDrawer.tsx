import { Drawer, Space, Table, Tabs } from 'antd';
import { useMemo } from 'react';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import {
  attachFunnelComparison,
  buildFunnelBreakdownRows,
  getFunnelBreakdownDimensions,
  type FunnelBreakdownRow,
  type FunnelDimensionKey,
  type FunnelSummaryRow,
} from '../domain/funnel';
import { buildFunnelMetricColumns } from '../domain/funnelMetrics';
import { useAppliedTableColumnSettings } from './TableColumnSettings';

type FunnelBreakdownTabTableProps = {
  breakdownDimension: { key: string; label: string };
  hasComparison: boolean;
  dataSource: FunnelBreakdownRow[];
};

function FunnelBreakdownTabTable({
  breakdownDimension,
  hasComparison,
  dataSource,
}: FunnelBreakdownTabTableProps) {
  const baseColumns = useMemo(
    () => [
      {
        title: breakdownDimension.label,
        dataIndex: 'breakdownDimensionValue',
        key: 'breakdownDimensionValue',
        fixed: 'left' as const,
        width: 140,
        disabledSetting: true,
      },
      ...buildFunnelMetricColumns<FunnelBreakdownRow>(hasComparison),
    ],
    [breakdownDimension.label, hasComparison],
  );

  const { columns, tableSize, scroll } = useAppliedTableColumnSettings(
    'SALES_REPORT_FUNNEL',
    baseColumns,
    { scroll: { x: 1500 } },
  );

  return (
    <Table
      className="report-table"
      rowKey="key"
      columns={columns}
      dataSource={dataSource}
      pagination={false}
      bordered
      size={tableSize}
      scroll={scroll}
      showSorterTooltip={{ target: 'sorter-icon' }}
    />
  );
}

type FunnelBreakdownDrawerProps = {
  open: boolean;
  records: FunnelCustomerRecord[];
  comparisonRecords: FunnelCustomerRecord[];
  hasComparison: boolean;
  primaryDimension: { key: FunnelDimensionKey; label: string };
  row: FunnelSummaryRow | null;
  onClose: () => void;
};

export default function FunnelBreakdownDrawer({
  open,
  records,
  comparisonRecords,
  hasComparison,
  primaryDimension,
  row,
  onClose,
}: FunnelBreakdownDrawerProps) {
  const breakdownDimensions = getFunnelBreakdownDimensions(primaryDimension.key);

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
            const currentRows = buildFunnelBreakdownRows(records, query);
            const dataSource = hasComparison
              ? attachFunnelComparison(
                  currentRows,
                  buildFunnelBreakdownRows(comparisonRecords, query),
                  ['', ''],
                  ['', ''],
                  'breakdownDimensionValue',
                )
              : currentRows;

            return {
              key: breakdownDimension.key,
              label: breakdownDimension.label,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <FunnelBreakdownTabTable
                    breakdownDimension={breakdownDimension}
                    hasComparison={hasComparison}
                    dataSource={dataSource}
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
