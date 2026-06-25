import { Button, Drawer, Space, Table, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import type { DealRecord } from '../data/mockDeals';
import {
  attachReportComparison,
  buildReportBreakdownRows,
  getBreakdownDetailRecords,
  type ReportBreakdownRow,
  type ReportSummaryRow,
} from '../domain/analytics';
import { type Dimension, type DimensionKey, getBreakdownDimensions } from '../domain/dimensions';
import { buildReportMetricColumns, type ReportColumnFilters } from '../domain/reportMetrics';
import { useAppliedTableColumnSettings } from './TableColumnSettings';
import { detailColumns } from './detailColumns';

type BreakdownTabTableProps = {
  breakdownDimension: Dimension;
  filters: ReportColumnFilters;
  hasComparison: boolean;
  dataSource: ReportBreakdownRow[];
  onOpenDetails: (breakdownRow: ReportBreakdownRow) => void;
};

function BreakdownTabTable({
  breakdownDimension,
  filters,
  hasComparison,
  dataSource,
  onOpenDetails,
}: BreakdownTabTableProps) {
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
      ...buildReportMetricColumns<ReportBreakdownRow>(filters, hasComparison),
      {
        title: '操作',
        key: 'actions',
        fixed: 'right' as const,
        width: 100,
        disabledSetting: true,
        render: (_: unknown, breakdownRow: ReportBreakdownRow) => (
          <Button
            type="link"
            style={{ paddingInline: 4 }}
            onClick={() => onOpenDetails(breakdownRow)}
          >
            业绩明细
          </Button>
        ),
      },
    ],
    [breakdownDimension.label, filters, hasComparison, onOpenDetails],
  );

  const { columns, tableSize, scroll } = useAppliedTableColumnSettings(
    'SALES_REPORT_SUMMARY',
    baseColumns,
    { scroll: { x: 1060 } },
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

type BreakdownDrawerProps = {
  open: boolean;
  records: DealRecord[];
  baselineRecords: DealRecord[];
  historicalRepurchaseRecords: DealRecord[];
  dateRange: [string, string] | null;
  comparisonRecords: DealRecord[];
  comparisonBaselineRecords: DealRecord[];
  comparisonHistoricalRepurchaseRecords: DealRecord[];
  comparisonDateRange: [string, string] | null;
  primaryDimension: DimensionKey;
  row: ReportSummaryRow | null;
  filters: ReportColumnFilters;
  onClose: () => void;
};

export default function BreakdownDrawer({
  open,
  records,
  baselineRecords,
  historicalRepurchaseRecords,
  dateRange,
  comparisonRecords,
  comparisonBaselineRecords,
  comparisonHistoricalRepurchaseRecords,
  comparisonDateRange,
  primaryDimension,
  row,
  filters,
  onClose,
}: BreakdownDrawerProps) {
  const breakdownDimensions = getBreakdownDimensions(primaryDimension);
  const hasComparison = comparisonDateRange !== null;
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailRecords, setDetailRecords] = useState<DealRecord[]>([]);

  const handleOpenDetails = (breakdownDimensionKey: DimensionKey, breakdownRow: ReportBreakdownRow) => {
    if (!row) {
      return;
    }
    setDetailRecords(
      getBreakdownDetailRecords(records, {
        primaryDimension,
        primaryDimensionValue: row.primaryDimensionValue,
        breakdownDimension: breakdownDimensionKey,
        breakdownDimensionValue: breakdownRow.breakdownDimensionValue,
      }),
    );
    setDetailTitle(`${breakdownRow.breakdownDimensionValue} · 业绩明细`);
    setDetailOpen(true);
  };

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 业绩拆解` : '业绩拆解'}
      width={1400}
      open={open}
      onClose={onClose}
    >
      {row ? (
        <>
          <Tabs
            items={breakdownDimensions.map((breakdownDimension) => {
              const currentRows = buildReportBreakdownRows(records, baselineRecords, historicalRepurchaseRecords, {
                primaryDimension,
                primaryDimensionValue: row.primaryDimensionValue,
                breakdownDimension: breakdownDimension.key,
              });
              const dataSource =
                hasComparison && comparisonDateRange && dateRange
                  ? attachReportComparison(
                      currentRows,
                      buildReportBreakdownRows(
                        comparisonRecords,
                        comparisonBaselineRecords,
                        comparisonHistoricalRepurchaseRecords,
                        {
                          primaryDimension,
                          primaryDimensionValue: row.primaryDimensionValue,
                          breakdownDimension: breakdownDimension.key,
                        },
                      ),
                      dateRange,
                      comparisonDateRange,
                      'breakdownDimensionValue',
                    )
                  : currentRows;

              return {
                key: breakdownDimension.key,
                label: breakdownDimension.label,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <BreakdownTabTable
                      breakdownDimension={breakdownDimension}
                      filters={filters}
                      hasComparison={hasComparison}
                      dataSource={dataSource}
                      onOpenDetails={(breakdownRow) =>
                        handleOpenDetails(breakdownDimension.key, breakdownRow)
                      }
                    />
                  </Space>
                ),
              };
            })}
          />
          <Drawer
            title={detailTitle}
            width={1400}
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
          >
            <Table
              rowKey="id"
              columns={detailColumns}
              dataSource={detailRecords}
              pagination={false}
              bordered
              scroll={{ x: 1790 }}
            />
          </Drawer>
        </>
      ) : null}
    </Drawer>
  );
}
