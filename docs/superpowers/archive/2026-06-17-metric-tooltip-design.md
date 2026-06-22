# Metric Tooltip Design

> **Date:** 2026-06-17
> **Status:** designed

## Overview

Add a `?` icon next to every metric column header in the summary table and breakdown table. Hovering the icon shows a Popover with a concise explanation of the metric's calculation logic.

## Interaction

- Each metric column header renders a `QuestionCircleOutlined` icon after the label
- Hover triggers an Ant Design `Popover` with `content` set to the description
- Icon style: gray (`#999`), `marginLeft: 4px`, `cursor: help`

## Approach

**Extend `MetricDefinition` with a `description` field** — descriptions live alongside metric definitions in `metrics.ts`. `buildMetricColumns()` renders the Popover when `description` is present. Both `SummaryTable` and `BreakdownDrawer` benefit automatically since they share `buildMetricColumns()`.

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/domain/metrics.ts` | **Modify** | Add `description` field to `MetricDefinition`, populate 21 descriptions, update `buildMetricColumns()` to render Popover |

### Files NOT changed
- `src/components/SummaryTable.tsx` — uses `buildMetricColumns()`, no change needed
- `src/components/BreakdownDrawer.tsx` — uses `buildMetricColumns()`, no change needed

## Code Design

### 1. Extend `MetricDefinition`

```ts
import type { ReactNode } from 'react';

export type MetricDefinition = {
  key: MetricKey;
  label: string;
  format: MetricFormat;
  description?: ReactNode;
};
```

### 2. Populate descriptions in `metricGroups`

**Explanation copy (10 metrics):**

| Key | Label | Description |
|-----|-------|-------------|
| `reportedAmount` | 上报业绩 | 统计周期内所有成交记录的上报金额总和（排除定金） |
| `confirmedAmount` | 确认业绩 | 统计周期内所有成交记录的确认金额总和（排除定金） |
| `dealCount` | 成交单量 | 统计周期内成交记录总数（排除定金） |
| `customerCount` | 成交客户数 | 统计周期内成交去重客户数（排除定金） |
| `newDiagnosisAmount` | 新诊业绩 | 统计周期内成交类型为「新诊」的上报金额总和（排除定金） |
| `newDiagnosisDealCount` | 新诊单量 | 统计周期内成交类型为「新诊」的成交记录数（排除定金） |
| `newDiagnosisCustomerCount` | 新诊客户数 | 统计周期内成交类型为「新诊」的去重客户数（排除定金） |
| `repurchaseAmount` | 复购业绩 | 统计周期内成交类型为「复购」的上报金额总和（排除定金） |
| `repurchaseDealCount` | 复购单量 | 统计周期内成交类型为「复购」的成交记录数（排除定金） |
| `repurchaseCustomerCount` | 复购客户数 | 统计周期内成交类型为「复购」的去重客户数（排除定金） |

**Formula copy (11 metrics):**

| Key | Label | Description |
|-----|-------|-------------|
| `averageDealAmount` | 客单价 | 计算公式：上报业绩 ÷ 成交单量 |
| `newDiagnosisAmountRate` | 新诊业绩占比 | 计算公式：新诊业绩 ÷ 上报业绩 |
| `newDiagnosisDealCountRate` | 新诊单量占比 | 计算公式：新诊单量 ÷ 成交单量 |
| `newDiagnosisCustomerRate` | 新诊客户占比 | 计算公式：新诊客户数 ÷ 成交客户数 |
| `repurchaseAmountRate` | 复购业绩占比 | 计算公式：复购业绩 ÷ 上报业绩 |
| `repurchaseDealCountRate` | 复购单量占比 | 计算公式：复购单量 ÷ 成交单量 |
| `repurchaseCustomerRate` | 复购客户占比 | 计算公式：复购客户数 ÷ 成交客户数 |
| `newCustomerConversionRate` | 新客成交率 | 计算公式：本期成交新客数量 ÷ 本期新客数量 |
| `newCustomerAmountContributionRate` | 新客业绩贡献占比 | 计算公式：本期新客户业绩 ÷ 上报业绩 |
| `historicalRepurchaseCustomerContributionRate` | 历史复购客户当期贡献率 | 计算公式：复购客户数 ÷ 历史复购客户总数 |
| `historicalRepurchaseAmountContributionRate` | 历史复购业绩当期贡献率 | 计算公式：复购业绩 ÷ 历史复购总业绩 |

### 3. Update `buildMetricColumns()` rendering

```tsx
import { Popover } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

// In column title renderer:
title: metric.description ? (
  <span>
    {metric.label}
    <Popover content={metric.description}>
      <QuestionCircleOutlined style={{ marginLeft: 4, color: '#999', cursor: 'help' }} />
    </Popover>
  </span>
) : (
  metric.label
),
```

## Edge Cases

- If `description` is undefined, no icon is rendered — backward compatible
- Popover uses default trigger `hover`, dismisses on mouse leave
- Formula metrics use `ReactNode` for description (plain string), same rendering path as explanation metrics
