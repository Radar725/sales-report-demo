import { Button, Drawer, Space, Table, Tabs } from 'antd';
import { useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import type { DealRecord } from '../data/mockDeals';
import {
  buildBreakdownRows,
  getBreakdownDetailRecords,
  type BreakdownRow,
  type SummaryRow,
} from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions } from '../domain/dimensions';
import { buildMetricColumns } from '../domain/metrics';
import { detailColumns } from './detailColumns';

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
  const breakdownDimensions = getBreakdownDimensions(primaryDimension);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailRecords, setDetailRecords] = useState<DealRecord[]>([]);

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 业绩拆解` : '业绩拆解'}
      width={1400}
      open={open}
      onClose={onClose}
    >
      {row ? (
        <>
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
                {
                  title: '操作',
                  key: 'actions',
                  fixed: 'right',
                  width: 100,
                  render: (_, breakdownRow) => (
                    <Button
                      type="link"
                      style={{ paddingInline: 4 }}
                      onClick={() => {
                        setDetailRecords(
                          getBreakdownDetailRecords(records, {
                            primaryDimension,
                            primaryDimensionValue: row.primaryDimensionValue,
                            breakdownDimension: breakdownDimension.key,
                            breakdownDimensionValue: breakdownRow.breakdownDimensionValue,
                          }),
                        );
                        setDetailTitle(`${breakdownRow.breakdownDimensionValue} · 业绩明细`);
                        setDetailOpen(true);
                      }}
                    >
                      业绩明细
                    </Button>
                  ),
                },
              ];

              return {
                key: breakdownDimension.key,
                label: breakdownDimension.label,
                children: (
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
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
          <Drawer
            title={detailTitle}
            width={1400}
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
          >
            <Table
              rowKey="id"
              columns={detailColumns}
              dataSource={detailRecords}
              pagination={false}
              bordered
              scroll={{ x: 1790 }}
            />
          </Drawer>
        </>
      ) : null}
    </Drawer>
  );
}
