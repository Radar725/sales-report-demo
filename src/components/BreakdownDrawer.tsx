import { Button, Drawer, Space, Table, Tabs } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { DealRecord } from '../data/mockDeals';
import {
  attachReportComparison,
  buildReportBreakdownRows,
  getBreakdownDetailRecords,
  type ReportBreakdownRow,
  type ReportSummaryRow,
} from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions } from '../domain/dimensions';
import { buildReportMetricColumns, type ReportColumnFilters } from '../domain/reportMetrics';
import { detailColumns } from './detailColumns';

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
              const columns: ColumnsType<ReportBreakdownRow> = [
                {
                  title: breakdownDimension.label,
                  dataIndex: 'breakdownDimensionValue',
                  key: 'breakdownDimensionValue',
                  fixed: 'left',
                  width: 140,
                },
                ...buildReportMetricColumns<ReportBreakdownRow>(filters, hasComparison),
                {
                  title: '操作',
                  key: 'actions',
                  fixed: 'right',
                  width: 100,
                  render: (_, breakdownRow) => (
                    <Button
                      type="link"
                      style={{ paddingInline: 4 }}
                      onClick={() => {
                        setDetailRecords(
                          getBreakdownDetailRecords(records, {
                            primaryDimension,
                            primaryDimensionValue: row.primaryDimensionValue,
                            breakdownDimension: breakdownDimension.key,
                            breakdownDimensionValue: breakdownRow.breakdownDimensionValue,
                          }),
                        );
                        setDetailTitle(`${breakdownRow.breakdownDimensionValue} · 业绩明细`);
                        setDetailOpen(true);
                      }}
                    >
                      业绩明细
                    </Button>
                  ),
                },
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
                      scroll={{ x: 1060 }}
                      showSorterTooltip={{ target: 'sorter-icon' }}
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
