# 日期维度按时间正序排列 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 日期维度按时间正序（从早到晚）排列，其余维度保持按报备金额降序。

**Architecture:** 在 `aggregate()` 中新增 `dimension` 参数，根据维度选择排序方式。`buildSummaryRows` 传入 `primaryDimension`，`buildBreakdownRows` 传入 `query.breakdownDimension`。UI 层无变更。

**Tech Stack:** TypeScript, Vitest

---

### Task 1: 修改 `aggregate()` 排序逻辑 + 调用方传参

**Files:**
- Modify: `src/domain/analytics.ts`

- [ ] **Step 1: 给 `aggregate()` 新增 `dimension: DimensionKey` 参数**

在 `aggregate()` 函数签名中新增参数：

```ts
function aggregate(records: DealRecord[], dimension: DimensionKey): AggregateSummary[] {
```

文件第 39 行，将：
```ts
function aggregate(records: DealRecord[], dimension: DimensionKey): AggregateSummary[] {
```
保持不变即可——签名中已有 `dimension` 参数。

- [ ] **Step 2: 将排序改为条件分支**

找到文件第 113 行：
```ts
    .sort((left, right) => right.reportedAmount - left.reportedAmount);
```

替换为：
```ts
    .sort((left, right) => {
      if (dimension === 'date') {
        return left.value.localeCompare(right.value);
      }
      return right.reportedAmount - left.reportedAmount;
    });
```

- [ ] **Step 3: 提交**

```bash
git add src/domain/analytics.ts
git commit -m "feat: sort date dimension chronologically, others by amount desc"
```

---

### Task 2: 新增测试验证排序行为

**Files:**
- Modify: `src/domain/analytics.test.ts`

- [ ] **Step 1: 新增日期 summary 按时间正序测试**

在文件末尾（最后一个 `it(...)` 之后、`});` 之前）新增：

```ts
  it('sorts date summary rows chronologically ascending', () => {
    const rows = buildSummaryRows(mockDeals, 'date');

    const dates = rows.map((row) => row.primaryDimensionValue);
    expect(dates).toEqual([
      '2026-06-02',
      '2026-06-05',
      '2026-06-06',
      '2026-06-09',
      '2026-06-11',
      '2026-06-13',
      '2026-06-17',
      '2026-06-20',
      '2026-06-22',
    ]);
  });
```

- [ ] **Step 2: 新增日期 breakdown 按时间正序测试**

继续追加：

```ts
  it('sorts date breakdown rows chronologically ascending', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'date',
    });

    const dates = rows.map((row) => row.breakdownDimensionValue);
    expect(dates).toEqual([
      '2026-06-02',
      '2026-06-06',
      '2026-06-11',
      '2026-06-17',
      '2026-06-20',
    ]);
  });
```

- [ ] **Step 3: 运行测试验证通过**

```bash
npx vitest run src/domain/analytics.test.ts
```
Expected: 7 tests PASS (4 existing + 2 new date sort + 1 existing date content test)

- [ ] **Step 4: 提交**

```bash
git add src/domain/analytics.test.ts
git commit -m "test: verify date dimension chronological sort order"
```

---

### Task 3: 全量回归验证

- [ ] **Step 1: 运行全部测试**

```bash
npx vitest run
```
Expected: All tests pass（19 tests: 7 analytics + 7 App.test + 5 dimensions.test）

- [ ] **Step 2: 构建验证**

```bash
npx tsc --noEmit
```
Expected: 无类型错误

- [ ] **Step 3: 检查非日期维度的排序未被影响**

确认 `consultant`、`channel` 等维度的现有测试仍通过，这些测试验证了按 `reportedAmount` 降序的排序行为。
