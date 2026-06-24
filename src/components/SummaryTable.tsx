import { Button, Space, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState } from 'react';
import { ActionsColumnTitle } from './ActionsColumnTitle';
import TableCustomizeHintModal from './TableCustomizeHintModal';
import type { Dimension } from '../domain/dimensions';
import type { ReportSummaryRow } from '../domain/analytics';
import { buildReportMetricColumns, type ReportColumnFilters } from '../domain/reportMetrics';

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
  const [customizeHintOpen, setCustomizeHintOpen] = useState(false);

  const columns: ColumnsType<ReportSummaryRow> = [
    {
      title: primaryDimension.label,
      dataIndex: 'primaryDimensionValue',
      key: 'primaryDimensionValue',
      fixed: 'left',
      width: 140,
    },
    ...buildReportMetricColumns<ReportSummaryRow>(filters, hasComparison),
    {
      title: <ActionsColumnTitle onCustomizeClick={() => setCustomizeHintOpen(true)} />,
      key: 'actions',
      fixed: 'right',
      width: 152,
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
    <>
      <Table
        className="report-table"
        rowKey="key"
        columns={columns}
        dataSource={rows}
        pagination={false}
        bordered
        scroll={{ x: 1112 }}
        showSorterTooltip={{ target: 'sorter-icon' }}
      />
      <TableCustomizeHintModal open={customizeHintOpen} onClose={() => setCustomizeHintOpen(false)} />
    </>
  );
}
