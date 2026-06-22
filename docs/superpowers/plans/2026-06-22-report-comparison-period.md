# 业绩与转化漏斗报表对比时间 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为业绩报表与转化漏斗报表增加可清空的对比时间，并在主列表和维度拆解中展示本期指标相对对比期的增减幅。

**Architecture:** 两个报表继续保留各自的筛选与指标聚合；每次查询分别构建本期和对比期数据，再由领域层按维度行合并并计算变化值。日期行按日号匹配（例如 6 月 1 日对 5 月 1 日），其他维度按维度值匹配；共享列渲染只在对比期存在时显示双行指标格。

**Tech Stack:** React 19、TypeScript、Ant Design 5、dayjs、Vitest、Testing Library、Vite。

## Global Constraints

- 只改“业绩报表”和“转化漏斗报表”；业绩明细抽屉不显示增减幅、不改表结构。
- 对比时间可清空；统计时间改变时不自动修改对比时间；两者仅在点击“查询”时提交。
- 默认对比期为上月 1 日至上月同日；上月无同日时取该月最后一天。
- 增减幅公式固定为 `(本期 - 对比期) / 对比期`，包括原本为百分比的字段，保留一位小数。
- 对比值为 `0`、`null` 或无匹配维度行时，增减幅为 `null` 并显示 `—`。
- 上涨绿、下降红、持平灰；对比期为空时仍为当前的一行数值展示。
- 当前工作区已有已暂存的 `src/components/FunnelFilterBar.tsx` 改动；实施开始前先确认其意图，提交时绝不混入无关变更。

---

## File Structure

| 文件 | 责任 |
| --- | --- |
| `src/domain/comparison.ts` | 默认对比日期、数值增减幅、日期行匹配键的纯函数。 |
| `src/domain/comparison.test.ts` | 月末截断、增减幅和日期行匹配的单元测试。 |
| `src/data/mockDeals.ts` | 给业绩模拟成交记录补充客户创建日期，供不同周期动态判定新客/老客。 |
| `src/domain/filters.ts` | 依据当前 `dateRange` 和 `customerCreatedAt` 筛选新客/老客。 |
| `src/domain/analytics.ts` | 合并业绩本期/对比期汇总或拆解行。 |
| `src/domain/funnel.ts` | 合并漏斗本期/对比期汇总或拆解行。 |
| `src/domain/reportMetrics.tsx`、`src/domain/funnelMetrics.tsx` | 在可选对比数据存在时渲染指标格第二行。 |
| `src/components/FilterBar.tsx`、`src/components/FunnelFilterBar.tsx` | 编辑态对比时间组件、默认值、查询和重置。 |
| `src/App.tsx` | 维护已提交的对比日期，分别构建两期数据，并传给表格/抽屉。 |
| `src/components/BreakdownDrawer.tsx`、`src/components/FunnelBreakdownDrawer.tsx` | 在维度拆解中构建和展示对比行。 |
| `src/styles.css` | 双行指标格和增减幅的紧凑样式与颜色。 |
| `src/domain/*.test.ts*`、`src/App.test.tsx` | 领域计算、组件展示、筛选交互和“明细不变”的回归测试。 |

## Task 1: 建立对比周期和动态客户范围基础

**Files:**
- Create: `src/domain/comparison.ts`
- Test: `src/domain/comparison.test.ts`
- Modify: `src/data/mockDeals.ts`
- Modify: `src/domain/filters.ts`
- Test: `src/domain/filters.test.ts`

**Interfaces:**
- Produces `getDefaultComparisonDateRange(today: Dayjs): [string, string]`、`calculateChange(current: number | null, comparison: number | null): number | null` 和 `getDateComparisonKey(date: string): string`。
- Extends `DealRecord` with `customerCreatedAt: string`.
- Keeps `filterDealRecords(records, filters)` public signature unchanged; its new/old-customer branch reads `filters.dateRange` and `record.customerCreatedAt`.

- [ ] **Step 1: 写入对比周期和客户范围的失败测试。**

  在 `src/domain/comparison.test.ts` 增加：

  ```ts
  it('uses the last day of February for a March 31 default', () => {
    expect(getDefaultComparisonDateRange(dayjs('2026-03-31'))).toEqual([
      '2026-02-01', '2026-02-28',
    ]);
  });

  it('returns null when comparison is zero or absent', () => {
    expect(calculateChange(12, 0)).toBeNull();
    expect(calculateChange(12, null)).toBeNull();
    expect(calculateChange(0, 10)).toBe(-1);
  });
  ```

  在 `src/domain/filters.test.ts` 追加两笔不同创建日期、相同成交日期的记录，断言同一记录在六月范围中为新客、在五月范围中为老客：

  ```ts
  expect(filterDealRecords(records, { ...filters, dateRange: ['2026-06-01', '2026-06-30'], customerScope: 'currentNewCustomers' }))
    .toHaveLength(1);
  expect(filterDealRecords(records, { ...filters, dateRange: ['2026-05-01', '2026-05-31'], customerScope: 'existingCustomers' }))
    .toHaveLength(1);
  ```

- [ ] **Step 2: 运行测试，确认失败。**

  Run: `npm test -- src/domain/comparison.test.ts src/domain/filters.test.ts`

  Expected: FAIL，缺少 `comparison.ts` 导出且 `DealRecord` 未提供 `customerCreatedAt`。

- [ ] **Step 3: 实现最小的纯函数和动态新老客筛选。**

  创建 `src/domain/comparison.ts`，其核心实现应为：

  ```ts
  export function getDefaultComparisonDateRange(today: Dayjs): [string, string] {
    const previousMonth = today.subtract(1, 'month');
    return [
      previousMonth.startOf('month').format('YYYY-MM-DD'),
      previousMonth.date(Math.min(today.date(), previousMonth.daysInMonth())).format('YYYY-MM-DD'),
    ];
  }

  export function calculateChange(current: number | null, comparison: number | null) {
    if (current === null || comparison === null || comparison === 0) return null;
    return (current - comparison) / comparison;
  }

  export function getDateComparisonKey(date: string) {
    return dayjs(date).format('DD');
  }
  ```

  为所有 `mockDeals` 补入真实格式的 `customerCreatedAt`；保持六月默认期间的既有新客/老客预期不变。将 `matchesCustomerScope` 改为接收 `dateRange`，其中新客为创建日期在闭区间内，老客为创建日期早于开始日期；`dateRange === null` 时保持“全部通过”。

- [ ] **Step 4: 运行测试，确认通过。**

  Run: `npm test -- src/domain/comparison.test.ts src/domain/filters.test.ts`

  Expected: PASS。

- [ ] **Step 5: 提交该独立基础任务。**

  ```bash
  git add src/domain/comparison.ts src/domain/comparison.test.ts src/data/mockDeals.ts src/domain/filters.ts src/domain/filters.test.ts
  git commit -m "feat: add comparison period helpers"
  ```

## Task 2: 让业绩聚合和指标列携带对比增减幅

**Files:**
- Modify: `src/domain/analytics.ts`
- Test: `src/domain/analytics.test.ts`
- Modify: `src/domain/reportMetrics.tsx`
- Test: `src/domain/reportMetrics.test.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces `type ReportMetricKey = keyof ReportMetricValue`、`ReportComparableSummaryRow`、`ReportComparableBreakdownRow`；两个行类型均为现有行类型加上 `comparison: Partial<Record<ReportMetricKey, number | null>> | null`。
- Produces `attachReportComparison<T extends ReportSummaryRow | ReportBreakdownRow>(currentRows, comparisonRows, currentRange, comparisonRange, valueKey): T[]`。
- Extends `buildReportMetricColumns(filters, hasComparison)`；`hasComparison` 为 `true` 时读取行上的 `comparison` 以绘制第二行。

- [ ] **Step 1: 写入业绩对比行与双行单元格的失败测试。**

  在 `src/domain/analytics.test.ts` 加入人为的本期/对比期咨询师行，断言：

  ```ts
  expect(rows.find((row) => row.primaryDimensionValue === '张敏')?.comparison).toMatchObject({
    reportedAmount: 0.25,
    customerCount: null,
  });
  ```

  在 `src/domain/reportMetrics.test.tsx` 调用 `buildReportMetricColumns(allFilters, true)`，直接调用首列的 `render`，断言渲染结果含本期 `¥12,000` 与 `↑ 25.0%`；对 `null` 变化值断言第二行文本为 `—`。

- [ ] **Step 2: 运行测试，确认失败。**

  Run: `npm test -- src/domain/analytics.test.ts src/domain/reportMetrics.test.tsx`

  Expected: FAIL，尚未导出对比行合并函数，列构建函数也未接收第二个参数。

- [ ] **Step 3: 合并业绩行并实现双行单元格。**

  在 `analytics.ts` 用已有 `buildReportSummaryRows` / `buildReportBreakdownRows` 分别生成两期行；不要复制指标计算。新增合并函数：非日期维度以 `primaryDimensionValue` 或 `breakdownDimensionValue` 查找；日期维度使用 Task 1 的 `getDateComparisonKey` 查找对比行。仅保留本期行，不新增“只存在于对比期”的行。

  `comparison` 的每个键来自当前列的七个指标，值通过 `calculateChange` 得出。`reportMetrics.tsx` 的渲染形态固定为：

  ```tsx
  <div className="metric-cell">
    <div>{formatMetricValue(value, metric.format)}</div>
    {hasComparison && (
      <div className={change === null ? 'metric-change is-unavailable' : change > 0 ? 'metric-change is-up' : change < 0 ? 'metric-change is-down' : 'metric-change is-flat'}>
        {change === null ? '—' : `${change > 0 ? '↑ ' : change < 0 ? '↓ ' : ''}${formatPercent(Math.abs(change))}`}
      </div>
    )}
  </div>
  ```

  在 `styles.css` 增加紧凑的第二行样式（小字号、行高 18px）及 `.is-up` 绿色、`.is-down` 红色、`.is-flat` 灰色；不更改表格其他视觉规则。

- [ ] **Step 4: 运行测试，确认通过。**

  Run: `npm test -- src/domain/analytics.test.ts src/domain/reportMetrics.test.tsx`

  Expected: PASS。

- [ ] **Step 5: 提交业绩领域任务。**

  ```bash
  git add src/domain/analytics.ts src/domain/analytics.test.ts src/domain/reportMetrics.tsx src/domain/reportMetrics.test.tsx src/styles.css
  git commit -m "feat: compare performance report metrics"
  ```

## Task 3: 让漏斗聚合和指标列携带对比增减幅

**Files:**
- Modify: `src/domain/funnel.ts`
- Test: `src/domain/funnel.test.ts`
- Modify: `src/domain/funnelMetrics.tsx`
- Test: `src/domain/funnelMetrics.test.tsx`

**Interfaces:**
- Produces `FunnelComparableSummaryRow`、`FunnelComparableBreakdownRow`，每个类型保留现有字段并新增 `comparison`。
- Produces `attachFunnelComparison(currentRows, comparisonRows, currentRange, comparisonRange, valueKey)`。
- Extends `buildFunnelMetricColumns(filters, hasComparison)`，行为与业绩列一致。

- [ ] **Step 1: 写入漏斗对比行的失败测试。**

  在 `src/domain/funnel.test.ts` 使用两个最小客户数组构造本期与对比期，验证客户数的增长和转化率的相对变化：

  ```ts
  expect(rows[0].comparison).toMatchObject({
    customerCount: 0.5,
    conversionRate: 0.25,
  });
  ```

  再加一例对比期为 0 客户、或当前维度未在对比期出现时，断言 `comparison.customerCount` 为 `null`。在 `funnelMetrics.test.tsx` 验证 `hasComparison=true` 时存在第二行的 `↑ 50.0%`。

- [ ] **Step 2: 运行测试，确认失败。**

  Run: `npm test -- src/domain/funnel.test.ts src/domain/funnelMetrics.test.tsx`

  Expected: FAIL，漏斗行没有 `comparison`，漏斗指标列没有对比渲染参数。

- [ ] **Step 3: 用现有漏斗聚合函数生成两期行并合并。**

  `buildFunnelSummaryRows` 和 `buildFunnelBreakdownRows` 保持负责单周期指标。新增合并函数按 Task 2 相同的规则保留本期行、合并 12 个漏斗指标，调用 `calculateChange`；日期维度使用相同的日期匹配键。扩展 `funnelMetrics.tsx`，重用与业绩相同的双行 DOM 类名和格式化规则。

- [ ] **Step 4: 运行测试，确认通过。**

  Run: `npm test -- src/domain/funnel.test.ts src/domain/funnelMetrics.test.tsx`

  Expected: PASS。

- [ ] **Step 5: 提交漏斗领域任务。**

  ```bash
  git add src/domain/funnel.ts src/domain/funnel.test.ts src/domain/funnelMetrics.tsx src/domain/funnelMetrics.test.tsx
  git commit -m "feat: compare funnel report metrics"
  ```

## Task 4: 接入筛选栏、主列表和维度拆解

**Files:**
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/components/FunnelFilterBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/SummaryTable.tsx`
- Modify: `src/components/FunnelTable.tsx`
- Modify: `src/components/BreakdownDrawer.tsx`
- Modify: `src/components/FunnelBreakdownDrawer.tsx`
- Test: `src/App.test.tsx`

**Interfaces:**
- Extends `SalesDashboardFilters` and `FunnelFilters` with `comparisonDateRange: [string, string] | null`.
- Adds `comparisonRecords`, `comparisonBaselineRecords`, and `comparisonDateRange` props to `BreakdownDrawer`; adds `comparisonRecords` and `comparisonDateRange` props to `FunnelBreakdownDrawer`.
- Adds `hasComparison: boolean` to `SummaryTable` and `FunnelTable`.

- [ ] **Step 1: 写入端到端交互的失败测试。**

  在 `src/App.test.tsx` 新增以下断言：

  ```ts
  it('keeps a cleared comparison range after the statistic range changes', async () => {
    render(<App />);
    const comparison = screen.getByText('对比时间').closest('.ant-form-item')!;
    fireEvent.mouseEnter(comparison);
    fireEvent.mouseDown(comparison.querySelector('.ant-picker-clear')!);
    fireEvent.click(comparison.querySelector('.ant-picker-clear')!);
    await setDateRange(user);
    expect(comparison.querySelectorAll<HTMLInputElement>('input')[0].value).toBe('');
  });
  ```

  同一文件再覆盖：默认显示对比时间、重置恢复默认对比时间、选择对比时间并查询后主列表出现 `↑`/`↓`/`—`，漏斗 Tab 和两个拆解 Drawer 也出现第二行，而点击“业绩明细”后抽屉内不出现 `.metric-change`。

- [ ] **Step 2: 运行测试，确认失败。**

  Run: `npm test -- src/App.test.tsx`

  Expected: FAIL，页面尚无“对比时间”标签和增减幅元素。

- [ ] **Step 3: 接入已提交筛选状态和两期数据。**

  在两个筛选类型、`defaultFilters`、`defaultFunnelFilters` 及各自重置默认值中加入：

  ```ts
  comparisonDateRange: getDefaultComparisonDateRange(dayjs()),
  ```

  在两个 FilterBar 的“统计时间”后放置 `allowClear` 的“对比时间” `RangePicker`；它只更新 `localFilters.comparisonDateRange`。统计时间的 `onChange` 不触及该字段。每个 RangePicker 将 `null` 映射为 `undefined`，清空事件写回 `null`。

  在 `App.tsx` 为两种报表分别 `useMemo` 出对比期筛选对象（仅将 `dateRange` 替换成 `comparisonDateRange`）、对比期筛选记录和对比期汇总行。对比时间为 `null` 时不调用合并函数，传给所有表格的 `hasComparison` 为 `false`。抽屉获得同一组对比数据，以便它在各 Tab 内重新构建对应行。

  主列表的 `scroll.x` 维持现状；方案 A 不增加列。业绩明细组件及其 `detailColumns` 不传入任何对比 props。

- [ ] **Step 4: 运行页面测试和完整质量门禁。**

  Run: `npm test -- src/App.test.tsx`

  Expected: PASS。

  Run: `npm test`

  Expected: PASS，所有 Vitest 测试通过。

  Run: `npm run build`

  Expected: PASS，TypeScript 编译和 Vite 构建成功。

- [ ] **Step 5: 在浏览器手动验收并提交。**

  Run: `npm run dev -- --host 127.0.0.1`

  验收：业绩与漏斗的默认对比期为上月 1 日至上月同日；修改统计时间不联动；清空对比期后表格回到单行；选择对比期后主列表和维度拆解显示彩色第二行；业绩明细不变。

  ```bash
  git add src/components/FilterBar.tsx src/App.tsx src/components/SummaryTable.tsx src/components/FunnelTable.tsx src/components/BreakdownDrawer.tsx src/components/FunnelBreakdownDrawer.tsx src/App.test.tsx
  git add src/components/FunnelFilterBar.tsx
  git commit -m "feat: add report comparison period"
  ```

  提交前检查 `git diff --cached --name-only`，仅当 `src/components/FunnelFilterBar.tsx` 的已暂存差异确实属于该功能时才纳入；否则保留其原有暂存状态并将本任务的同文件改动单独暂存。

## Final Verification

- [ ] Run: `npm test`
- [ ] Run: `npm run build`
- [ ] Run: `git status --short`
- [ ] 验证最终提交未包含无关文件，且既存暂存改动仍被保留或已由其所有者处理。
