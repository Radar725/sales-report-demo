import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { ReportSummaryRow } from '../domain/analytics';
import { buildReportMetricColumns } from '../domain/reportMetrics';

type SummaryTableProps = {
  primaryDimension: Dimension;
  rows: ReportSummaryRow[];
  showContributionRates: boolean;
  showNewCustomerMetrics: boolean;
  onOpenBreakdown: (row: ReportSummaryRow) => void;
  onOpenDetails: (row: ReportSummaryRow) => void;
};

export default function SummaryTable({
  primaryDimension,
  rows,
  showContributionRates,
  showNewCustomerMetrics,
  onOpenBreakdown,
  onOpenDetails,
}: SummaryTableProps) {
  const columns: ColumnsType<ReportSummaryRow> = [
    {
      title: primaryDimension.label,
      dataIndex: 'primaryDimensionValue',
      key: 'primaryDimensionValue',
      fixed: 'left',
      width: 50,
    },
    ...buildReportMetricColumns<ReportSummaryRow>({
      showContributionRates,
      showNewCustomerMetrics,
    }),
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 60,
      render: (_, row) => (
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
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      bordered
      scroll={{ x: 800 }}
    />
  );
}
