import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FunnelSummaryRow } from '../domain/funnel';
import { buildFunnelMetricColumns } from '../domain/funnelMetrics';

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
  const columns: ColumnsType<FunnelSummaryRow> = [
    {
      title: primaryDimension.label,
      dataIndex: 'primaryDimensionValue',
      key: 'primaryDimensionValue',
      fixed: 'left',
      width: 140,
    },
    ...buildFunnelMetricColumns<FunnelSummaryRow>(hasComparison),
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 100,
      onCell: () => ({ style: { textAlign: 'center' } }),
      render: (_, row) => (
        <Button
          type="link"
          disabled={primaryDimension.key === 'total'}
          onClick={() => onOpenBreakdown(row)}
        >
          维度拆解
        </Button>
      ),
    },
  ];

  return (
    <Table
      className="report-table"
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      bordered
      scroll={{ x: 1800 }}
    />
  );
}
