# Metric Tooltip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `?` icon with Popover tooltip to every metric column header in the summary and breakdown tables, showing explanation or formula for each metric.

**Architecture:** Extend `MetricDefinition` with an optional `description` field in `metrics.ts`. Populate descriptions inline in `metricGroups`. Update `buildMetricColumns()` to render a `Popover` wrapping a `QuestionCircleOutlined` icon when `description` is present. Both `SummaryTable` and `BreakdownDrawer` share this function, so no other files need changes.

**Tech Stack:** React, TypeScript, Ant Design (`Popover`, `QuestionCircleOutlined`)

---

### Task 1: Add `description` field to `MetricDefinition` type

**Files:**
- Modify: `src/domain/metrics.ts`

- [ ] **Step 1: Import `ReactNode` and add `description` to `MetricDefinition`**

Add the `ReactNode` import and extend the type. Replace the `MetricDefinition` block:

```tsx
import type { ReactNode } from 'react';
import type { ColumnsType } from 'antd/es/table';

export type MetricKey =
  // ... keep existing keys unchanged

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
  description?: ReactNode;
};
```

The `?` makes it optional — backward compatible, no breakage.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors (existing errors are pre-existing).

---

### Task 2: Populate `description` for all 21 metrics in `metricGroups`

**Files:**
- Modify: `src/domain/metrics.ts`

- [ ] **Step 1: Update `metricGroups` with descriptions**

Replace the entire `metricGroups` constant with:

```tsx
export const metricGroups: MetricGroup[] = [
  {
    title: '业绩总览',
    metrics: [
      { key: 'reportedAmount', label: '上报业绩', format: 'amount',
        description: '统计周期内所有成交记录的上报金额总和（排除定金）' },
      { key: 'confirmedAmount', label: '确认业绩', format: 'amount',
        description: '统计周期内所有成交记录的确认金额总和（排除定金）' },
    ],
  },
  {
    title: '成交概况',
    metrics: [
      { key: 'dealCount', label: '成交单量', format: 'integer',
        description: '统计周期内成交记录总数（排除定金）' },
      { key: 'customerCount', label: '成交客户数', format: 'integer',
        description: '统计周期内成交去重客户数（排除定金）' },
      { key: 'averageDealAmount', label: '客单价', format: 'amount',
        description: '计算公式：上报业绩 ÷ 成交单量' },
    ],
  },
  {
    title: '新诊成交',
    metrics: [
      { key: 'newDiagnosisAmount', label: '新诊业绩', format: 'amount',
        description: '统计周期内成交类型为「新诊」的上报金额总和（排除定金）' },
      { key: 'newDiagnosisAmountRate', label: '新诊业绩占比', format: 'percent',
        description: '计算公式：新诊业绩 ÷ 上报业绩' },
      { key: 'newDiagnosisDealCount', label: '新诊单量', format: 'integer',
        description: '统计周期内成交类型为「新诊」的成交记录数（排除定金）' },
      { key: 'newDiagnosisDealCountRate', label: '新诊单量占比', format: 'percent',
        description: '计算公式：新诊单量 ÷ 成交单量' },
      { key: 'newDiagnosisCustomerCount', label: '新诊客户数', format: 'integer',
        description: '统计周期内成交类型为「新诊」的去重客户数（排除定金）' },
      { key: 'newDiagnosisCustomerRate', label: '新诊客户占比', format: 'percent',
        description: '计算公式：新诊客户数 ÷ 成交客户数' },
    ],
  },
  {
    title: '复购成交',
    metrics: [
      { key: 'repurchaseAmount', label: '复购业绩', format: 'amount',
        description: '统计周期内成交类型为「复购」的上报金额总和（排除定金）' },
      { key: 'repurchaseAmountRate', label: '复购业绩占比', format: 'percent',
        description: '计算公式：复购业绩 ÷ 上报业绩' },
      { key: 'repurchaseDealCount', label: '复购单量', format: 'integer',
        description: '统计周期内成交类型为「复购」的成交记录数（排除定金）' },
      { key: 'repurchaseDealCountRate', label: '复购单量占比', format: 'percent',
        description: '计算公式：复购单量 ÷ 成交单量' },
      { key: 'repurchaseCustomerCount', label: '复购客户数', format: 'integer',
        description: '统计周期内成交类型为「复购」的去重客户数（排除定金）' },
      { key: 'repurchaseCustomerRate', label: '复购客户占比', format: 'percent',
        description: '计算公式：复购客户数 ÷ 成交客户数' },
    ],
  },
  {
    title: '新客转化',
    metrics: [
      { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent',
        description: '计算公式：本期成交新客数量 ÷ 本期新客数量' },
      { key: 'newCustomerAmountContributionRate', label: '新客业绩贡献占比', format: 'percent',
        description: '计算公式：本期新客户业绩 ÷ 上报业绩' },
    ],
  },
  {
    title: '历史复购贡献',
    metrics: [
      {
        key: 'historicalRepurchaseCustomerContributionRate',
        label: '历史复购客户当期贡献率',
        format: 'percent',
        description: '计算公式：复购客户数 ÷ 历史复购客户总数',
      },
      {
        key: 'historicalRepurchaseAmountContributionRate',
        label: '历史复购业绩当期贡献率',
        format: 'percent',
        description: '计算公式：复购业绩 ÷ 历史复购总业绩',
      },
    ],
  },
];
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

---

### Task 3: Update `buildMetricColumns()` to render Popover icon

**Files:**
- Modify: `src/domain/metrics.ts`

- [ ] **Step 1: Add imports for Popover and icon**

At the top of the file, add after the existing imports:

```tsx
import { Popover } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
```

- [ ] **Step 2: Modify column `title` render in `buildMetricColumns()`**

Replace the `buildMetricColumns` function with:

```tsx
export function buildMetricColumns<T extends MetricValue>(): ColumnsType<T> {
  return metricGroups.map((group) => ({
    title: group.title,
    children: group.metrics.map((metric) => ({
      title: metric.description ? (
        <span>
          {metric.label}
          <Popover content={metric.description}>
            <QuestionCircleOutlined
              style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
            />
          </Popover>
        </span>
      ) : (
        metric.label
      ),
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

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new type errors.

---

### Task 4: Manual verification

**Files:** None (manual check)

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify summary table tooltips**

1. Open the app in browser
2. Hover over each metric column header's `?` icon
3. Confirm Popover shows correct description/formula
4. Confirm all 21 metrics have the icon

- [ ] **Step 3: Verify breakdown drawer tooltips**

1. Click "业绩拆解" on any row
2. Hover over metric column headers in the drawer
3. Confirm Popover works same as summary table

- [ ] **Step 4: Verify no regressions**

1. Confirm table sorting still works on all metric columns
2. Confirm table formatting (金额/百分比/整数) still correct
3. Confirm "导出当前拆解" button still present
