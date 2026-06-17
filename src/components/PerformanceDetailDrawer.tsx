import { Drawer, Table } from 'antd';
import type { DealRecord } from '../data/mockDeals';
import type { Dimension } from '../domain/dimensions';
import { detailColumns } from './detailColumns';

type PerformanceDetailDrawerProps = {
  open: boolean;
  records: DealRecord[];
  primaryDimension: Dimension;
  primaryDimensionValue: string | null;
  onClose: () => void;
};

export default function PerformanceDetailDrawer({
  open,
  records,
  primaryDimension,
  primaryDimensionValue,
  onClose,
}: PerformanceDetailDrawerProps) {
  return (
    <Drawer
      title={
        primaryDimensionValue
          ? `${primaryDimensionValue} · 业绩明细`
          : '业绩明细'
      }
      width={1400}
      open={open}
      onClose={onClose}
    >
      <Table
        rowKey="id"
        columns={detailColumns}
        dataSource={records}
        pagination={false}
        bordered
        scroll={{ x: 1790 }}
      />
    </Drawer>
  );
}
