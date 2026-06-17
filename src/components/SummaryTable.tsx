import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { SummaryRow } from '../domain/analytics';
import { buildMetricColumns } from '../domain/metrics';

type SummaryTableProps = {
  primaryDimension: Dimension;
  rows: SummaryRow[];
  onOpenBreakdown: (row: SummaryRow) => void;
};

export default function SummaryTable({ primaryDimension, rows, onOpenBreakdown }: SummaryTableProps) {
  const columns: ColumnsType<SummaryRow> = [
    {
      title: primaryDimension.label,
      dataIndex: 'primaryDimensionValue',
      key: 'primaryDimensionValue',
      fixed: 'left',
      width: 120,
    },
    ...buildMetricColumns<SummaryRow>(),
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenBreakdown(row)}>
          业绩拆解
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      bordered
      scroll={{ x: 2800 }}
    />
  );
}
