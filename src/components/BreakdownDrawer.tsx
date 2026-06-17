import { Button, Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DealRecord } from '../data/mockDeals';
import { buildBreakdownRows, type BreakdownRow, type SummaryRow } from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions, getDimension } from '../domain/dimensions';
import { buildMetricColumns } from '../domain/metrics';

type BreakdownDrawerProps = {
  open: boolean;
  records: DealRecord[];
  primaryDimension: DimensionKey;
  row: SummaryRow | null;
  onClose: () => void;
};

export default function BreakdownDrawer({
  open,
  records,
  primaryDimension,
  row,
  onClose,
}: BreakdownDrawerProps) {
  const primaryDimensionConfig = getDimension(primaryDimension);
  const breakdownDimensions = getBreakdownDimensions(primaryDimension);

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 业绩拆解` : '业绩拆解'}
      width={960}
      open={open}
      onClose={onClose}
      extra={<Button>导出当前拆解</Button>}
    >
      {row ? (
        <Tabs
          items={breakdownDimensions.map((breakdownDimension) => {
            const dataSource = buildBreakdownRows(records, {
              primaryDimension,
              primaryDimensionValue: row.primaryDimensionValue,
              breakdownDimension: breakdownDimension.key,
            });
            const columns: ColumnsType<BreakdownRow> = [
              {
                title: breakdownDimension.label,
                dataIndex: 'breakdownDimensionValue',
                key: 'breakdownDimensionValue',
                fixed: 'left',
                width: 140,
              },
              ...buildMetricColumns<BreakdownRow>(),
            ];

            return {
              key: breakdownDimension.key,
              label: breakdownDimension.label,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    {primaryDimensionConfig.label}「{row.primaryDimensionValue}」按
                    {breakdownDimension.label}拆解
                  </div>
                  <Table
                    rowKey="key"
                    columns={columns}
                    dataSource={dataSource}
                    pagination={false}
                    bordered
                    scroll={{ x: 2800 }}
                  />
                </Space>
              ),
            };
          })}
        />
      ) : null}
    </Drawer>
  );
}
