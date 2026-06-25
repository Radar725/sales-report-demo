import { Button, Table } from 'antd';
import { useMemo } from 'react';
import { ActionsColumnTitle } from './ActionsColumnTitle';
import { useTableColumnSettings } from './TableColumnSettings';
import type { FunnelSummaryRow } from '../domain/funnel';
import { buildFunnelMetricColumns, getFunnelMetricSettingCatalog } from '../domain/funnelMetrics';

type FunnelTableProps = {
  primaryDimension: { key: string; label: string };
  rows: FunnelSummaryRow[];
  hasComparison: boolean;
  onOpenBreakdown: (row: FunnelSummaryRow) => void;
};

export function FunnelTable({
  primaryDimension,
  rows,
  hasComparison,
  onOpenBreakdown,
}: FunnelTableProps) {
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
      ...buildFunnelMetricColumns<FunnelSummaryRow>(hasComparison),
      {
        title: <ActionsColumnTitle onCustomizeClick={() => undefined} />,
        key: 'actions',
        fixed: 'right' as const,
        width: 100,
        disabledSetting: true,
        onCell: () => ({ style: { textAlign: 'center' as const } }),
        render: (_: unknown, row: FunnelSummaryRow) => (
          <Button
            type="link"
            disabled={primaryDimension.key === 'total'}
            onClick={() => onOpenBreakdown(row)}
          >
            维度拆解
          </Button>
        ),
      },
    ],
    [hasComparison, onOpenBreakdown, primaryDimension.key, primaryDimension.label],
  );

  const settingCatalog = useMemo(() => getFunnelMetricSettingCatalog(), []);

  const { columns, tableSize, scroll, openSettings, settingsModal } = useTableColumnSettings(
    'SALES_REPORT_FUNNEL',
    baseColumns,
    {
      scroll: { x: 1800 },
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
