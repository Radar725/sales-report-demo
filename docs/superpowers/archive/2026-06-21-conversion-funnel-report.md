# 转化漏斗报表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有业绩报表旁新增独立状态的转化漏斗报表，按客户、派单、邀约、到院、成交阶段展示可下钻的统计。

**Architecture:** 新增独立的漏斗客户事件数据域，不复用成交记录或金额指标。该数据域负责客户范围/类型/归属筛选、六个允许的维度聚合、阶段日期判断和转化率；展示层只消费聚合结果与统一列定义。`App` 用 Ant Design Tabs 保存两份报表各自的状态并按 Tab 渲染。

**Tech Stack:** React 18、TypeScript、Ant Design 5、dayjs、Vitest、Testing Library。

## Global Constraints

- 不修改业绩报表的筛选、列表、指标或金额计算。
- 漏斗筛选只包含统计时间、客户统计范围、客户类型、咨询师、渠道；统计时间必填。
- 漏斗默认筛选为当月截至当天、新客、有效客户，默认主维度为咨询师。
- 客户数按创建时间及客户范围判断，不受阶段日期限制；日期主维度按客户创建日期分组。
- 派单、邀约、到院、成交客户数分别按各自阶段日期是否落在统计期内计数。
- 分母为 0 显示 `—`；跨期跟进导致的比例超过 100% 如实显示。
- 字段前缀为客户统计范围与客户类型的拼接；仅“全部 + 全部”无前缀。
- 拆解仅使用现有的向下钻取/跨组维度规则；汇总行不可拆解。

---

## File Structure

| 文件 | 职责 |
| --- | --- |
| `src/data/mockFunnelCustomers.ts` | 演示客户及四个阶段日期，覆盖新客/老客、有效/无效、跨期和零分母场景。 |
| `src/domain/funnel.ts` | 漏斗类型、过滤、树形筛选选项、按维度汇总、比率和拆解聚合。 |
| `src/domain/funnel.test.ts` | 漏斗数据域所有口径的单元测试。 |
| `src/domain/funnelMetrics.tsx` | 漏斗列定义、动态前缀与统一的格式化渲染。 |
| `src/domain/funnelMetrics.test.tsx` | 漏斗列名与零分母展示测试。 |
| `src/components/FunnelFilterBar.tsx` | 独立的五项漏斗筛选及查询校验。 |
| `src/components/FunnelTable.tsx` | 漏斗主表和“维度拆解”操作。 |
| `src/components/FunnelBreakdownDrawer.tsx` | 锁定主行后的可下钻维度 Tab 与漏斗表格。 |
| `src/App.tsx` | 顶部双 Tab、两份独立状态和漏斗组件装配。 |
| `src/App.test.tsx` | 双 Tab、默认值、筛选前缀、拆解与状态隔离的集成测试。 |

### Task 1: 建立漏斗客户数据域

**Files:**
- Create: `src/data/mockFunnelCustomers.ts`
- Create: `src/domain/funnel.ts`
- Create: `src/domain/funnel.test.ts`

**Interfaces:**
- Produces `FunnelCustomerRecord`, `FunnelFilters`, `FunnelDimensionKey`, `FunnelSummaryRow`, `FunnelBreakdownRow`。
- Produces `filterFunnelCustomers(records, filters)`, `buildFunnelSummaryRows(records, dateRange, dimension)`, `buildFunnelBreakdownRows(records, dateRange, query)`, `getFunnelBreakdownDimensions(primaryDimension)` 与 `buildFunnelTreeData(records)`，供后续筛选栏、主表和抽屉使用。

- [ ] **Step 1: 写入会失败的漏斗域测试**

```ts
import { describe, expect, it } from 'vitest';
import { mockFunnelCustomers } from '../data/mockFunnelCustomers';
import {
  buildFunnelSummaryRows,
  filterFunnelCustomers,
  type FunnelFilters,
} from './funnel';

const filters: FunnelFilters = {
  dateRange: ['2026-06-01', '2026-06-30'],
  customerScope: 'currentNewCustomers',
  customerType: 'valid',
  departments: [], consultants: [], channelCategories: [], channels: [],
};

describe('funnel analytics', () => {
  it('counts customers by creation date but stages by their own dates', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange,
      'consultant',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
      customerCount: 3, dispatchedCustomerCount: 2, invitedCustomerCount: 2,
      visitedCustomerCount: 1, convertedCustomerCount: 1,
      dispatchRate: 2 / 3, invitationRate: 2 / 3, visitConversionRate: 1,
    });
  });

  it('uses customer creation date for the date dimension', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters), filters.dateRange, 'date',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '2026-06-05')).toMatchObject({
      customerCount: 1,
    });
  });

  it('keeps old, invalid customers when both filters select them', () => {
    const rows = filterFunnelCustomers(mockFunnelCustomers, {
      ...filters, customerScope: 'existingCustomers', customerType: 'invalid',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].customerCreatedAt < filters.dateRange[0]).toBe(true);
  });

  it('returns null for every ratio with a zero denominator', () => {
    const [row] = buildFunnelSummaryRows([], filters.dateRange, 'total');
    expect(row).toMatchObject({ dispatchRate: null, inviteVisitRate: null, visitConversionRate: null });
  });
});
```

- [ ] **Step 2: 运行测试，确认它因模块不存在而失败**

Run: `npm test -- src/domain/funnel.test.ts`

Expected: FAIL，提示找不到 `../data/mockFunnelCustomers` 或 `./funnel`。

- [ ] **Step 3: 最小化实现演示数据和领域函数**

```ts
// src/data/mockFunnelCustomers.ts
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
```

```ts
// src/domain/funnel.ts — public shapes and key calculation
export type FunnelDimensionKey =
  | 'total' | 'date' | 'department' | 'consultant' | 'channelCategory' | 'channel';

export type FunnelFilters = {
  dateRange: [string, string] | null;
  customerScope: 'all' | 'currentNewCustomers' | 'existingCustomers';
  customerType: 'all' | 'valid' | 'invalid';
  departments: string[]; consultants: string[];
  channelCategories: string[]; channels: string[];
};

function isInRange(value: string | null, range: [string, string]) {
  return value !== null && value >= range[0] && value <= range[1];
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}
```

Implement `filterFunnelCustomers` so it filters customer scope against `customerCreatedAt` only and never applies `dateRange`. In the aggregator, group `date` by `customerCreatedAt`; count each stage when its own `*At` field passes `isInRange`. Return all seven rates: `dispatchRate`, `invitationRate`, `visitRate`, `conversionRate`, `dispatchInvitationRate`, `inviteVisitRate`, `visitConversionRate`. Reuse the same hierarchy predicate as `src/domain/dimensions.ts`, restricted to the six funnel dimensions.

Populate mock customers so every customer type/scope combination exists, one valid new customer has a cross-period stage date, and at least one group has no dispatched customer. This makes the specified tests meaningful instead of testing only happy paths.

- [ ] **Step 4: 扩充领域测试并运行通过**

Add assertions for all six dimensions, channel and consultant tree contents, parent-to-child breakdown (`department → consultant`, `channelCategory → channel`), child-to-parent exclusion, and a ratio above `1` from cross-period events.

Run: `npm test -- src/domain/funnel.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交数据域**

```bash
git add src/data/mockFunnelCustomers.ts src/domain/funnel.ts src/domain/funnel.test.ts
git commit -m "feat: add conversion funnel domain"
```

### Task 2: 实现漏斗筛选与统一指标列

**Files:**
- Create: `src/components/FunnelFilterBar.tsx`
- Create: `src/domain/funnelMetrics.tsx`
- Create: `src/domain/funnelMetrics.test.tsx`

**Interfaces:**
- Consumes `FunnelFilters`, `FunnelCustomerRecord`, `buildFunnelTreeData` from Task 1。
- Produces `FunnelFilterBar({ filters, records, onFiltersChange })` 和 `buildFunnelMetricColumns<T>(filters)`，供 Task 3 的表格消费。

- [ ] **Step 1: 写入会失败的列名测试**

```tsx
import { describe, expect, it } from 'vitest';
import { buildFunnelMetricColumns } from './funnelMetrics';

describe('funnel metric columns', () => {
  it('combines scope and customer type into each label', () => {
    expect(buildFunnelMetricColumns({ customerScope: 'currentNewCustomers', customerType: 'valid' })
      .map((column) => column.title)).toContain('新客有效到院成交率');
  });

  it('removes the prefix only when both filters are all', () => {
    expect(buildFunnelMetricColumns({ customerScope: 'all', customerType: 'all' })
      .map((column) => column.title)).toContain('客户数');
  });
});
```

- [ ] **Step 2: 运行测试，确认模块缺失**

Run: `npm test -- src/domain/funnelMetrics.test.tsx`

Expected: FAIL，提示找不到 `./funnelMetrics`。

- [ ] **Step 3: 实现列定义和筛选栏**

```tsx
// src/domain/funnelMetrics.tsx
const scopeLabel = { all: '', currentNewCustomers: '新客', existingCustomers: '老客' };
const typeLabel = { all: '', valid: '有效', invalid: '无效' };
const prefix = (filters: FunnelColumnFilters) =>
  `${scopeLabel[filters.customerScope]}${typeLabel[filters.customerType]}`;

const metrics = [
  ['customerCount', '客户数', 'integer'], ['dispatchedCustomerCount', '派单客户数', 'integer'],
  ['invitedCustomerCount', '邀约客户数', 'integer'], ['visitedCustomerCount', '到院客户数', 'integer'],
  ['convertedCustomerCount', '成交客户数', 'integer'], ['dispatchRate', '派单率', 'percent'],
  ['invitationRate', '邀约率', 'percent'], ['visitRate', '到院率', 'percent'],
  ['conversionRate', '成交率', 'percent'], ['dispatchInvitationRate', '派单邀约率', 'percent'],
  ['inviteVisitRate', '邀约到院率', 'percent'], ['visitConversionRate', '到院成交率', 'percent'],
] as const;
```

For every `null` metric value, render `—`; otherwise use the existing `formatMetricValue(value, 'integer' | 'percent')`. Give the first five count columns integer formatting and the latter seven percentage formatting.

`FunnelFilterBar` must use a local draft state and only call `onFiltersChange` after a successful Ant Design `Form` submission. Add `rules={[{ required: true, message: '请选择统计时间' }]}` to the date range; use `allowClear={false}`. Render only the five approved controls and a 查询 button. Use `buildFunnelTreeData(records)` for the department/consultant and channel category/channel TreeSelect controls.

- [ ] **Step 4: 运行单元测试和类型检查**

Run: `npm test -- src/domain/funnelMetrics.test.tsx && npm run build`

Expected: PASS，TypeScript build succeeds。

- [ ] **Step 5: 提交筛选与列定义**

```bash
git add src/components/FunnelFilterBar.tsx src/domain/funnelMetrics.tsx src/domain/funnelMetrics.test.tsx
git commit -m "feat: add funnel filters and metrics"
```

### Task 3: 实现漏斗主表和维度拆解抽屉

**Files:**
- Create: `src/components/FunnelTable.tsx`
- Create: `src/components/FunnelBreakdownDrawer.tsx`
- Create: `src/components/FunnelTable.test.tsx`

**Interfaces:**
- Consumes `FunnelSummaryRow`, `FunnelBreakdownRow`, `FunnelDimensionKey`, `buildFunnelBreakdownRows`, `getFunnelBreakdownDimensions` from Task 1。
- Consumes `buildFunnelMetricColumns` from Task 2。
- Produces `FunnelTable` 与 `FunnelBreakdownDrawer`，供 Task 4 的页面容器接入。

- [ ] **Step 1: 写入会失败的展示组件测试**

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FunnelTable } from './FunnelTable';

const allFilters = { customerScope: 'all' as const, customerType: 'all' as const };
const departmentRow = {
  key: 'department:华东一部', primaryDimensionValue: '华东一部', customerCount: 2,
  dispatchedCustomerCount: 1, invitedCustomerCount: 1, visitedCustomerCount: 0,
  convertedCustomerCount: 0, dispatchRate: 0.5, invitationRate: 0.5, visitRate: 0,
  conversionRate: 0, dispatchInvitationRate: 1, inviteVisitRate: 0, visitConversionRate: null,
};
const totalRow = { ...departmentRow, key: 'total', primaryDimensionValue: '汇总' };
const openDrawer = vi.fn();

it('opens a funnel breakdown drawer with only allowed dimensions', async () => {
  const user = userEvent.setup();
  render(<FunnelTable primaryDimension={{ key: 'department', label: '部门' }} rows={[departmentRow]} filters={allFilters} onOpenBreakdown={openDrawer} />);
  await user.click(screen.getByRole('button', { name: '维度拆解' }));
  expect(openDrawer).toHaveBeenCalledWith(departmentRow);
});

it('disables breakdown for total rows', () => {
  render(<FunnelTable primaryDimension={{ key: 'total', label: '汇总' }} rows={[totalRow]} filters={allFilters} onOpenBreakdown={vi.fn()} />);
  expect(screen.getByRole('button', { name: '维度拆解' })).toBeDisabled();
});
```

- [ ] **Step 2: 运行组件测试，确认失败**

Run: `npm test -- src/components/FunnelTable.test.tsx`

Expected: FAIL，提示找不到 `./FunnelTable`。

- [ ] **Step 3: 创建两个展示组件**

```tsx
// FunnelTable 操作列的核心逻辑
<Button
  type="link"
  disabled={primaryDimension.key === 'total'}
  onClick={() => onOpenBreakdown(row)}
>
  维度拆解
</Button>
```

`FunnelTable` 的列顺序为当前主维度、`buildFunnelMetricColumns(filters)` 返回的 12 列、操作列；使用 `rowKey="key"`、`pagination={false}`、`bordered`、横向滚动。

`FunnelBreakdownDrawer` 标题为 `${row.primaryDimensionValue} · 转化漏斗拆解`。它对 `getFunnelBreakdownDimensions(primaryDimension)` 的每个值创建一个 Tab，并调用：

```ts
buildFunnelBreakdownRows(records, dateRange, {
  primaryDimension,
  primaryDimensionValue: row.primaryDimensionValue,
  breakdownDimension: breakdownDimension.key,
});
```

抽屉中只展示拆解后的漏斗表，不增加业绩明细或原始客户明细操作。

- [ ] **Step 4: 运行主表组件测试和类型检查**

Run: `npm test -- src/components/FunnelTable.test.tsx && npm run build`

Expected: PASS，TypeScript build succeeds。

- [ ] **Step 5: 提交展示组件**

```bash
git add src/components/FunnelTable.tsx src/components/FunnelBreakdownDrawer.tsx src/components/FunnelTable.test.tsx
git commit -m "feat: add funnel table and breakdown drawer"
```

### Task 4: 接入双报表 Tab 并完成端到端验证

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`（仅在现有容器需要为 Tab 内容对齐时添加最小样式）

**Interfaces:**
- Consumes Task 1–3 所有公开类型和组件。
- Produces同页的“业绩报表 / 转化漏斗报表”切换，且两者状态隔离。

- [ ] **Step 1: 把原有无 Tab 断言改为双 Tab 断言，并补齐关键场景**

Replace the existing `shows the primary dimension selector directly without any tabs` test with:

```tsx
it('defaults to performance report and exposes both report tabs', () => {
  render(<App />);
  expect(screen.getByRole('tab', { name: '业绩报表' })).toHaveAttribute('aria-selected', 'true');
  expect(screen.getByRole('tab', { name: '转化漏斗报表' })).toBeInTheDocument();
});
```

Add tests that, after opening the funnel tab: default controls show 新客 and 有效客户; the main dimension selector named `漏斗主维度` shows 咨询师; the header `新客有效客户数` exists; changing both filters to 全部 yields `客户数`; and changing the funnel filter does not alter the performance report’s previously selected customer scope after switching back.

- [ ] **Step 2: 运行测试，确认当前页面失败**

Run: `npm test -- src/App.test.tsx`

Expected: FAIL，缺少顶部 Tab 和漏斗表头。

- [ ] **Step 3: 最小化改造 `App.tsx` 以装配两个状态域**

```tsx
const [activeReport, setActiveReport] = useState<'performance' | 'funnel'>('performance');
const [funnelFilters, setFunnelFilters] = useState<FunnelFilters>(defaultFunnelFilters);
const [funnelPrimaryDimension, setFunnelPrimaryDimension] =
  useState<FunnelDimensionKey>('consultant');
const [selectedFunnelBreakdownRow, setSelectedFunnelBreakdownRow] =
  useState<FunnelSummaryRow | null>(null);
```

Compute `filteredFunnelCustomers` from `filterFunnelCustomers(mockFunnelCustomers, funnelFilters)` and `funnelRows` from `buildFunnelSummaryRows(filteredFunnelCustomers, funnelFilters.dateRange!, funnelPrimaryDimension)`. In the funnel Tab, render the dedicated filter bar, a labeled Select (`aria-label="漏斗主维度"`), `FunnelTable`, and `FunnelBreakdownDrawer`. Reset only `selectedFunnelBreakdownRow` when a funnel query or funnel primary dimension changes.

Keep the existing performance component tree intact inside the performance Tab, including `PerformanceDetailDrawer`. Do not pass performance filters into any funnel component and do not pass funnel filters into performance components.

- [ ] **Step 4: 运行完整验证**

Run: `npm test && npm run build`

Expected: 全部 Vitest 测试通过，TypeScript 与 Vite 构建成功。

Then start the local preview and manually verify: open 转化漏斗报表 → 默认咨询师与新客有效表头 → 筛选全部/全部后无前缀 → 按部门打开维度拆解并看到咨询师 Tab → 切回业绩报表仍保留原筛选。

- [ ] **Step 5: 提交页面接入**

```bash
git add src/App.tsx src/App.test.tsx src/styles.css
git commit -m "feat: add conversion funnel report"
```
