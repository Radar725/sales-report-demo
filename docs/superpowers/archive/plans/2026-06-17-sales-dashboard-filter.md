# Sales Dashboard Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved sales-manager filter set so summary rows and drawer breakdown rows use the same filtered deal records.

**Architecture:** Keep filtering as pure domain logic in `src/domain/filters.ts`, then wire the filter state through `App.tsx` into `FilterBar.tsx` and `BreakdownDrawer.tsx`. The UI remains an Ant Design form-like toolbar; no dashboard saving, custom metrics, or real CRM integration is added.

**Tech Stack:** React 18, TypeScript, Vite, Ant Design 5.0, Vitest, Testing Library.

---

## File Structure

- Create `src/domain/filters.ts`: filter state types, option extraction helpers, and pure `filterDealRecords()` logic.
- Create `src/domain/filters.test.ts`: focused tests for deal type, customer scope, dimension filters, and dependent option helpers.
- Modify `src/components/FilterBar.tsx`: replace the fixed status selector with the approved filter controls and a “更多筛选” toggle.
- Modify `src/components/BreakdownDrawer.tsx`: accept already-filtered records instead of reading `mockDeals` directly.
- Modify `src/App.tsx`: own filter state, derive filtered records, and pass the same dataset to summary and drawer.
- Modify `src/App.test.tsx`: cover visible filters, removed status filter, customer scope behavior, and drawer consistency.
- Modify `src/styles.css`: add light spacing for the expanded filter row only if the existing layout needs it.

## Task 1: Add Pure Filter Logic

**Files:**
- Create: `src/domain/filters.ts`
- Create: `src/domain/filters.test.ts`

- [ ] **Step 1: Write failing tests for filter logic**

Create `src/domain/filters.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { mockDeals } from '../data/mockDeals';
import { filterDealRecords, getFilterOptions, type SalesDashboardFilters } from './filters';

const defaultFilters: SalesDashboardFilters = {
  dateRange: null,
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'all',
  cities: [],
  institutions: [],
};

describe('sales dashboard filters', () => {
  it('filters by deal type', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      dealType: 'repurchase',
    });

    expect(rows).toHaveLength(4);
    expect(rows.every((record) => record.dealType === '复购')).toBe(true);
  });

  it('filters by customer statistical scope', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      customerScope: 'currentNewCustomers',
    });

    expect(rows).toHaveLength(5);
    expect(rows.every((record) => record.customerCreatedInPeriod)).toBe(true);
  });

  it('filters by selected dimensions together', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      departments: ['华东一部'],
      channelCategories: ['线上投放'],
      projectCategories: ['高端咨询'],
    });

    expect(rows.map((record) => record.id)).toEqual(['D001', 'D002']);
  });

  it('filters by inclusive date range', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      dateRange: ['2026-06-05', '2026-06-13'],
    });

    expect(rows.map((record) => record.id)).toEqual(['D002', 'D003', 'D006', 'D007', 'D008']);
  });

  it('builds dependent filter options from the current parent selection', () => {
    const options = getFilterOptions(mockDeals, {
      departments: ['华东一部'],
      channelCategories: ['私域运营'],
      projectCategories: ['专项服务'],
      cities: ['上海'],
    });

    expect(options.consultants).toEqual(['张敏']);
    expect(options.channels).toEqual(['私域']);
    expect(options.projects).toEqual(['私域增长诊断', '自然流量优化']);
    expect(options.institutions).toEqual(['上海中心']);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- src/domain/filters.test.ts
```

Expected: fail because `src/domain/filters.ts` does not exist.

- [ ] **Step 3: Implement minimal filter module**

Create `src/domain/filters.ts`:

```ts
import type { DealRecord, DealType } from '../data/mockDeals';

export type DealTypeFilter = 'all' | 'newDiagnosis' | 'repurchase';
export type CustomerScopeFilter = 'all' | 'currentNewCustomers';

export type SalesDashboardFilters = {
  dateRange: [string, string] | null;
  departments: string[];
  consultants: string[];
  dealType: DealTypeFilter;
  channelCategories: string[];
  channels: string[];
  projectCategories: string[];
  projects: string[];
  customerScope: CustomerScopeFilter;
  cities: string[];
  institutions: string[];
};

export type FilterOptionScope = Pick<
  SalesDashboardFilters,
  'departments' | 'channelCategories' | 'projectCategories' | 'cities'
>;

export type SalesDashboardFilterOptions = {
  departments: string[];
  consultants: string[];
  channelCategories: string[];
  channels: string[];
  projectCategories: string[];
  projects: string[];
  cities: string[];
  institutions: string[];
};

function isInSelection(value: string, selection: string[]) {
  return selection.length === 0 || selection.includes(value);
}

function matchesDealType(record: DealRecord, dealType: DealTypeFilter) {
  const dealTypeByFilter: Record<Exclude<DealTypeFilter, 'all'>, DealType> = {
    newDiagnosis: '新诊',
    repurchase: '复购',
  };

  return dealType === 'all' || record.dealType === dealTypeByFilter[dealType];
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
}

export function filterDealRecords(records: DealRecord[], filters: SalesDashboardFilters) {
  return records.filter((record) => {
    const matchesDateRange =
      filters.dateRange === null ||
      (record.dealDate >= filters.dateRange[0] && record.dealDate <= filters.dateRange[1]);

    return (
      matchesDateRange &&
      isInSelection(record.department, filters.departments) &&
      isInSelection(record.consultant, filters.consultants) &&
      matchesDealType(record, filters.dealType) &&
      isInSelection(record.channelCategory, filters.channelCategories) &&
      isInSelection(record.channel, filters.channels) &&
      isInSelection(record.projectCategory, filters.projectCategories) &&
      isInSelection(record.project, filters.projects) &&
      (filters.customerScope === 'all' || record.customerCreatedInPeriod) &&
      isInSelection(record.city, filters.cities) &&
      isInSelection(record.institution, filters.institutions)
    );
  });
}

export function getFilterOptions(
  records: DealRecord[],
  scope: FilterOptionScope,
): SalesDashboardFilterOptions {
  const consultantRecords = records.filter((record) =>
    isInSelection(record.department, scope.departments),
  );
  const channelRecords = records.filter((record) =>
    isInSelection(record.channelCategory, scope.channelCategories),
  );
  const projectRecords = records.filter((record) =>
    isInSelection(record.projectCategory, scope.projectCategories),
  );
  const institutionRecords = records.filter((record) => isInSelection(record.city, scope.cities));

  return {
    departments: uniqueSorted(records.map((record) => record.department)),
    consultants: uniqueSorted(consultantRecords.map((record) => record.consultant)),
    channelCategories: uniqueSorted(records.map((record) => record.channelCategory)),
    channels: uniqueSorted(channelRecords.map((record) => record.channel)),
    projectCategories: uniqueSorted(records.map((record) => record.projectCategory)),
    projects: uniqueSorted(projectRecords.map((record) => record.project)),
    cities: uniqueSorted(records.map((record) => record.city)),
    institutions: uniqueSorted(institutionRecords.map((record) => record.institution)),
  };
}
```

- [ ] **Step 4: Run filter tests**

Run:

```bash
npm test -- src/domain/filters.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit pure filter logic**

Run:

```bash
git add src/domain/filters.ts src/domain/filters.test.ts
git commit -m "feat: add sales dashboard filter logic"
```

## Task 2: Wire Filtered Records Through The App

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/BreakdownDrawer.tsx`
- Modify: `src/domain/analytics.test.ts`

- [ ] **Step 1: Write failing analytics test for pre-filtered records**

Add this test to `src/domain/analytics.test.ts`:

```ts
it('builds summary rows from an already filtered record set', () => {
  const rows = buildSummaryRows(
    mockDeals.filter((record) => record.customerCreatedInPeriod),
    'consultant',
  );

  expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
    reportedAmount: 1250000,
    dealCount: 3,
  });
  expect(rows.find((row) => row.primaryDimensionValue === '李然')).toMatchObject({
    reportedAmount: 1180000,
    dealCount: 2,
  });
});
```

- [ ] **Step 2: Run analytics test**

Run:

```bash
npm test -- src/domain/analytics.test.ts
```

Expected: pass. This confirms existing aggregation already supports pre-filtered input.

- [ ] **Step 3: Pass filtered records into summary and drawer**

Modify `src/components/BreakdownDrawer.tsx`:

```tsx
import { Button, Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DealRecord } from '../data/mockDeals';
import { buildBreakdownRows, type BreakdownRow, type SummaryRow } from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions, getDimension } from '../domain/dimensions';
import { buildMetricColumns } from '../domain/metrics';

type BreakdownDrawerProps = {
  open: boolean;
  records: DealRecord[];
  primaryDimension: DimensionKey;
  row: SummaryRow | null;
  onClose: () => void;
};

export default function BreakdownDrawer({
  open,
  records,
  primaryDimension,
  row,
  onClose,
}: BreakdownDrawerProps) {
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
            const dataSource = buildBreakdownRows(records, {
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
                    bordered
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

Modify `src/App.tsx` with temporary default filters:

```tsx
import { Card, Typography } from 'antd';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { buildSummaryRows, type SummaryRow } from './domain/analytics';
import { getDimension, type DimensionKey } from './domain/dimensions';
import { filterDealRecords, type SalesDashboardFilters } from './domain/filters';

const defaultFilters: SalesDashboardFilters = {
  dateRange: null,
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'all',
  cities: [],
  institutions: [],
};

export default function App() {
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [filters, setFilters] = useState<SalesDashboardFilters>(defaultFilters);
  const [selectedRow, setSelectedRow] = useState<SummaryRow | null>(null);

  const filteredRecords = useMemo(() => filterDealRecords(mockDeals, filters), [filters]);
  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () => buildSummaryRows(filteredRecords, primaryDimension),
    [filteredRecords, primaryDimension],
  );

  return (
    <main className="app-shell">
      <Typography.Title level={2}>CRM 业绩统计 Demo</Typography.Title>
      <Typography.Paragraph type="secondary">
        主维度汇总列表 + 抽屉多维拆解，基于 Ant Design 5.0 常规组件。
      </Typography.Paragraph>

      <Card className="toolbar-card">
        <FilterBar
          filters={filters}
          records={mockDeals}
          primaryDimension={primaryDimension}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedRow(null);
          }}
          onPrimaryDimensionChange={(dimension) => {
            setPrimaryDimension(dimension);
            setSelectedRow(null);
          }}
        />
      </Card>

      <Card title={`${primaryDimensionConfig.label}业绩汇总`}>
        <SummaryTable
          primaryDimension={primaryDimensionConfig}
          rows={summaryRows}
          onOpenBreakdown={setSelectedRow}
        />
      </Card>

      <BreakdownDrawer
        open={selectedRow !== null}
        records={filteredRecords}
        primaryDimension={primaryDimension}
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </main>
  );
}
```

- [ ] **Step 4: Run TypeScript to see current UI prop failures**

Run:

```bash
npm run build
```

Expected: fail because `FilterBar` does not yet accept `filters`, `records`, or `onFiltersChange`.

- [ ] **Step 5: Commit only if build unexpectedly passes**

Do not commit in this task if the build fails for the expected `FilterBar` prop mismatch. The next task makes the UI compile.

## Task 3: Replace The Filter Bar Controls

**Files:**
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing UI tests for the approved filter set**

Add these tests to `src/App.test.tsx`:

```tsx
it('renders the approved sales-manager filters and removes performance status', () => {
  render(<App />);

  expect(screen.getByText('统计时间')).toBeInTheDocument();
  expect(screen.getByText('部门')).toBeInTheDocument();
  expect(screen.getByText('咨询师')).toBeInTheDocument();
  expect(screen.getByText('成交类型')).toBeInTheDocument();
  expect(screen.getByText('渠道分类')).toBeInTheDocument();
  expect(screen.getByText('项目分类')).toBeInTheDocument();
  expect(screen.getByText('客户统计范围')).toBeInTheDocument();
  expect(screen.getByText('主维度')).toBeInTheDocument();
  expect(screen.queryByText('业绩状态')).not.toBeInTheDocument();
});

it('shows detailed filters after expanding more filters', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByRole('button', { name: '更多筛选' }));

  expect(screen.getByText('渠道')).toBeInTheDocument();
  expect(screen.getByText('项目')).toBeInTheDocument();
  expect(screen.getByText('城市')).toBeInTheDocument();
  expect(screen.getByText('机构')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run UI tests to verify they fail**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: fail because the new controls are not in `FilterBar` yet.

- [ ] **Step 3: Implement the approved filter controls**

Replace `src/components/FilterBar.tsx` with:

```tsx
import { Button, DatePicker, Form, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';
import {
  getFilterOptions,
  type CustomerScopeFilter,
  type DealTypeFilter,
  type SalesDashboardFilters,
} from '../domain/filters';

type FilterBarProps = {
  filters: SalesDashboardFilters;
  records: DealRecord[];
  primaryDimension: DimensionKey;
  onFiltersChange: (filters: SalesDashboardFilters) => void;
  onPrimaryDimensionChange: (dimension: DimensionKey) => void;
};

const dealTypeOptions: Array<{ value: DealTypeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'newDiagnosis', label: '新诊' },
  { value: 'repurchase', label: '复购' },
];

const customerScopeOptions: Array<{ value: CustomerScopeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'currentNewCustomers', label: '当期新客' },
];

function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

export default function FilterBar({
  filters,
  records,
  primaryDimension,
  onFiltersChange,
  onPrimaryDimensionChange,
}: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const options = useMemo(
    () =>
      getFilterOptions(records, {
        departments: filters.departments,
        channelCategories: filters.channelCategories,
        projectCategories: filters.projectCategories,
        cities: filters.cities,
      }),
    [filters.channelCategories, filters.cities, filters.departments, filters.projectCategories, records],
  );

  function updateFilters(nextFilters: Partial<SalesDashboardFilters>) {
    onFiltersChange({ ...filters, ...nextFilters });
  }

  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
        <DatePicker.RangePicker
          value={filters.dateRange?.map((date) => dayjs(date)) as [dayjs.Dayjs, dayjs.Dayjs] | undefined}
          onChange={(_, dateStrings) => {
            updateFilters({
              dateRange:
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
            });
          }}
        />
      </Form.Item>
      <Form.Item label="部门">
        <Select
          mode="multiple"
          value={filters.departments}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.departments)}
          onChange={(departments) => updateFilters({ departments, consultants: [] })}
        />
      </Form.Item>
      <Form.Item label="咨询师">
        <Select
          mode="multiple"
          value={filters.consultants}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.consultants)}
          onChange={(consultants) => updateFilters({ consultants })}
        />
      </Form.Item>
      <Form.Item label="成交类型">
        <Select
          value={filters.dealType}
          style={{ width: 120 }}
          options={dealTypeOptions}
          onChange={(dealType) => updateFilters({ dealType })}
        />
      </Form.Item>
      <Form.Item label="渠道分类">
        <Select
          mode="multiple"
          value={filters.channelCategories}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.channelCategories)}
          onChange={(channelCategories) => updateFilters({ channelCategories, channels: [] })}
        />
      </Form.Item>
      <Form.Item label="项目分类">
        <Select
          mode="multiple"
          value={filters.projectCategories}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.projectCategories)}
          onChange={(projectCategories) => updateFilters({ projectCategories, projects: [] })}
        />
      </Form.Item>
      <Form.Item label="客户统计范围">
        <Select
          value={filters.customerScope}
          style={{ width: 140 }}
          options={customerScopeOptions}
          onChange={(customerScope) => updateFilters({ customerScope })}
        />
      </Form.Item>
      <Form.Item label="主维度">
        <Select
          value={primaryDimension}
          style={{ width: 140 }}
          aria-label="主维度"
          virtual={false}
          options={dimensions.map((dimension) => ({
            value: dimension.key,
            label: dimension.label,
          }))}
          onChange={onPrimaryDimensionChange}
        />
      </Form.Item>
      {showMoreFilters ? (
        <div className="filter-bar-more">
          <Form.Item label="渠道">
            <Select
              mode="multiple"
              value={filters.channels}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.channels)}
              onChange={(channels) => updateFilters({ channels })}
            />
          </Form.Item>
          <Form.Item label="项目">
            <Select
              mode="multiple"
              value={filters.projects}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.projects)}
              onChange={(projects) => updateFilters({ projects })}
            />
          </Form.Item>
          <Form.Item label="城市">
            <Select
              mode="multiple"
              value={filters.cities}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.cities)}
              onChange={(cities) => updateFilters({ cities, institutions: [] })}
            />
          </Form.Item>
          <Form.Item label="机构">
            <Select
              mode="multiple"
              value={filters.institutions}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.institutions)}
              onChange={(institutions) => updateFilters({ institutions })}
            />
          </Form.Item>
        </div>
      ) : null}
      <Form.Item>
        <Space>
          <Button type="primary">查询</Button>
          <Button
            onClick={() =>
              onFiltersChange({
                dateRange: null,
                departments: [],
                consultants: [],
                dealType: 'all',
                channelCategories: [],
                channels: [],
                projectCategories: [],
                projects: [],
                customerScope: 'all',
                cities: [],
                institutions: [],
              })
            }
          >
            重置
          </Button>
          <Button onClick={() => setShowMoreFilters((current) => !current)}>
            {showMoreFilters ? '收起筛选' : '更多筛选'}
          </Button>
          <Button>导出汇总</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
```

Add to `src/styles.css`:

```css
.filter-bar-more {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0;
  width: 100%;
}
```

- [ ] **Step 4: Run build and UI tests**

Run:

```bash
npm run build
npm test -- src/App.test.tsx
```

Expected: build passes and App tests pass.

- [ ] **Step 5: Commit filter bar UI**

Run:

```bash
git add src/App.tsx src/components/FilterBar.tsx src/components/BreakdownDrawer.tsx src/styles.css src/App.test.tsx src/domain/analytics.test.ts
git commit -m "feat: add sales dashboard filter controls"
```

## Task 4: Verify Filtering Affects Summary And Drawer

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add integration tests for filtering behavior**

Add these tests to `src/App.test.tsx`:

```tsx
it('filters the summary table by customer statistical scope', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByText('全部'));
  await user.click(await screen.findByRole('option', { name: '当期新客' }));

  expect(screen.getByRole('cell', { name: '125.00 万' })).toBeInTheDocument();
  expect(screen.queryByRole('cell', { name: '180.00 万' })).not.toBeInTheDocument();
});

it('uses filtered records inside the breakdown drawer', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.click(screen.getByText('全部'));
  await user.click(await screen.findByRole('option', { name: '当期新客' }));
  await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

  const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
  expect(within(drawer).getByRole('cell', { name: '信息流' })).toBeInTheDocument();
  expect(within(drawer).queryByRole('cell', { name: '自然流量' })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify behavior**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: tests pass. If either test fails because Ant Design renders duplicate “全部” text, replace the first click with a label-scoped selector:

```tsx
const customerScope = screen.getByText('客户统计范围').closest('.ant-form-item')!;
await user.click(within(customerScope as HTMLElement).getByRole('combobox'));
```

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and production build completes.

- [ ] **Step 4: Commit integration coverage**

Run:

```bash
git add src/App.test.tsx
git commit -m "test: cover sales dashboard filters"
```

## Task 5: Manual UI Check

**Files:**
- No source changes expected.

- [ ] **Step 1: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 2: Inspect the page**

Open the local URL and verify:

- Default filters show: 统计时间、部门、咨询师、成交类型、渠道分类、项目分类、客户统计范围、主维度.
- “业绩状态” is absent.
- “客户统计范围” options are 全部 and 当期新客.
- “更多筛选” reveals 渠道、项目、城市、机构.
- Selecting 当期新客 changes the main table totals.
- Opening a row’s drawer after filtering uses the same filtered data.

- [ ] **Step 3: Stop the dev server**

Stop the Vite process with `Ctrl+C`.

- [ ] **Step 4: Final status check**

Run:

```bash
git status --short
```

Expected: only intentional files are changed. Pre-existing archive/migration changes may still be present and should not be reverted.
