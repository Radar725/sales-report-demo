# Sales Dimension Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add date, project category, and project as sales analysis dimensions, and replace same-group blocking with directed parent-to-child drilldown rules.

**Architecture:** Keep the current React + domain helper structure. Dimension metadata remains centralized in `src/domain/dimensions.ts`; aggregation stays in `src/domain/analytics.ts`, with a small dimension value resolver so the date dimension can read `dealDate` without duplicating data.

**Tech Stack:** React 18, TypeScript, Ant Design 5, Vitest, Testing Library, Vite.

---

## File Structure

- Modify `src/domain/dimensions.ts`
  - Owns dimension keys, groups, labels, hierarchy levels, and legal breakdown rules.
- Modify `src/domain/dimensions.test.ts`
  - Locks the new 9-dimension list and directed hierarchy behavior.
- Modify `src/data/mockDeals.ts`
  - Adds `projectCategory` and `project` to each mock deal.
  - Keeps `dealDate` as the source value for the date dimension.
- Modify `src/domain/analytics.ts`
  - Adds a dimension value resolver used by summary and breakdown aggregation.
- Modify `src/domain/analytics.test.ts`
  - Verifies aggregation works for date, project category, and project.
- Modify `src/App.test.tsx`
  - Verifies the UI exposes new dimensions and applies directed breakdown tabs.

---

### Task 1: Dimension Metadata And Directed Rules

**Files:**
- Modify: `src/domain/dimensions.test.ts`
- Modify: `src/domain/dimensions.ts`

- [ ] **Step 1: Replace dimension rule tests with failing tests**

Replace `src/domain/dimensions.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { dimensions, getBreakdownDimensions } from './dimensions';

function breakdownKeys(primaryKey: Parameters<typeof getBreakdownDimensions>[0]) {
  return getBreakdownDimensions(primaryKey).map((dimension) => dimension.key);
}

describe('dimension rules', () => {
  it('lists all supported primary dimensions', () => {
    expect(dimensions.map((dimension) => dimension.label)).toEqual([
      '日期',
      '部门',
      '咨询师',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });

  it('allows parent dimensions to break down into child dimensions', () => {
    expect(breakdownKeys('department')).toContain('consultant');
    expect(breakdownKeys('channelCategory')).toContain('channel');
    expect(breakdownKeys('city')).toContain('institution');
    expect(breakdownKeys('projectCategory')).toContain('project');
  });

  it('does not allow child dimensions to break down into parent dimensions', () => {
    expect(breakdownKeys('consultant')).not.toContain('department');
    expect(breakdownKeys('channel')).not.toContain('channelCategory');
    expect(breakdownKeys('institution')).not.toContain('city');
    expect(breakdownKeys('project')).not.toContain('projectCategory');
  });

  it('keeps cross-group breakdown dimensions available', () => {
    expect(breakdownKeys('consultant')).toEqual([
      '日期',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });

  it('allows date to break down by every business dimension but not itself', () => {
    expect(breakdownKeys('date')).toEqual([
      '部门',
      '咨询师',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });
});
```

- [ ] **Step 2: Run dimension tests to verify they fail**

Run:

```bash
npm test -- src/domain/dimensions.test.ts
```

Expected: FAIL because `date`, `projectCategory`, and `project` are not defined, and same-group hierarchy rules do not exist.

- [ ] **Step 3: Replace dimension metadata and rule implementation**

Replace `src/domain/dimensions.ts` with:

```ts
export type DimensionGroup = 'time' | 'org' | 'source' | 'location' | 'project';

export type DimensionKey =
  | 'date'
  | 'department'
  | 'consultant'
  | 'channelCategory'
  | 'channel'
  | 'city'
  | 'institution'
  | 'projectCategory'
  | 'project';

export type Dimension = {
  key: DimensionKey;
  label: string;
  group: DimensionGroup;
  level?: number;
};

export type RecordDimensionKey = Exclude<DimensionKey, 'date'>;

export const dimensions: Dimension[] = [
  { key: 'date', label: '日期', group: 'time' },
  { key: 'department', label: '部门', group: 'org', level: 1 },
  { key: 'consultant', label: '咨询师', group: 'org', level: 2 },
  { key: 'channelCategory', label: '渠道分类', group: 'source', level: 1 },
  { key: 'channel', label: '渠道', group: 'source', level: 2 },
  { key: 'city', label: '城市', group: 'location', level: 1 },
  { key: 'institution', label: '机构', group: 'location', level: 2 },
  { key: 'projectCategory', label: '项目分类', group: 'project', level: 1 },
  { key: 'project', label: '项目', group: 'project', level: 2 },
];

export function getDimension(key: DimensionKey) {
  return dimensions.find((dimension) => dimension.key === key)!;
}

function canBreakDown(primaryDimension: Dimension, breakdownDimension: Dimension) {
  if (primaryDimension.key === breakdownDimension.key) {
    return false;
  }

  if (primaryDimension.group !== breakdownDimension.group) {
    return true;
  }

  if (primaryDimension.level === undefined || breakdownDimension.level === undefined) {
    return false;
  }

  return primaryDimension.level < breakdownDimension.level;
}

export function getBreakdownDimensions(primaryKey: DimensionKey) {
  const primaryDimension = getDimension(primaryKey);
  return dimensions.filter((dimension) => canBreakDown(primaryDimension, dimension));
}
```

- [ ] **Step 4: Run dimension tests to verify they pass**

Run:

```bash
npm test -- src/domain/dimensions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit dimension rule changes**

Run:

```bash
git add src/domain/dimensions.ts src/domain/dimensions.test.ts
git commit -m "feat: add directed sales dimension rules"
```

Expected: commit succeeds with only the two dimension files staged.

---

### Task 2: Mock Data And Aggregation Support For New Dimensions

**Files:**
- Modify: `src/data/mockDeals.ts`
- Modify: `src/domain/analytics.test.ts`
- Modify: `src/domain/analytics.ts`

- [ ] **Step 1: Update mock deal typing and add project fields**

In `src/data/mockDeals.ts`, replace the imports and `DealRecord` type with:

```ts
import type { RecordDimensionKey } from '../domain/dimensions';

export type DealType = '新诊' | '复购';

export type DealRecord = Record<RecordDimensionKey, string> & {
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
```

Add `projectCategory` and `project` to every deal object:

```ts
// D001
projectCategory: '高端咨询',
project: '年度管理咨询包',

// D002
projectCategory: '高端咨询',
project: '年度管理咨询包',

// D003
projectCategory: '专项服务',
project: '私域增长诊断',

// D004
projectCategory: '复购服务',
project: '客户复购提升包',

// D005
projectCategory: '复购服务',
project: '客户复购提升包',

// D006
projectCategory: '高端咨询',
project: '年度管理咨询包',

// D007
projectCategory: '专项服务',
project: '私域增长诊断',

// D008
projectCategory: '复购服务',
project: '客户复购提升包',

// D009
projectCategory: '专项服务',
project: '自然流量优化',
```

- [ ] **Step 2: Add failing aggregation tests for date and project dimensions**

Append these tests to `src/domain/analytics.test.ts` inside the existing `describe` block:

```ts
  it('builds summary rows by date using dealDate', () => {
    const rows = buildSummaryRows(mockDeals, 'date');

    expect(rows.map((row) => row.primaryDimensionValue)).toContain('2026-06-02');
    expect(rows.find((row) => row.primaryDimensionValue === '2026-06-02')).toMatchObject({
      reportedAmount: 450000,
      confirmedAmount: 412000,
      dealCount: 1,
    });
  });

  it('builds summary rows by project category and project', () => {
    const categoryRows = buildSummaryRows(mockDeals, 'projectCategory');
    const projectRows = buildSummaryRows(mockDeals, 'project');

    expect(categoryRows.find((row) => row.primaryDimensionValue === '高端咨询')).toMatchObject({
      reportedAmount: 1600000,
      dealCount: 3,
    });
    expect(projectRows.find((row) => row.primaryDimensionValue === '私域增长诊断')).toMatchObject({
      reportedAmount: 830000,
      dealCount: 2,
    });
  });

  it('builds breakdown rows for project category to project', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'projectCategory',
      primaryDimensionValue: '复购服务',
      breakdownDimension: 'project',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'project:客户复购提升包',
      breakdownDimensionValue: '客户复购提升包',
      reportedAmount: 650000,
      dealCount: 3,
    });
  });
```

- [ ] **Step 3: Run aggregation tests to verify they fail**

Run:

```bash
npm test -- src/domain/analytics.test.ts
```

Expected: FAIL because `aggregate()` still reads `record[dimension]`, and `date` is not a direct field on `DealRecord`.

- [ ] **Step 4: Add a dimension value resolver in analytics**

In `src/domain/analytics.ts`, add this helper after `safeDivide()`:

```ts
function getRecordDimensionValue(record: DealRecord, dimension: DimensionKey) {
  return dimension === 'date' ? record.dealDate : record[dimension];
}
```

Then replace this line inside `aggregate()`:

```ts
    const value = record[dimension];
```

with:

```ts
    const value = getRecordDimensionValue(record, dimension);
```

Replace the filter in `buildBreakdownRows()`:

```ts
  const scopedRecords = records.filter(
    (record) => record[query.primaryDimension] === query.primaryDimensionValue,
  );
```

with:

```ts
  const scopedRecords = records.filter(
    (record) => getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue,
  );
```

- [ ] **Step 5: Run aggregation tests to verify they pass**

Run:

```bash
npm test -- src/domain/analytics.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit data and aggregation changes**

Run:

```bash
git add src/data/mockDeals.ts src/domain/analytics.ts src/domain/analytics.test.ts
git commit -m "feat: support project and date sales dimensions"
```

Expected: commit succeeds with only the mock data and analytics files staged.

---

### Task 3: UI Coverage For New Dimensions And Directed Tabs

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing UI tests for new dimension options and directed tabs**

Append these tests to `src/App.test.tsx` inside the existing `describe` block:

```tsx
  it('shows date and project dimensions in the primary dimension selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));

    expect(screen.getByRole('option', { name: '日期' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目分类' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目' })).toBeInTheDocument();
  });

  it('allows department to break down by consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(screen.getByRole('option', { name: '部门' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });

  it('does not allow consultant to break down by department', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('allows project category to break down by project but not the reverse', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(screen.getByRole('option', { name: '项目分类' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    let drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '项目' })).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Close' }));
    rerender(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(screen.getByRole('option', { name: '项目' }));
    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).queryByRole('tab', { name: '项目分类' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run App tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS if Tasks 1 and 2 are complete. If the close button accessible name differs in this environment, replace the close line with:

```tsx
    await user.keyboard('{Escape}');
```

and rerun the same test command.

- [ ] **Step 3: Commit UI test coverage**

Run:

```bash
git add src/App.test.tsx
git commit -m "test: cover sales dimension hierarchy UI"
```

Expected: commit succeeds with only `src/App.test.tsx` staged.

---

### Task 4: Full Verification

**Files:**
- No source file changes expected.

- [ ] **Step 1: Run all tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with TypeScript and Vite build completing.

- [ ] **Step 3: Check final git status**

Run:

```bash
git status --short
```

Expected: no modified source files from this implementation remain unstaged. The pre-existing untracked file `docs/superpowers/plans/2026-06-16-sales-metric-expansion.md` may still appear and should not be staged by this work.

---

## Self-Review

- Spec coverage: The plan covers the three new dimensions, directed parent-to-child same-group drilldown, cross-group preservation, date-as-dimension using `dealDate`, mock project fields, UI exposure, and test/build verification.
- Scope control: The plan does not add charts, real API integration, permissions, saved views, weekly/monthly date granularity, or metric changes.
- Type consistency: `DimensionKey` includes `date`; `RecordDimensionKey` excludes `date`; `DealRecord` stores business dimensions directly and keeps date in `dealDate`; analytics reads all dimension values through `getRecordDimensionValue()`.
