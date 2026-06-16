import { Button, Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockDeals } from '../data/mockDeals';
import { buildBreakdownRows, type BreakdownRow, type SummaryRow } from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions, getDimension } from '../domain/dimensions';
import { formatAmount } from '../domain/metrics';

type BreakdownDrawerProps = {
  open: boolean;
  primaryDimension: DimensionKey;
  row: SummaryRow | null;
  onClose: () => void;
};

const columns: ColumnsType<BreakdownRow> = [
  {
    title: '拆解维度',
    dataIndex: 'breakdownDimensionValue',
    key: 'breakdownDimensionValue',
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
];

export default function BreakdownDrawer({ open, primaryDimension, row, onClose }: BreakdownDrawerProps) {
  const primaryDimensionConfig = getDimension(primaryDimension);
  const breakdownDimensions = getBreakdownDimensions(primaryDimension);

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 业绩拆解` : '业绩拆解'}
      width={720}
      open={open}
      onClose={onClose}
      extra={<Button>导出当前拆解</Button>}
    >
      {row ? (
        <Tabs
          items={breakdownDimensions.map((breakdownDimension) => {
            const dataSource = buildBreakdownRows(mockDeals, {
              primaryDimension,
              primaryDimensionValue: row.primaryDimensionValue,
              breakdownDimension: breakdownDimension.key,
            });

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
                    columns={[
                      {
                        ...columns[0],
                        title: breakdownDimension.label,
                      },
                      columns[1],
                      columns[2],
                    ]}
                    dataSource={dataSource}
                    pagination={false}
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
