import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { SummaryRow } from '../domain/analytics';
import { buildMetricColumns } from '../domain/metrics';

type SummaryTableProps = {
  primaryDimension: Dimension;
  rows: SummaryRow[];
  onOpenBreakdown: (row: SummaryRow) => void;
  onOpenDetails: (row: SummaryRow) => void;
};

export default function SummaryTable({
  primaryDimension,
  rows,
  onOpenBreakdown,
  onOpenDetails,
}: SummaryTableProps) {
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
      width: 176,
      render: (_, row) => (
        <Space size={4}>
          <Button type="link" style={{ paddingInline: 4 }} onClick={() => onOpenBreakdown(row)}>
            业绩拆解
          </Button>
          <Button type="link" style={{ paddingInline: 4 }} onClick={() => onOpenDetails(row)}>
            业绩明细
          </Button>
        </Space>
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
