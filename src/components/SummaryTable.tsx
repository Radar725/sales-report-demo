import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { SummaryRow } from '../domain/analytics';
import { formatAmount } from '../domain/metrics';

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
    },
    {
      title: '成交客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      align: 'right',
      sorter: (left, right) => left.customerCount - right.customerCount,
    },
    {
      title: '成交总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      sorter: (left, right) => left.totalAmount - right.totalAmount,
      render: (value: number) => formatAmount(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenBreakdown(row)}>
          查看拆解
        </Button>
      ),
    },
  ];

  return <Table rowKey="key" columns={columns} dataSource={rows} pagination={false} />;
}
