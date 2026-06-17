import type { ColumnsType } from 'antd/es/table';
import type { DealRecord } from '../data/mockDeals';
import { formatAmount, formatPercent } from '../domain/metrics';

export const detailColumns: ColumnsType<DealRecord> = [
  {
    title: '成交金额',
    dataIndex: 'reportedAmount',
    key: 'reportedAmount',
    width: 120,
    align: 'right',
    render: (value: number) => formatAmount(value),
  },
  {
    title: '合作比例',
    dataIndex: 'cooperationRatio',
    key: 'cooperationRatio',
    width: 110,
    align: 'right',
    render: (value: number) => formatPercent(value),
  },
  {
    title: '合作业绩',
    key: 'cooperationAmount',
    width: 120,
    align: 'right',
    render: (_, record) => formatAmount(record.reportedAmount * record.cooperationRatio),
  },
  { title: '成交渠道', dataIndex: 'channel', key: 'channel', width: 120 },
  { title: '合作人名称', dataIndex: 'consultant', key: 'consultant', width: 120 },
  {
    title: '确认金额',
    dataIndex: 'confirmedAmount',
    key: 'confirmedAmount',
    width: 120,
    align: 'right',
    render: (value: number) => formatAmount(value),
  },
  { title: '确认日期', dataIndex: 'confirmedDate', key: 'confirmedDate', width: 120 },
  { title: '客户ID', dataIndex: 'customerId', key: 'customerId', width: 100 },
  { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
  { title: '成交项目', dataIndex: 'project', key: 'project', width: 180 },
  { title: '业绩确认状态', dataIndex: 'dealStatus', key: 'dealStatus', width: 120 },
  { title: '成交机构', dataIndex: 'institution', key: 'institution', width: 120 },
  { title: '成交日期', dataIndex: 'dealDate', key: 'dealDate', width: 120 },
  { title: '上报时间', dataIndex: 'reportedAt', key: 'reportedAt', width: 150 },
];
