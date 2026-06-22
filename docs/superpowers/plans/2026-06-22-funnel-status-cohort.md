# 转化漏斗状态 cohort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 让转化漏斗报表按录单客户 cohort 与客户当前状态统计七项阶段数和六项阶段率，并移除客户统计范围。

**Architecture:** 漏斗领域模块按 customerCreatedAt 过滤 cohort，以唯一状态层级映射计算指标。筛选、主表、拆解和对比期复用该领域结果，业绩报表保持不变。

**Tech Stack:** React 18、TypeScript、Ant Design 5、dayjs、Vitest、Testing Library。

## Global Constraints

- 不修改业绩报表。
- 漏斗筛选仅保留录单时间、对比时间、客户类型、咨询师、渠道。
- 录单时间和日期主维度均使用 customerCreatedAt。
- 指标使用当前 status；不使用任何动作日期。
- 状态顺序：待加微、已加微未派单、派单未邀约、邀约未到院、到院未成交、首次成交、持续复购。
- 六个阶段率的分母都是录单客户数；零分母展示 —。
- 当前期和对比期均按各自 cohort、截至当前的状态计算。

---

## File Structure

| 文件 | 职责 |
| --- | --- |
| src/data/mockFunnelCustomers.ts | 客户录单时间、状态和归属数据。 |
| src/domain/funnel.ts | 状态层级、筛选、聚合、对比和拆解。 |
| src/domain/funnel.test.ts | 漏斗领域单元测试。 |
| src/domain/funnelMetrics.tsx | 固定指标列和变化渲染。 |
| src/domain/funnelMetrics.test.tsx | 指标列测试。 |
| src/components/FunnelFilterBar.tsx | 漏斗筛选栏。 |
| src/components/FunnelTable.tsx | 主表与拆解入口。 |
| src/components/FunnelBreakdownDrawer.tsx | 拆解表。 |
| src/components/FunnelTable.test.tsx | 主表操作测试。 |
| src/App.tsx | 状态与组件接入。 |
| src/App.test.tsx | 页面集成测试。 |

### Task 1: 建立当前状态漏斗数据域

**Files:**
- Modify: src/data/mockFunnelCustomers.ts
- Modify: src/domain/funnel.ts
- Modify: src/domain/funnel.test.ts

**Interfaces:**
- Produces FunnelCustomerStatus 和带 status 的 FunnelCustomerRecord。
- Produces无 customerScope 的 FunnelFilters。
- Produces filterFunnelCustomers(records, filters)、buildFunnelSummaryRows(records, dimension)、buildFunnelBreakdownRows(records, query)。
- 聚合行包含 recordedCustomerCount、addedWechatCustomerCount、dispatchedCustomerCount、invitedCustomerCount、visitedCustomerCount、convertedCustomerCount、repurchasedCustomerCount 及六项对应比率。

- [ ] **Step 1: 写入失败的领域测试**

替换公共筛选和测试样本：

~~~ts
const filters: FunnelFilters = {
  dateRange: ['2026-06-01', '2026-06-30'],
  comparisonDateRange: null,
  customerType: 'valid',
  departments: [], consultants: [], channelCategories: [], channels: [],
};

it('counts statuses cumulatively', () => {
  const statuses: FunnelCustomerStatus[] = [
    'pendingWechat', 'wechatAdded', 'dispatched', 'invited',
    'visited', 'firstConverted', 'repurchased',
  ];
  const [row] = buildFunnelSummaryRows(
    statuses.map((status, index) => makeCustomer(String(index), status)),
    'total',
  );
  expect(row).toMatchObject({
    recordedCustomerCount: 7, addedWechatCustomerCount: 6,
    dispatchedCustomerCount: 5, invitedCustomerCount: 4,
    visitedCustomerCount: 3, convertedCustomerCount: 2,
    repurchasedCustomerCount: 1, addedWechatRate: 6 / 7,
    conversionRate: 2 / 7, repurchaseRate: 1 / 7,
  });
});
~~~

增加测试：5 月 31 日录单客户不会进入 6 月 cohort；空集合六项比率均为 null；日期维度按录单时间分组；部门至咨询师拆解和对比期变化继续有效。

- [ ] **Step 2: 运行失败测试**

Run: npm test -- src/domain/funnel.test.ts

Expected: FAIL，旧模型没有 status、新指标字段或新聚合签名。

- [ ] **Step 3: 实现最小数据模型与聚合**

在数据文件中定义：

~~~ts
export type FunnelCustomerStatus =
  | 'pendingWechat' | 'wechatAdded' | 'dispatched' | 'invited'
  | 'visited' | 'firstConverted' | 'repurchased';

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
~~~

将当前和对比演示数据改成上述状态，至少各包含一个待加微、中间状态和持续复购客户。

在领域文件中定义唯一层级：

~~~ts
const statusLevel: Record<FunnelCustomerStatus, number> = {
  pendingWechat: 0, wechatAdded: 1, dispatched: 2, invited: 3,
  visited: 4, firstConverted: 5, repurchased: 6,
};

function hasReached(record: FunnelCustomerRecord, target: FunnelCustomerStatus) {
  return statusLevel[record.status] >= statusLevel[target];
}
~~~

filterFunnelCustomers 必须按 dateRange 过滤 customerCreatedAt，再叠加客户类型和归属条件。calculateFunnelMetrics 使用 hasReached 计算所有阶段数，六项比率都调用 ratio(阶段数, recordedCustomerCount)。删除动作日期、isInRange、countUnique、三项阶段间比率，且两个聚合函数都不再接收日期范围。

- [ ] **Step 4: 验证领域实现**

Run: npm test -- src/domain/funnel.test.ts

Expected: PASS，所有阶段客户数与阶段率从加微到复购单调不增，且阶段率不大于 1。

- [ ] **Step 5: 提交数据域**

~~~bash
git add src/data/mockFunnelCustomers.ts src/domain/funnel.ts src/domain/funnel.test.ts
git commit -m "feat: calculate funnel metrics from customer status"
~~~

### Task 2: 固定 13 个指标列并适配表格

**Files:**
- Modify: src/domain/funnelMetrics.tsx
- Modify: src/domain/funnelMetrics.test.tsx
- Modify: src/components/FunnelTable.tsx
- Modify: src/components/FunnelBreakdownDrawer.tsx
- Modify: src/components/FunnelTable.test.tsx

**Interfaces:**
- Produces buildFunnelMetricColumns(hasComparison)；不再接收筛选。
- 主表与抽屉不再接收 filters；抽屉不再接收日期范围。

- [ ] **Step 1: 写入失败的列定义测试**

~~~tsx
it('always exposes the thirteen status-cohort columns without a prefix', () => {
  expect(buildFunnelMetricColumns().map((column) => column.title)).toEqual([
    '录单客户数', '已加微客户数', '已派单客户数', '已邀约客户数',
    '已到院客户数', '已成交客户数', '已复购客户数',
    '加微率', '派单率', '邀约率', '到院率', '成交率', '复购率',
  ]);
});
~~~

将对比样本改为 recordedCustomerCount: 3 和 comparison: { recordedCustomerCount: 0.5 }。将 FunnelTable 测试行改为 13 个新字段并移除 filters prop。

- [ ] **Step 2: 运行失败测试**

Run: npm test -- src/domain/funnelMetrics.test.tsx src/components/FunnelTable.test.tsx

Expected: FAIL，旧列仍依赖客户范围且测试行没有新字段。

- [ ] **Step 3: 实现固定列和表格接口**

按此顺序定义列：录单客户数、已加微客户数、已派单客户数、已邀约客户数、已到院客户数、已成交客户数、已复购客户数、加微率、派单率、邀约率、到院率、成交率、复购率。

保留已有的空值 —、排序和对比变化渲染。删除 FunnelColumnFilters、前缀函数和三项阶段间指标。主表和抽屉调用：

~~~tsx
buildFunnelMetricColumns<FunnelSummaryRow>(hasComparison)
buildFunnelMetricColumns<FunnelBreakdownRow>(hasComparison)
~~~

抽屉对当前和对比数据均调用 buildFunnelBreakdownRows(records, query)。

- [ ] **Step 4: 验证表格接口**

Run: npm test -- src/domain/funnelMetrics.test.tsx src/components/FunnelTable.test.tsx && npm run build

Expected: PASS，TypeScript 不再引用 FunnelColumnFilters、客户范围或旧漏斗字段。

- [ ] **Step 5: 提交展示层**

~~~bash
git add src/domain/funnelMetrics.tsx src/domain/funnelMetrics.test.tsx src/components/FunnelTable.tsx src/components/FunnelBreakdownDrawer.tsx src/components/FunnelTable.test.tsx
git commit -m "feat: show fixed status cohort funnel columns"
~~~

### Task 3: 移除客户范围筛选并接入页面

**Files:**
- Modify: src/components/FunnelFilterBar.tsx
- Modify: src/App.tsx
- Modify: src/App.test.tsx

**Interfaces:**
- FunnelFilterBar 输入输出均使用无 customerScope 的 FunnelFilters。
- App 按当前与对比期的 customerCreatedAt 集合构造表格行。

- [ ] **Step 1: 写入失败的页面测试**

~~~tsx
async function openFunnelReport(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '转化漏斗报表' }));
}

it('uses recorded-at time and omits customer scope in the funnel filters', async () => {
  const user = userEvent.setup();
  render(<App />);
  await openFunnelReport(user);
  expect(screen.getByText('录单时间')).toBeInTheDocument();
  expect(screen.queryByText('客户统计范围')).not.toBeInTheDocument();
});

it('shows fixed status cohort columns in the funnel table', async () => {
  const user = userEvent.setup();
  render(<App />);
  await openFunnelReport(user);
  for (const name of ['录单客户数', '已加微客户数', '已复购客户数', '复购率']) {
    expect(screen.getByRole('columnheader', { name })).toBeInTheDocument();
  }
});
~~~

调整既有 Tab 隔离测试：漏斗操作不能改变业绩报表的客户统计范围，但漏斗页不再显示该控件。

- [ ] **Step 2: 运行失败测试**

Run: npm test -- src/App.test.tsx

Expected: FAIL，漏斗仍显示统计时间和客户统计范围。

- [ ] **Step 3: 接入新筛选和聚合**

删除 FunnelFilterBar 中 customerScopeOptions 和对应 Form.Item。默认值不含 customerScope，将标签改为录单时间：

~~~tsx
const defaultFunnelFiltersReset: FunnelFilters = {
  dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  comparisonDateRange: getDefaultComparisonDateRange(dayjs()),
  customerType: 'valid',
  departments: [], consultants: [], channelCategories: [], channels: [],
};
~~~

App 的 defaultFunnelFilters 同步删除 customerScope。聚合调用改为：

~~~ts
const currentRows = buildFunnelSummaryRows(filteredFunnelCustomers, funnelPrimaryDimension);
const comparisonRows = buildFunnelSummaryRows(
  comparisonFunnelCustomers,
  funnelPrimaryDimension,
);
~~~

从主表和抽屉删除 filters prop；从抽屉删除日期范围 props。保留对比时间、主维度、查询后关闭拆解抽屉与双 Tab 状态隔离。

- [ ] **Step 4: 验证页面集成**

Run: npm test -- src/App.test.tsx && npm test

Expected: PASS。漏斗页只有录单时间、对比时间、客户类型、咨询师、渠道，且固定显示 13 个无前缀指标列。

- [ ] **Step 5: 提交页面接入**

~~~bash
git add src/components/FunnelFilterBar.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: filter funnel by recorded customer cohort"
~~~

### Task 4: 最终回归检查

**Files:**
- Verify only: src/data/mockFunnelCustomers.ts, src/domain/funnel.ts, src/domain/funnelMetrics.tsx, src/components/FunnelFilterBar.tsx, src/components/FunnelTable.tsx, src/components/FunnelBreakdownDrawer.tsx, src/App.tsx

- [ ] **Step 1: 搜索旧漏斗口径残留**

Run:

~~~bash
rg -n 'customerScope|派单邀约率|邀约到院率|到院成交率|dispatchedAt|invitedAt|visitedAt|convertedAt' src/data/mockFunnelCustomers.ts src/domain/funnel.ts src/domain/funnelMetrics.tsx src/components/FunnelFilterBar.tsx src/components/FunnelTable.tsx src/components/FunnelBreakdownDrawer.tsx src/App.tsx
~~~

Expected: 无输出；业绩报表中的 customerScope 不在本检查范围。

- [ ] **Step 2: 执行完整自动化验证**

Run:

~~~bash
npm test
npm run build
~~~

Expected: 两条命令均以退出码 0 完成。

- [ ] **Step 3: 人工验收关键路径**

1. 漏斗页显示录单时间且没有客户统计范围。
2. 选择 2026-06-01 至 2026-06-30，确认 13 个表头无新客/老客前缀。
3. 确认已到院包含到院未成交、首次成交、持续复购；已成交仅包含后两种；已复购仅包含最后一种。
4. 打开维度拆解，确认抽屉列与主表完全相同。
5. 保留对比时间，确认当前值和变化值均展示；切回业绩报表，确认原筛选未变。

- [ ] **Step 4: 确认提交状态**

Run: git status --short

Expected: 无输出；Task 1–3 已提交时不创建空提交。
