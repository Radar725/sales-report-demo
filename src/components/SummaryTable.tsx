import { Button, Space, Table } from 'antd';
import { useMemo } from 'react';
import { ActionsColumnTitle } from './ActionsColumnTitle';
import { useTableColumnSettings } from './TableColumnSettings';
import type { Dimension } from '../domain/dimensions';
import type { ReportSummaryRow } from '../domain/analytics';
import { buildReportMetricColumns, getPerformanceReportSettingCatalog, type ReportColumnFilters } from '../domain/reportMetrics';

type SummaryTableProps = {
  primaryDimension: Dimension;
  rows: ReportSummaryRow[];
  filters: ReportColumnFilters;
  hasComparison: boolean;
  onOpenBreakdown: (row: ReportSummaryRow) => void;
  onOpenDetails: (row: ReportSummaryRow) => void;
};

export default function SummaryTable({
  primaryDimension,
  rows,
  filters,
  hasComparison,
  onOpenBreakdown,
  onOpenDetails,
}: SummaryTableProps) {
  const baseColumns = useMemo(
    () => [
      {
        title: primaryDimension.label,
        dataIndex: 'primaryDimensionValue',
        key: 'primaryDimensionValue',
        fixed: 'left' as const,
        width: 140,
        disabledSetting: true,
      },
      ...buildReportMetricColumns<ReportSummaryRow>(filters, hasComparison),
      {
        title: <ActionsColumnTitle onCustomizeClick={() => undefined} />,
        key: 'actions',
        fixed: 'right' as const,
        width: 152,
        disabledSetting: true,
        render: (_: unknown, row: ReportSummaryRow) => (
          <Space size={4}>
            <Button
              type="link"
              style={{ paddingInline: 4 }}
              disabled={primaryDimension.key === 'total'}
              onClick={() => onOpenBreakdown(row)}
            >
              业绩拆解
            </Button>
            <Button type="link" style={{ paddingInline: 4 }} onClick={() => onOpenDetails(row)}>
              业绩明细
            </Button>
          </Space>
        ),
      },
    ],
    [filters, hasComparison, onOpenBreakdown, onOpenDetails, primaryDimension.key, primaryDimension.label],
  );

  const settingCatalog = useMemo(() => getPerformanceReportSettingCatalog(), []);

  const { columns, tableSize, scroll, openSettings, settingsModal } = useTableColumnSettings(
    'SALES_REPORT_SUMMARY',
    baseColumns,
    {
      scroll: { x: 1112 },
      settingCatalog,
    },
  );

  const columnsWithSettingsAction = useMemo(
    () =>
      columns.map((column) => {
        if (column.key !== 'actions') {
          return column;
        }
        return {
          ...column,
          title: <ActionsColumnTitle onCustomizeClick={openSettings} />,
        };
      }),
    [columns, openSettings],
  );

  return (
    <>
      <Table
        className="report-table"
        rowKey="key"
        columns={columnsWithSettingsAction}
        dataSource={rows}
        pagination={false}
        bordered
        size={tableSize}
        scroll={scroll}
        showSorterTooltip={{ target: 'sorter-icon' }}
      />
      {settingsModal}
    </>
  );
}
