export type FunnelCustomerType = 'valid' | 'invalid';

export type FunnelCustomerRecord = {
  id: string;
  customerCreatedAt: string;
  customerType: FunnelCustomerType;
  department: string;
  consultant: string;
  channelCategory: string;
  channel: string;
  dispatchedAt: string | null;
  invitedAt: string | null;
  visitedAt: string | null;
  convertedAt: string | null;
};

export const mockFunnelCustomers: FunnelCustomerRecord[] = [
  {
    id: 'C001',
    customerCreatedAt: '2026-06-05',
    customerType: 'valid',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
    dispatchedAt: '2026-06-06',
    invitedAt: '2026-06-08',
    visitedAt: '2026-06-12',
    convertedAt: '2026-06-15',
  },
  {
    id: 'C002',
    customerCreatedAt: '2026-06-10',
    customerType: 'valid',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
    dispatchedAt: '2026-06-15',
    invitedAt: '2026-07-02',
    visitedAt: null,
    convertedAt: null,
  },
  {
    id: 'C003',
    customerCreatedAt: '2026-06-08',
    customerType: 'invalid',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '私域运营',
    channel: '私域',
    dispatchedAt: '2026-06-10',
    invitedAt: '2026-06-15',
    visitedAt: '2026-06-20',
    convertedAt: '2026-06-25',
  },
  {
    id: 'C004',
    customerCreatedAt: '2026-05-15',
    customerType: 'valid',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '线上投放',
    channel: '信息流',
    dispatchedAt: '2026-06-05',
    invitedAt: '2026-06-10',
    visitedAt: '2026-06-15',
    convertedAt: null,
  },
  {
    id: 'C005',
    customerCreatedAt: '2026-05-01',
    customerType: 'invalid',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '口碑推荐',
    channel: '转介绍',
    dispatchedAt: null,
    invitedAt: null,
    visitedAt: null,
    convertedAt: null,
  },
  {
    id: 'C006',
    customerCreatedAt: '2026-06-20',
    customerType: 'valid',
    department: '华南一部',
    consultant: '李然',
    channelCategory: '私域运营',
    channel: '私域',
    dispatchedAt: null,
    invitedAt: null,
    visitedAt: null,
    convertedAt: null,
  },
  {
    id: 'C007',
    customerCreatedAt: '2026-06-18',
    customerType: 'valid',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '私域运营',
    channel: '私域',
    dispatchedAt: null,
    invitedAt: '2026-06-20',
    visitedAt: null,
    convertedAt: null,
  },
];
