export type FunnelCustomerType = 'valid' | 'invalid';

export type FunnelCustomerStatus =
  | 'pendingWechat'
  | 'wechatAdded'
  | 'dispatched'
  | 'invited'
  | 'visited'
  | 'firstConverted'
  | 'repurchased';

export type FunnelCustomerRecord = {
  id: string;
  customerCreatedAt: string;
  customerType: FunnelCustomerType;
  status: FunnelCustomerStatus;
  department: string;
  consultant: string;
  channelCategory: string;
  channel: string;
};

export const mockFunnelCustomers: FunnelCustomerRecord[] = [
  {
    id: 'C001',
    customerCreatedAt: '2026-06-05',
    customerType: 'valid',
    status: 'repurchased',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C002',
    customerCreatedAt: '2026-06-10',
    customerType: 'valid',
    status: 'invited',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C003',
    customerCreatedAt: '2026-06-08',
    customerType: 'invalid',
    status: 'firstConverted',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '私域运营',
    channel: '私域',
  },
  {
    id: 'C004',
    customerCreatedAt: '2026-05-15',
    customerType: 'valid',
    status: 'visited',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C005',
    customerCreatedAt: '2026-05-01',
    customerType: 'invalid',
    status: 'pendingWechat',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '口碑推荐',
    channel: '转介绍',
  },
  {
    id: 'C006',
    customerCreatedAt: '2026-06-20',
    customerType: 'valid',
    status: 'wechatAdded',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '私域运营',
    channel: '私域',
  },
  {
    id: 'C007',
    customerCreatedAt: '2026-06-18',
    customerType: 'valid',
    status: 'invited',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '私域运营',
    channel: '私域',
  },
  {
    id: 'C015',
    customerCreatedAt: '2026-06-12',
    customerType: 'invalid',
    status: 'repurchased',
    department: '无效客户演示',
    consultant: '无效客户演示',
    channelCategory: '无效客户演示',
    channel: '无效客户渠道',
  },
];

/** 对比期（2026-05）漏斗客户 cohort。 */
export const mockComparisonFunnelCustomers: FunnelCustomerRecord[] = [
  {
    id: 'C008',
    customerCreatedAt: '2026-05-05',
    customerType: 'valid',
    status: 'repurchased',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C009',
    customerCreatedAt: '2026-05-12',
    customerType: 'valid',
    status: 'dispatched',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C010',
    customerCreatedAt: '2026-05-08',
    customerType: 'valid',
    status: 'firstConverted',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '私域运营',
    channel: '私域',
  },
  {
    id: 'C011',
    customerCreatedAt: '2026-04-20',
    customerType: 'valid',
    status: 'visited',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '线上投放',
    channel: '信息流',
  },
  {
    id: 'C012',
    customerCreatedAt: '2026-05-15',
    customerType: 'valid',
    status: 'repurchased',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '私域运营',
    channel: '私域',
  },
  {
    id: 'C013',
    customerCreatedAt: '2026-04-01',
    customerType: 'invalid',
    status: 'pendingWechat',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '口碑推荐',
    channel: '转介绍',
  },
  {
    id: 'C014',
    customerCreatedAt: '2026-05-20',
    customerType: 'valid',
    status: 'dispatched',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '演示渠道',
    channel: '演示渠道 A',
  },
];

export const demoFunnelCustomers: FunnelCustomerRecord[] = [
  ...mockFunnelCustomers,
  ...mockComparisonFunnelCustomers,
];
