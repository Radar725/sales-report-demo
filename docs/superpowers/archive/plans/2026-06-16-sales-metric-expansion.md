# Sales Metric Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the sales analytics demo from 2 metrics to the approved 21-field grouped metric table in both the summary list and breakdown drawer.

**Architecture:** Keep all metric calculation in pure domain modules, then let both tables consume the same metric column configuration. Extend deterministic mock records with the minimum demo fields needed for reported/confirmed amount, new-diagnosis/repurchase splits, in-period new-customer conversion, and historical repurchase contribution.

**Tech Stack:** React, TypeScript, Vite, Ant Design 5.0, Vitest, Testing Library.

---

## File Structure

- Modify: `src/domain/metrics.ts`  
  Owns metric keys, grouped metric definitions, amount/percent/number formatting, and reusable AntD grouped column builders.
- Modify: `src/data/mockDeals.ts`  
  Adds demo fields: reported amount, confirmed amount, deal type, customer-created-in-period flag, created-customer denominator, and historical repurchase denominator fields.
- Modify: `src/domain/analytics.ts`  
  Aggregates all 21 metrics for summary rows and breakdown rows.
- Modify: `src/domain/analytics.test.ts`  
  Verifies the expanded metric calculations for summary and breakdown rows.
- Modify: `src/components/SummaryTable.tsx`  
  Uses the shared grouped metric columns after the primary dimension column.
- Modify: `src/components/BreakdownDrawer.tsx`  
  Uses the same grouped metric columns after the current breakdown dimension column.
- Modify: `src/App.test.tsx`  
  Checks that key new grouped columns render in the main page and drawer path.

## Task 1: Define Shared Metric Types And Formatting

**Files:**
- Modify: `src/domain/metrics.ts`

- [ ] **Step 1: Replace the 2-metric model with the 21-field model**

Replace `src/domain/metrics.ts` with:

```ts
import type { ColumnsType } from 'antd/es/table';

export type MetricKey =
  | 'reportedAmount'
  | 'confirmedAmount'
  | 'dealCount'
  | 'customerCount'
  | 'averageDealAmount'
  | 'newDiagnosisAmount'
  | 'newDiagnosisDealCount'
  | 'newDiagnosisCustomerCount'
  | 'newDiagnosisDealCountRate'
  | 'newDiagnosisCustomerRate'
  | 'newDiagnosisAmountRate'
  | 'repurchaseAmount'
  | 'repurchaseDealCount'
  | 'repurchaseCustomerCount'
  | 'repurchaseDealCountRate'
  | 'repurchaseCustomerRate'
  | 'repurchaseAmountRate'
  | 'newCustomerConversionRate'
  | 'newCustomerAmountContributionRate'
  | 'historicalRepurchaseCustomerContributionRate'
  | 'historicalRepurchaseAmountContributionRate';

export type MetricValue = Record<MetricKey, number>;

type MetricFormat = 'amount' | 'integer' | 'percent';

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
};

export type MetricGroup = {
  title: string;
  metrics: MetricDefinition[];
};

export const metricGroups: MetricGroup[] = [
  {
    title: '基础业绩',
    metrics: [
      { key: 'reportedAmount', label: '上报业绩', format: 'amount' },
      { key: 'confirmedAmount', label: '确认业绩', format: 'amount' },
    ],
  },
  {
    title: '成交基础',
    metrics: [
      { key: 'dealCount', label: '成交单量', format: 'integer' },
      { key: 'customerCount', label: '成交客户数', format: 'integer' },
      { key: 'averageDealAmount', label: '客单价', format: 'amount' },
    ],
  },
  {
    title: '新诊',
    metrics: [
      { key: 'newDiagnosisAmount', label: '新诊业绩', format: 'amount' },
      { key: 'newDiagnosisDealCount', label: '新诊成交单量', format: 'integer' },
      { key: 'newDiagnosisCustomerCount', label: '新诊成交客户数', format: 'integer' },
      { key: 'newDiagnosisDealCountRate', label: '新诊成交单量占比', format: 'percent' },
      { key: 'newDiagnosisCustomerRate', label: '新诊成交客户占比', format: 'percent' },
      { key: 'newDiagnosisAmountRate', label: '新诊成交业绩占比', format: 'percent' },
    ],
  },
  {
    title: '复购',
    metrics: [
      { key: 'repurchaseAmount', label: '复购业绩', format: 'amount' },
      { key: 'repurchaseDealCount', label: '复购成交单量', format: 'integer' },
      { key: 'repurchaseCustomerCount', label: '复购成交客户数', format: 'integer' },
      { key: 'repurchaseDealCountRate', label: '复购成交单量占比', format: 'percent' },
      { key: 'repurchaseCustomerRate', label: '复购成交客户占比', format: 'percent' },
      { key: 'repurchaseAmountRate', label: '复购成交业绩占比', format: 'percent' },
    ],
  },
  {
    title: '新客转化',
    metrics: [
      { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent' },
      { key: 'newCustomerAmountContributionRate', label: '新客业绩贡献占比', format: 'percent' },
    ],
  },
  {
    title: '历史复购贡献',
    metrics: [
      {
        key: 'historicalRepurchaseCustomerContributionRate',
        label: '历史复购客户当期贡献率',
        format: 'percent',
      },
      {
        key: 'historicalRepurchaseAmountContributionRate',
        label: '历史复购业绩当期贡献率',
        format: 'percent',
      },
    ],
  },
];

export function formatAmount(value: number) {
  return `${(value / 10000).toFixed(1)}万`;
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatMetricValue(value: number, format: MetricFormat) {
  if (format === 'amount') {
    return formatAmount(value);
  }

  if (format === 'percent') {
    return formatPercent(value);
  }

  return value;
}

export function buildMetricColumns<T extends MetricValue>(): ColumnsType<T> {
  return metricGroups.map((group) => ({
    title: group.title,
    children: group.metrics.map((metric) => ({
      title: metric.label,
      dataIndex: metric.key,
      key: metric.key,
      align: 'right' as const,
      width: metric.format === 'percent' ? 140 : 120,
      sorter: (left: T, right: T) => left[metric.key] - right[metric.key],
      render: (value: number) => formatMetricValue(value, metric.format),
    })),
  }));
}
```

- [ ] **Step 2: Run typecheck/build to expose current compile errors**

Run: `npm run build`

Expected: FAIL because `analytics.ts`, `SummaryTable.tsx`, and `BreakdownDrawer.tsx` still reference the legacy 2-metric row shape.

- [ ] **Step 3: Commit metric definitions after dependent tasks pass**

Do not commit yet. This task intentionally leaves dependent files broken until Tasks 2-4 update them.

## Task 2: Extend Demo Data And Aggregation

**Files:**
- Modify: `src/data/mockDeals.ts`
- Modify: `src/domain/analytics.ts`
- Modify: `src/domain/analytics.test.ts`

- [ ] **Step 1: Write failing expanded aggregation tests**

Replace `src/domain/analytics.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { buildBreakdownRows, buildSummaryRows } from './analytics';
import { mockDeals } from '../data/mockDeals';

describe('sales analytics aggregation', () => {
  it('builds summary rows with the expanded metric set', () => {
    const rows = buildSummaryRows(mockDeals, 'consultant');

    expect(rows[0]).toMatchObject({
      primaryDimensionValue: '张敏',
      reportedAmount: 1580000,
      confirmedAmount: 1439000,
      dealCount: 5,
      customerCount: 4,
      averageDealAmount: 316000,
      newDiagnosisAmount: 1030000,
      newDiagnosisDealCount: 3,
      newDiagnosisCustomerCount: 3,
      newDiagnosisDealCountRate: 0.6,
      newDiagnosisCustomerRate: 0.75,
      newDiagnosisAmountRate: 0.6518987341772152,
      repurchaseAmount: 550000,
      repurchaseDealCount: 2,
      repurchaseCustomerCount: 2,
      repurchaseDealCountRate: 0.4,
      repurchaseCustomerRate: 0.5,
      repurchaseAmountRate: 0.34810126582278483,
      newCustomerConversionRate: 0.75,
      newCustomerAmountContributionRate: 0.6518987341772152,
      historicalRepurchaseCustomerContributionRate: 0.2,
      historicalRepurchaseAmountContributionRate: 0.1375,
    });
  });

  it('builds breakdown rows with the same expanded metric set', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows[0]).toMatchObject({
      key: 'channel:信息流',
      breakdownDimensionValue: '信息流',
      reportedAmount: 900000,
      confirmedAmount: 824000,
      dealCount: 2,
      customerCount: 2,
      averageDealAmount: 450000,
      newDiagnosisAmount: 900000,
      repurchaseAmount: 0,
      newDiagnosisDealCountRate: 1,
      repurchaseDealCountRate: 0,
    });
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npm test -- src/domain/analytics.test.ts`

Expected: FAIL because the new fields are not yet present on `DealRecord` or aggregation rows.

- [ ] **Step 3: Extend mock deal records**

Replace `src/data/mockDeals.ts` with:

```ts
import type { DimensionKey } from '../domain/dimensions';

export type DealType = '新诊' | '复购';

export type DealRecord = Record<DimensionKey, string> & {
  id: string;
  customerId: string;
  reportedAmount: number;
  confirmedAmount: number;
  dealType: DealType;
  customerCreatedInPeriod: boolean;
  createdCustomerCountInPeriod: number;
  historicalRepurchaseCustomerCount: number;
  historicalRepurchaseAmount: number;
  dealDate: string;
  dealStatus: '已成交';
};

export const mockDeals: DealRecord[] = [
  {
    id: 'D001',
    customerId: 'C001',
    consultant: '张敏',
    department: '华东一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '上海中心',
    city: '上海',
    reportedAmount: 450000,
    confirmedAmount: 412000,
    dealType: '新诊',
    customerCreatedInPeriod: true,
    createdCustomerCountInPeriod: 4,
    historicalRepurchaseCustomerCount: 10,
    historicalRepurchaseAmount: 4000000,
    dealDate: '2026-06-02',
    dealStatus: '已成交',
  },
  {
    id: 'D002',
    customerId: 'C002',
    consultant: '张敏',
    department: '华东一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '杭州中心',
    city: '杭州',
    reportedAmount: 450000,
    confirmedAmount: 412000,
    dealType: '新诊',
    customerCreatedInPeriod: true,
    createdCustomerCountInPeriod: 4,
    historicalRepurchaseCustomerCount: 10,
    historicalRepurchaseAmount: 4000000,
    dealDate: '2026-06-06',
    dealStatus: '已成交',
  },
  {
    id: 'D003',
    customerId: 'C003',
    consultant: '张敏',
    department: '华东一部',
    channel: '私域',
    channelCategory: '私域运营',
    institution: '上海中心',
    city: '上海',
    reportedAmount: 350000,
    confirmedAmount: 318000,
    dealType: '新诊',
    customerCreatedInPeriod: true,
    createdCustomerCountInPeriod: 4,
    historicalRepurchaseCustomerCount: 10,
    historicalRepurchaseAmount: 4000000,
    dealDate: '2026-06-11',
    dealStatus: '已成交',
  },
  {
    id: 'D004',
    customerId: 'C004',
    consultant: '张敏',
    department: '华东一部',
    channel: '转介绍',
    channelCategory: '口碑推荐',
    institution: '南京中心',
    city: '南京',
    reportedAmount: 200000,
    confirmedAmount: 186000,
    dealType: '复购',
    customerCreatedInPeriod: false,
    createdCustomerCountInPeriod: 4,
    historicalRepurchaseCustomerCount: 10,
    historicalRepurchaseAmount: 4000000,
    dealDate: '2026-06-17',
    dealStatus: '已成交',
  },
  {
    id: 'D005',
    customerId: 'C004',
    consultant: '张敏',
    department: '华东一部',
    channel: '自然流量',
    channelCategory: '自然增长',
    institution: '上海中心',
    city: '上海',
    reportedAmount: 350000,
    confirmedAmount: 111000,
    dealType: '复购',
    customerCreatedInPeriod: false,
    createdCustomerCountInPeriod: 4,
    historicalRepurchaseCustomerCount: 10,
    historicalRepurchaseAmount: 4000000,
    dealDate: '2026-06-20',
    dealStatus: '已成交',
  },
  {
    id: 'D006',
    customerId: 'C005',
    consultant: '李然',
    department: '华南一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '广州中心',
    city: '广州',
    reportedAmount: 700000,
    confirmedAmount: 645000,
    dealType: '新诊',
    customerCreatedInPeriod: true,
    createdCustomerCountInPeriod: 5,
    historicalRepurchaseCustomerCount: 8,
    historicalRepurchaseAmount: 3000000,
    dealDate: '2026-06-05',
    dealStatus: '已成交',
  },
  {
    id: 'D007',
    customerId: 'C006',
    consultant: '李然',
    department: '华南一部',
    channel: '私域',
    channelCategory: '私域运营',
    institution: '深圳中心',
    city: '深圳',
    reportedAmount: 480000,
    confirmedAmount: 441000,
    dealType: '新诊',
    customerCreatedInPeriod: true,
    createdCustomerCountInPeriod: 5,
    historicalRepurchaseCustomerCount: 8,
    historicalRepurchaseAmount: 3000000,
    dealDate: '2026-06-09',
    dealStatus: '已成交',
  },
  {
    id: 'D008',
    customerId: 'C007',
    consultant: '李然',
    department: '华南一部',
    channel: '转介绍',
    channelCategory: '口碑推荐',
    institution: '广州中心',
    city: '广州',
    reportedAmount: 100000,
    confirmedAmount: 97000,
    dealType: '复购',
    customerCreatedInPeriod: false,
    createdCustomerCountInPeriod: 5,
    historicalRepurchaseCustomerCount: 8,
    historicalRepurchaseAmount: 3000000,
    dealDate: '2026-06-13',
    dealStatus: '已成交',
  },
  {
    id: 'D009',
    customerId: 'C008',
    consultant: '李然',
    department: '华南一部',
    channel: '自然流量',
    channelCategory: '自然增长',
    institution: '深圳中心',
    city: '深圳',
    reportedAmount: 180000,
    confirmedAmount: 149000,
    dealType: '复购',
    customerCreatedInPeriod: false,
    createdCustomerCountInPeriod: 5,
    historicalRepurchaseCustomerCount: 8,
    historicalRepurchaseAmount: 3000000,
    dealDate: '2026-06-22',
    dealStatus: '已成交',
  },
];
```

- [ ] **Step 4: Implement expanded aggregation**

Replace `src/domain/analytics.ts` with:

```ts
import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from './dimensions';
import type { MetricValue } from './metrics';

export type SummaryRow = MetricValue & {
  key: string;
  primaryDimensionValue: string;
};

export type BreakdownRow = MetricValue & {
  key: string;
  breakdownDimensionValue: string;
};

type BreakdownQuery = {
  primaryDimension: DimensionKey;
  primaryDimensionValue: string;
  breakdownDimension: DimensionKey;
};

type AggregateSummary = {
  value: string;
} & MetricValue;

function safeDivide(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function aggregate(records: DealRecord[], dimension: DimensionKey): AggregateSummary[] {
  const groups = new Map<string, DealRecord[]>();

  for (const record of records) {
    const value = record[dimension];
    const current = groups.get(value) ?? [];
    current.push(record);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, groupRecords]) => {
      const customerIds = new Set(groupRecords.map((record) => record.customerId));
      const newDiagnosisRecords = groupRecords.filter((record) => record.dealType === '新诊');
      const repurchaseRecords = groupRecords.filter((record) => record.dealType === '复购');
      const newCustomerRecords = groupRecords.filter((record) => record.customerCreatedInPeriod);

      const reportedAmount = groupRecords.reduce((sum, record) => sum + record.reportedAmount, 0);
      const confirmedAmount = groupRecords.reduce((sum, record) => sum + record.confirmedAmount, 0);
      const dealCount = groupRecords.length;
      const customerCount = customerIds.size;
      const newDiagnosisAmount = newDiagnosisRecords.reduce(
        (sum, record) => sum + record.reportedAmount,
        0,
      );
      const repurchaseAmount = repurchaseRecords.reduce(
        (sum, record) => sum + record.reportedAmount,
        0,
      );
      const newDiagnosisCustomerCount = new Set(
        newDiagnosisRecords.map((record) => record.customerId),
      ).size;
      const repurchaseCustomerCount = new Set(
        repurchaseRecords.map((record) => record.customerId),
      ).size;
      const newCustomerCount = new Set(newCustomerRecords.map((record) => record.customerId)).size;
      const newCustomerAmount = newCustomerRecords.reduce(
        (sum, record) => sum + record.reportedAmount,
        0,
      );
      const createdCustomerCountInPeriod = Math.max(
        ...groupRecords.map((record) => record.createdCustomerCountInPeriod),
      );
      const historicalRepurchaseCustomerCount = Math.max(
        ...groupRecords.map((record) => record.historicalRepurchaseCustomerCount),
      );
      const historicalRepurchaseAmount = Math.max(
        ...groupRecords.map((record) => record.historicalRepurchaseAmount),
      );

      return {
        value,
        reportedAmount,
        confirmedAmount,
        dealCount,
        customerCount,
        averageDealAmount: safeDivide(reportedAmount, dealCount),
        newDiagnosisAmount,
        newDiagnosisDealCount: newDiagnosisRecords.length,
        newDiagnosisCustomerCount,
        newDiagnosisDealCountRate: safeDivide(newDiagnosisRecords.length, dealCount),
        newDiagnosisCustomerRate: safeDivide(newDiagnosisCustomerCount, customerCount),
        newDiagnosisAmountRate: safeDivide(newDiagnosisAmount, reportedAmount),
        repurchaseAmount,
        repurchaseDealCount: repurchaseRecords.length,
        repurchaseCustomerCount,
        repurchaseDealCountRate: safeDivide(repurchaseRecords.length, dealCount),
        repurchaseCustomerRate: safeDivide(repurchaseCustomerCount, customerCount),
        repurchaseAmountRate: safeDivide(repurchaseAmount, reportedAmount),
        newCustomerConversionRate: safeDivide(newCustomerCount, createdCustomerCountInPeriod),
        newCustomerAmountContributionRate: safeDivide(newCustomerAmount, reportedAmount),
        historicalRepurchaseCustomerContributionRate: safeDivide(
          repurchaseCustomerCount,
          historicalRepurchaseCustomerCount,
        ),
        historicalRepurchaseAmountContributionRate: safeDivide(
          repurchaseAmount,
          historicalRepurchaseAmount,
        ),
      };
    })
    .sort((left, right) => right.reportedAmount - left.reportedAmount);
}

export function buildSummaryRows(records: DealRecord[], primaryDimension: DimensionKey): SummaryRow[] {
  return aggregate(records, primaryDimension).map((row) => ({
    key: `${primaryDimension}:${row.value}`,
    primaryDimensionValue: row.value,
    ...(({ value: _value, ...metrics }) => metrics)(row),
  }));
}

export function buildBreakdownRows(records: DealRecord[], query: BreakdownQuery): BreakdownRow[] {
  const scopedRecords = records.filter(
    (record) => record[query.primaryDimension] === query.primaryDimensionValue,
  );

  return aggregate(scopedRecords, query.breakdownDimension).map((row) => ({
    key: `${query.breakdownDimension}:${row.value}`,
    breakdownDimensionValue: row.value,
    ...(({ value: _value, ...metrics }) => metrics)(row),
  }));
}
```

- [ ] **Step 5: Run focused analytics tests**

Run: `npm test -- src/domain/analytics.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit domain metric expansion**

Run:

```bash
git add src/domain/metrics.ts src/data/mockDeals.ts src/domain/analytics.ts src/domain/analytics.test.ts
git commit -m "feat: expand sales metric aggregation"
```

Expected: commit succeeds.

## Task 3: Render Grouped Metric Columns In Both Tables

**Files:**
- Modify: `src/components/SummaryTable.tsx`
- Modify: `src/components/BreakdownDrawer.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing UI coverage**

Replace `src/App.test.tsx` with:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders expanded grouped metrics in the summary table', () => {
    render(<App />);

    expect(screen.getByRole('columnheader', { name: '基础业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '新诊业绩' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '历史复购业绩当期贡献率' })).toBeInTheDocument();
  });

  it('renders the same expanded metrics inside the breakdown drawer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('columnheader', { name: '基础业绩' })).toBeInTheDocument();
    expect(within(drawer).getByRole('columnheader', { name: '复购业绩' })).toBeInTheDocument();
    expect(
      within(drawer).getByRole('columnheader', { name: '历史复购客户当期贡献率' }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests and verify they fail**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL because the tables still render only the old two metric columns or fail to compile after Task 1.

- [ ] **Step 3: Update the main summary table**

Replace `src/components/SummaryTable.tsx` with:

```tsx
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { SummaryRow } from '../domain/analytics';
import { buildMetricColumns } from '../domain/metrics';

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
      fixed: 'left',
      width: 120,
    },
    ...buildMetricColumns<SummaryRow>(),
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenBreakdown(row)}>
          查看拆解
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="key"
      columns={columns}
      dataSource={rows}
      pagination={false}
      scroll={{ x: 2800 }}
    />
  );
}
```

- [ ] **Step 4: Update the breakdown drawer table**

Replace `src/components/BreakdownDrawer.tsx` with:

```tsx
import { Button, Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockDeals } from '../data/mockDeals';
import { buildBreakdownRows, type BreakdownRow, type SummaryRow } from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions, getDimension } from '../domain/dimensions';
import { buildMetricColumns } from '../domain/metrics';

type BreakdownDrawerProps = {
  open: boolean;
  primaryDimension: DimensionKey;
  row: SummaryRow | null;
  onClose: () => void;
};

export default function BreakdownDrawer({ open, primaryDimension, row, onClose }: BreakdownDrawerProps) {
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
            const dataSource = buildBreakdownRows(mockDeals, {
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
```

- [ ] **Step 5: Run focused UI tests**

Run: `npm test -- src/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit UI table expansion**

Run:

```bash
git add src/components/SummaryTable.tsx src/components/BreakdownDrawer.tsx src/App.test.tsx
git commit -m "feat: show grouped sales metrics"
```

Expected: commit succeeds.

## Task 4: Final Verification

**Files:**
- No planned source edits unless verification finds a concrete issue.

- [ ] **Step 1: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 3: Start the local dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/`.

- [ ] **Step 4: Browser smoke check**

Open the local URL and verify:

- The main table shows grouped headers: `基础业绩`、`成交基础`、`新诊`、`复购`、`新客转化`、`历史复购贡献`.
- The main table has a horizontal scroll instead of overflowing the page.
- Clicking `查看拆解` opens the drawer.
- The drawer table shows the same grouped metric headers.
- Switching tabs keeps the grouped metric table visible.

- [ ] **Step 5: Commit verification-only fixes if needed**

If Step 4 requires a small UI adjustment, run:

```bash
git add src/components/SummaryTable.tsx src/components/BreakdownDrawer.tsx src/styles.css
git commit -m "fix: polish metric table layout"
```

Expected: commit succeeds only when a real adjustment was made.
