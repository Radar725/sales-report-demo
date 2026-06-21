# 报表单页、新客字段与汇总维度 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将业绩统计页面收束为报表单页，在新客范围展示新客数和新客成交率，并支持不分维度的汇总行。

**Architecture:** 在维度与聚合层把 `total` 作为特殊主维度：它不读取单条记录的维度字段，而是把当前记录集或基准记录集整体聚合成唯一的“汇总”行。指标层显式输出新客总数和有成交的新客数，报表列工厂按客户范围决定是否插入新客列；页面层移除仪表盘 Tab，并在汇总行禁用拆解入口。

**Tech Stack:** React 18、TypeScript、Ant Design 5、Vitest、React Testing Library。

---

## 实施前提

当前工作区已有未提交的业务代码与测试改动。实施时不得重置、覆盖或一并暂存这些改动；应先用 `superpowers:using-git-worktrees` 建立基于当前 `HEAD`（包含规格提交 `0ba4480`）的隔离工作区，再开始下列任务。

## 文件结构

| 文件 | 职责 |
| --- | --- |
| `src/domain/dimensions.ts` | 声明主维度键与“汇总”选项，并保证它不可作为拆解来源。 |
| `src/domain/dimensions.test.ts` | 锁定主维度选项与汇总不可拆解的规则。 |
| `src/domain/metrics.tsx` | 扩展指标值类型，承载新客总数与有成交新客数。 |
| `src/domain/analytics.ts` | 计算新客指标，并让汇总主维度生成唯一行、返回全部明细。 |
| `src/domain/analytics.test.ts` | 验证汇总行、新客指标和零分母。 |
| `src/domain/reportMetrics.tsx` | 在上报业绩后按条件插入新客列。 |
| `src/domain/reportMetrics.test.tsx` | 验证列顺序与显示条件。 |
| `src/components/SummaryTable.tsx` | 根据行是否为汇总禁用拆解按钮。 |
| `src/components/BreakdownDrawer.tsx` | 接收并传递新客列显示条件。 |
| `src/App.tsx` | 移除仪表盘/Tabs，主维度默认或可选为汇总，并连接新的显示条件。 |
| `src/App.test.tsx` | 验证单页、汇总行、置灰拆解、新客列与明细行为。 |

### Task 1: 建立“汇总”主维度与聚合规则

**Files:**

- Modify: `src/domain/dimensions.ts`
- Modify: `src/domain/dimensions.test.ts`
- Modify: `src/domain/analytics.ts`
- Modify: `src/domain/analytics.test.ts`

- [ ] **Step 1: 为汇总维度写失败测试**

  在 `src/domain/dimensions.test.ts` 增加：

  ```ts
  it('lists total as a primary dimension but never as a breakdown source', () => {
    expect(dimensions.map((dimension) => dimension.label)).toContain('汇总');
    expect(getBreakdownDimensions('total')).toEqual([]);
  });
  ```

  在 `src/domain/analytics.test.ts` 增加：

  ```ts
  it('builds one total report row and exposes every current record as its detail', () => {
    const rows = buildReportSummaryRows(mockDeals, mockDeals, 'total');

    expect(rows).toEqual([
      expect.objectContaining({
        key: 'total',
        primaryDimensionValue: '汇总',
        reportedAmount: 3490000,
        dealCount: 12,
      }),
    ]);
    expect(
      getDetailRecords(mockDeals, {
        primaryDimension: 'total',
        primaryDimensionValue: '汇总',
      }).map((record) => record.id),
    ).toEqual(mockDeals.map((record) => record.id));
  });
  ```

- [ ] **Step 2: 运行失败测试**

  Run: `npm test -- src/domain/dimensions.test.ts src/domain/analytics.test.ts`

  Expected: FAIL，原因是 `total` 还不是合法的 `DimensionKey`，也没有汇总聚合行为。

- [ ] **Step 3: 以最小改动实现汇总维度**

  在 `src/domain/dimensions.ts` 中将 `total` 纳入 `DimensionKey`，并在 `dimensions` 首项加入：

  ```ts
  { key: 'total', label: '汇总', group: 'total' }
  ```

  将 `DimensionGroup` 扩展为包含 `'total'`，并在 `getBreakdownDimensions` 开头返回空数组：

  ```ts
  if (primaryKey === 'total') return [];
  ```

  在 `src/domain/analytics.ts` 中让 `aggregate` 在收到 `total` 时直接调用一次 `calculateMetrics(records)`：

  ```ts
  if (dimension === 'total') {
    return [{ value: '汇总', ...calculateMetrics(records) }];
  }
  ```

  在 `getDetailRecords` 中让 `total` 返回当前传入的全部记录：

  ```ts
  if (query.primaryDimension === 'total') return records;
  ```

  确保 `buildReportSummaryRows` 继续通过同一个 `aggregate` 函数生成当前行与基准行，使汇总行的条件占比使用完整基准记录集。

- [ ] **Step 4: 运行测试确认通过**

  Run: `npm test -- src/domain/dimensions.test.ts src/domain/analytics.test.ts`

  Expected: PASS。

- [ ] **Step 5: 提交维度与聚合规则**

  ```bash
  git add src/domain/dimensions.ts src/domain/dimensions.test.ts src/domain/analytics.ts src/domain/analytics.test.ts
  git commit -m "feat: add total report dimension"
  ```

### Task 2: 增加新客总数指标与条件列

**Files:**

- Modify: `src/domain/metrics.tsx`
- Modify: `src/domain/analytics.ts`
- Modify: `src/domain/analytics.test.ts`
- Modify: `src/domain/reportMetrics.tsx`
- Modify: `src/domain/reportMetrics.test.tsx`

- [ ] **Step 1: 写新客指标与列顺序的失败测试**

  在 `src/domain/analytics.test.ts` 增加：

  ```ts
  it('keeps total new customers separate from converted new customers', () => {
    const rows = buildReportSummaryRows(
      mockDeals.filter((record) => record.customerCreatedInPeriod),
      mockDeals,
      'consultant',
    );

    expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
      newCustomerCount: 4,
      convertedNewCustomerCount: 3,
      newCustomerConversionRate: 0.75,
    });
  });
  ```

  在 `src/domain/reportMetrics.test.tsx` 增加：

  ```ts
  it('inserts new-customer columns immediately after reported amount only for new-customer scope', () => {
    expect(buildReportMetricColumns({ showContributionRates: false, showNewCustomerMetrics: true })
      .map((column) => column.key)).toEqual([
        'reportedAmount',
        'newCustomerCount',
        'newCustomerConversionRate',
        'dealCount',
        'customerCount',
        'averageDealAmount',
      ]);
  });
  ```

- [ ] **Step 2: 运行失败测试**

  Run: `npm test -- src/domain/analytics.test.ts src/domain/reportMetrics.test.tsx`

  Expected: FAIL，原因是指标类型和列工厂尚未声明新字段或新的参数对象。

- [ ] **Step 3: 计算并输出两个不同的新客计数**

  在 `src/domain/metrics.tsx` 的 `MetricKey` 中新增：

  ```ts
  | 'newCustomerCount'
  | 'convertedNewCustomerCount'
  ```

  在 `calculateMetrics` 内使用两个变量，避免复用同一个名字：

  ```ts
  const convertedNewCustomerCount = new Set(
    newCustomerRecords.map((record) => record.customerId),
  ).size;
  const newCustomerCount = groupRecords.length === 0
    ? 0
    : Math.max(...groupRecords.map((record) => record.createdCustomerCountInPeriod));
  ```

  并在返回值中写入：

  ```ts
  newCustomerCount,
  convertedNewCustomerCount,
  newCustomerConversionRate: safeDivide(convertedNewCustomerCount, newCustomerCount),
  ```

  保留既有的 `newCustomerAmountContributionRate` 计算，不改变其语义。

- [ ] **Step 4: 让列工厂按新客范围插入两列**

  将 `buildReportMetricColumns` 参数改为对象，避免两个布尔参数语义不清：

  ```ts
  type ReportColumnOptions = {
    showContributionRates: boolean;
    showNewCustomerMetrics: boolean;
  };
  ```

  同时将 `ReportMetricValue` 的 `Pick<MetricValue, ...>` 补充为包含 `newCustomerCount` 和 `newCustomerConversionRate`，并给泛型设默认值，确保单元测试和调用方都能推导出有效列类型：

  ```ts
  export function buildReportMetricColumns<T extends ReportMetricValue = ReportMetricValue>(
    options: ReportColumnOptions,
  ): ColumnsType<T> {
  ```

  定义并插入列：

  ```ts
  const newCustomerMetrics: ReportMetricDefinition[] = [
    { key: 'newCustomerCount', label: '新客数', format: 'integer', width: 80 },
    { key: 'newCustomerConversionRate', label: '新客成交率', format: 'percent', width: 96 },
  ];

  const metrics = [
    baseMetrics[0],
    ...(showNewCustomerMetrics ? newCustomerMetrics : []),
    ...baseMetrics.slice(1),
    ...(showContributionRates ? contributionMetrics : []),
  ];
  ```

  `render` 保持 `null` 显示 `—`；新客成交率数值为 `0` 时正常显示 `0.0%`。本任务只由 `showNewCustomerMetrics` 决定列显示，调用方负责在客户统计范围为 `currentNewCustomers` 时传入 `true`。

- [ ] **Step 5: 运行测试确认通过**

  Run: `npm test -- src/domain/analytics.test.ts src/domain/reportMetrics.test.tsx`

  Expected: PASS。

- [ ] **Step 6: 提交新客指标与列定义**

  ```bash
  git add src/domain/metrics.tsx src/domain/analytics.ts src/domain/analytics.test.ts src/domain/reportMetrics.tsx src/domain/reportMetrics.test.tsx
  git commit -m "feat: show new-customer report metrics"
  ```

### Task 3: 收束为报表单页并连接表格状态

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/components/SummaryTable.tsx`
- Modify: `src/components/BreakdownDrawer.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: 为单页、汇总操作与新客列写失败测试**

  在 `src/App.test.tsx` 中移除 `openReportTab` 辅助函数和所有对“报表”Tab 的点击。新增：

  ```ts
  it('renders the report directly without dashboard tabs', () => {
    render(<App />);

    expect(screen.queryByRole('tab', { name: '仪表盘' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '报表' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: '主维度' })).toBeInTheDocument();
  });

  it('shows one total row, disables its breakdown, and opens all current detail records', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '汇总' }));

    expect(screen.getByRole('cell', { name: '汇总' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '业绩拆解' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '业绩明细' }));
    expect(screen.getByRole('dialog', { name: '汇总 · 业绩明细' })).toBeInTheDocument();
  });
  ```

  在现有新客筛选测试查询后追加：

  ```ts
  expect(screen.getByRole('columnheader', { name: '新客数' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '新客成交率' })).toBeInTheDocument();
  ```

  并在默认范围测试中追加两项 `queryByRole` 断言，确认这两列不存在。

- [ ] **Step 2: 运行失败测试**

  Run: `npm test -- src/App.test.tsx`

  Expected: FAIL，因为页面仍渲染 Tabs、汇总行尚不存在、表格也尚未传入新客列开关。

- [ ] **Step 3: 移除仪表盘 Tab 并传递表格显示状态**

  在 `src/App.tsx`：

  - 删除 `Tabs`、`DashboardOverview`、`buildDashboardSummary` 及 `dashboardSummary`。
  - 直接渲染主维度工具栏和 `SummaryTable`。
  - 计算新客列条件：

    ```ts
    const showNewCustomerMetrics = filters.customerScope === 'currentNewCustomers';
    ```

  - 向 `SummaryTable` 和 `BreakdownDrawer` 传入 `showNewCustomerMetrics`。

  在 `SummaryTable`：

  - 将 `showNewCustomerMetrics` 加入 props，并调用：

    ```ts
    buildReportMetricColumns<ReportSummaryRow>({
      showContributionRates,
      showNewCustomerMetrics,
    })
    ```

  - 让汇总行的拆解按钮使用：

    ```tsx
    <Button type="link" disabled={primaryDimension.key === 'total'} /* 保留原 onClick */>
      业绩拆解
    </Button>
    ```

  在 `BreakdownDrawer`：

  - 将 `showNewCustomerMetrics` 加入 props，并用相同的对象参数调用列工厂。
  - 不为 `total` 增加特殊渲染分支；其按钮已经不可触发，而 `getBreakdownDimensions('total')` 返回空数组。

- [ ] **Step 4: 运行组件测试确认通过**

  Run: `npm test -- src/App.test.tsx`

  Expected: PASS。

- [ ] **Step 5: 提交单页与交互改动**

  ```bash
  git add src/App.tsx src/components/SummaryTable.tsx src/components/BreakdownDrawer.tsx src/App.test.tsx
  git commit -m "feat: simplify report page and add total row"
  ```

### Task 4: 全量回归与构建验证

**Files:**

- Modify: 仅在测试或类型检查暴露本次改动造成的问题时，修改上述任务已列出的文件。

- [ ] **Step 1: 执行完整测试套件**

  Run: `npm test`

  Expected: PASS，且所有既有筛选、拆解、明细与新增汇总/新客列测试通过。

- [ ] **Step 2: 执行生产构建**

  Run: `npm run build`

  Expected: PASS，TypeScript 类型检查与 Vite 构建均无错误。

- [ ] **Step 3: 检查改动范围与工作树**

  Run: `git diff --check && git status --short`

  Expected: 无空白错误；仅包含本计划列出的源码和测试文件，以及对应提交。

- [ ] **Step 4: 提交验证期间必要的修正（如有）**

  ```bash
  git add src
  git commit -m "test: verify report total dimension"
  ```

  若前两步无任何修正，不创建空提交。

## 自检

- 规格覆盖：Task 1 覆盖汇总唯一行、汇总明细和不可拆解；Task 2 覆盖新客数、成交率、列顺序与零分母；Task 3 覆盖移除仪表盘/Tabs、页面行为和抽屉列；Task 4 覆盖全量测试、构建与改动检查。
- 占位检查：计划不含未定项，所有测试、实现、命令和提交步骤均已写明。
- 类型一致性：`total` 是唯一新增的 `DimensionKey`；`newCustomerCount`、`convertedNewCustomerCount` 和 `newCustomerConversionRate` 由指标层声明并由报表行继承；`ReportMetricValue` 包含渲染所需的新客字段，列工厂统一接收 `ReportColumnOptions`。
