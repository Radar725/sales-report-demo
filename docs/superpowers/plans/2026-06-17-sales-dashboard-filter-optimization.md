# Sales Dashboard Filter Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize date picker (Chinese locale, today default, presets), restructure filter layout (3 toolbar controls + Modal), add placeholders, and reorder metric columns (value → ratio pairing).

**Architecture:** Wrap app in `ConfigProvider(zhCN)` for Chinese locale. `FilterBar` splits into a compact toolbar row (统计时间 + 主维度 + 客户统计范围 + buttons) and a `Modal` for the other 9 filters. `metricGroups` in `metrics.ts` is reordered so each absolute value is immediately followed by its ratio.

**Tech Stack:** React 18, TypeScript, Vite, Ant Design 5, dayjs, Vitest, Testing Library.

---

## File Structure

- Modify `src/main.tsx`: wrap `<App />` in `<ConfigProvider locale={zhCN}>`
- Modify `src/App.tsx`: `defaultFilters.dateRange` → today
- Modify `src/components/FilterBar.tsx`: toolbar row (3 controls) + Modal (9 filters), presets, placeholders
- Modify `src/domain/metrics.ts`: reorder `metricGroups` (新诊/复购 value→ratio pairing)
- Create `src/domain/metrics.test.ts`: verify column ordering
- Modify `src/domain/filters.test.ts`: update for today default dateRange
- Modify `src/App.test.tsx`: update for Modal-based filter layout

---

### Task 1: Chinese Locale & Default Date

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/App.tsx:13-24`
- Modify: `src/domain/filters.test.ts`

- [ ] **Step 1: Wrap app in ConfigProvider with Chinese locale**

Modify `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Change defaultFilters.dateRange to today**

Modify `src/App.tsx` — change the `defaultFilters`:

```ts
import dayjs from 'dayjs';
```

Replace the `defaultFilters` constant:

```ts
const today = dayjs().format('YYYY-MM-DD');

const defaultFilters: SalesDashboardFilters = {
  dateRange: [today, today],
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
```

- [ ] **Step 3: Update filter tests for default today date**

Modify `src/domain/filters.test.ts` — the `defaultFilters` already has `dateRange: null`, so test data uses null. The "filters by inclusive date range" test sets dateRange explicitly so it's unaffected. Only tests that use `defaultFilters` directly are fine since they don't assert date filtering.

No changes needed to filter tests — the tests use `dateRange: null` in defaultFilters and override as needed.

- [ ] **Step 4: Run tests**

```bash
npm test
```

Expected: all tests pass (main.tsx change is runtime-only, App.tsx default change doesn't break tests since filter logic handles non-null dateRange).

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/App.tsx
git commit -m "feat: add Chinese locale and default today date range"
```

---

### Task 2: Metric Column Reordering

**Files:**
- Modify: `src/domain/metrics.ts:36-101`
- Create: `src/domain/metrics.test.ts`

- [ ] **Step 1: Write failing test for metric column order**

Create `src/domain/metrics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { metricGroups } from './metrics';

describe('metric column ordering', () => {
  it('pairs new-diagnosis values with their ratios', () => {
    const group = metricGroups.find((g) => g.title === '新诊成交')!;
    const keys = group.metrics.map((m) => m.key);

    expect(keys).toEqual([
      'newDiagnosisAmount',
      'newDiagnosisAmountRate',
      'newDiagnosisDealCount',
      'newDiagnosisDealCountRate',
      'newDiagnosisCustomerCount',
      'newDiagnosisCustomerRate',
    ]);
  });

  it('pairs repurchase values with their ratios', () => {
    const group = metricGroups.find((g) => g.title === '复购成交')!;
    const keys = group.metrics.map((m) => m.key);

    expect(keys).toEqual([
      'repurchaseAmount',
      'repurchaseAmountRate',
      'repurchaseDealCount',
      'repurchaseDealCountRate',
      'repurchaseCustomerCount',
      'repurchaseCustomerRate',
    ]);
  });

  it('keeps overview and conversion groups unchanged', () => {
    expect(metricGroups[0].title).toBe('业绩总览');
    expect(metricGroups[1].title).toBe('成交概况');
    expect(metricGroups[2].title).toBe('新诊成交');
    expect(metricGroups[3].title).toBe('复购成交');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/domain/metrics.test.ts
```

Expected: FAIL — current order has all absolute values first, then all ratios.

- [ ] **Step 3: Reorder metric groups**

Modify `src/domain/metrics.ts` — replace the 新诊成交 and 复购成交 groups in `metricGroups`:

```ts
  {
    title: '新诊成交',
    metrics: [
      { key: 'newDiagnosisAmount', label: '新诊业绩', format: 'amount' },
      { key: 'newDiagnosisAmountRate', label: '新诊业绩占比', format: 'percent' },
      { key: 'newDiagnosisDealCount', label: '新诊单量', format: 'integer' },
      { key: 'newDiagnosisDealCountRate', label: '新诊单量占比', format: 'percent' },
      { key: 'newDiagnosisCustomerCount', label: '新诊客户数', format: 'integer' },
      { key: 'newDiagnosisCustomerRate', label: '新诊客户占比', format: 'percent' },
    ],
  },
  {
    title: '复购成交',
    metrics: [
      { key: 'repurchaseAmount', label: '复购业绩', format: 'amount' },
      { key: 'repurchaseAmountRate', label: '复购业绩占比', format: 'percent' },
      { key: 'repurchaseDealCount', label: '复购单量', format: 'integer' },
      { key: 'repurchaseDealCountRate', label: '复购单量占比', format: 'percent' },
      { key: 'repurchaseCustomerCount', label: '复购客户数', format: 'integer' },
      { key: 'repurchaseCustomerRate', label: '复购客户占比', format: 'percent' },
    ],
  },
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/domain/metrics.test.ts
```

Expected: all 3 tests pass.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all existing tests still pass (no assertions on column order in existing tests).

- [ ] **Step 6: Commit**

```bash
git add src/domain/metrics.ts src/domain/metrics.test.ts
git commit -m "feat: reorder metric columns to pair values with ratios"
```

---

### Task 3: FilterBar Modal Layout, Presets & Placeholders

**Files:**
- Modify: `src/components/FilterBar.tsx`

- [ ] **Step 1: Replace FilterBar with toolbar + Modal**

Replace the entire content of `src/components/FilterBar.tsx`:

```tsx
import { Button, DatePicker, Form, Modal, Select, Space } from 'antd';
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

const presets: NonNullable<
  React.ComponentProps<typeof DatePicker.RangePicker>['presets']
> = [
  { label: '今日', value: [dayjs(), dayjs()] },
  { label: '昨日', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
  {
    label: '上周',
    value: [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')],
  },
  { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
  {
    label: '上月',
    value: [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  { label: '近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
];

export default function FilterBar({
  filters,
  records,
  primaryDimension,
  onFiltersChange,
  onPrimaryDimensionChange,
}: FilterBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilters, setModalFilters] = useState<SalesDashboardFilters>(filters);

  const options = useMemo(
    () =>
      getFilterOptions(records, {
        departments: modalFilters.departments,
        channelCategories: modalFilters.channelCategories,
        projectCategories: modalFilters.projectCategories,
        cities: modalFilters.cities,
      }),
    [
      modalFilters.channelCategories,
      modalFilters.cities,
      modalFilters.departments,
      modalFilters.projectCategories,
      records,
    ],
  );

  function updateFilters(nextFilters: Partial<SalesDashboardFilters>) {
    onFiltersChange({ ...filters, ...nextFilters });
  }

  function updateModalFilters(nextFilters: Partial<SalesDashboardFilters>) {
    setModalFilters((prev) => ({ ...prev, ...nextFilters }));
  }

  function openModal() {
    setModalFilters(filters);
    setModalOpen(true);
  }

  function applyModal() {
    onFiltersChange(modalFilters);
    setModalOpen(false);
  }

  function cancelModal() {
    setModalOpen(false);
  }

  return (
    <>
      <Form layout="inline" className="filter-bar">
        <Form.Item label="统计时间">
          <DatePicker.RangePicker
            presets={presets}
            value={
              filters.dateRange?.map((date) => dayjs(date)) as
                | [dayjs.Dayjs, dayjs.Dayjs]
                | undefined
            }
            onChange={(_, dateStrings) => {
              updateFilters({
                dateRange:
                  dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
              });
            }}
          />
        </Form.Item>
        <Form.Item label="主维度">
          <Select
            value={primaryDimension}
            style={{ width: 140 }}
            placeholder="请选择主维度"
            aria-label="主维度"
            virtual={false}
            options={dimensions.map((dimension) => ({
              value: dimension.key,
              label: dimension.label,
            }))}
            onChange={onPrimaryDimensionChange}
          />
        </Form.Item>
        <Form.Item label="客户统计范围">
          <Select
            value={filters.customerScope}
            style={{ width: 160 }}
            placeholder="请选择客户统计范围"
            options={customerScopeOptions}
            onChange={(customerScope) => updateFilters({ customerScope })}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">查询</Button>
            <Button
              onClick={() =>
                onFiltersChange({
                  dateRange: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
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
            <Button onClick={openModal}>更多筛选</Button>
            <Button>导出汇总</Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        title="更多筛选"
        open={modalOpen}
        width={720}
        onOk={applyModal}
        onCancel={cancelModal}
        okText="确定"
        cancelText="取消"
        destroyOnClose
      >
        <Form layout="vertical">
          <Form.Item label="部门">
            <Select
              mode="multiple"
              value={modalFilters.departments}
              placeholder="请选择部门"
              maxTagCount="responsive"
              options={toSelectOptions(options.departments)}
              onChange={(departments) => updateModalFilters({ departments, consultants: [] })}
            />
          </Form.Item>
          <Form.Item label="咨询师">
            <Select
              mode="multiple"
              value={modalFilters.consultants}
              placeholder="请选择咨询师"
              maxTagCount="responsive"
              options={toSelectOptions(options.consultants)}
              onChange={(consultants) => updateModalFilters({ consultants })}
            />
          </Form.Item>
          <Form.Item label="成交类型">
            <Select
              value={modalFilters.dealType}
              placeholder="请选择成交类型"
              options={dealTypeOptions}
              onChange={(dealType) => updateModalFilters({ dealType })}
            />
          </Form.Item>
          <Form.Item label="渠道分类">
            <Select
              mode="multiple"
              value={modalFilters.channelCategories}
              placeholder="请选择渠道分类"
              maxTagCount="responsive"
              options={toSelectOptions(options.channelCategories)}
              onChange={(channelCategories) =>
                updateModalFilters({ channelCategories, channels: [] })
              }
            />
          </Form.Item>
          <Form.Item label="渠道">
            <Select
              mode="multiple"
              value={modalFilters.channels}
              placeholder="请选择渠道"
              maxTagCount="responsive"
              options={toSelectOptions(options.channels)}
              onChange={(channels) => updateModalFilters({ channels })}
            />
          </Form.Item>
          <Form.Item label="项目分类">
            <Select
              mode="multiple"
              value={modalFilters.projectCategories}
              placeholder="请选择项目分类"
              maxTagCount="responsive"
              options={toSelectOptions(options.projectCategories)}
              onChange={(projectCategories) =>
                updateModalFilters({ projectCategories, projects: [] })
              }
            />
          </Form.Item>
          <Form.Item label="项目">
            <Select
              mode="multiple"
              value={modalFilters.projects}
              placeholder="请选择项目"
              maxTagCount="responsive"
              options={toSelectOptions(options.projects)}
              onChange={(projects) => updateModalFilters({ projects })}
            />
          </Form.Item>
          <Form.Item label="城市">
            <Select
              mode="multiple"
              value={modalFilters.cities}
              placeholder="请选择城市"
              maxTagCount="responsive"
              options={toSelectOptions(options.cities)}
              onChange={(cities) => updateModalFilters({ cities, institutions: [] })}
            />
          </Form.Item>
          <Form.Item label="机构">
            <Select
              mode="multiple"
              value={modalFilters.institutions}
              placeholder="请选择机构"
              maxTagCount="responsive"
              options={toSelectOptions(options.institutions)}
              onChange={(institutions) => updateModalFilters({ institutions })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
```

- [ ] **Step 2: Run build to check compilation**

```bash
npm run build
```

Expected: build passes.

- [ ] **Step 3: Run existing tests to see which break**

```bash
npm test -- src/App.test.tsx
```

Expected: some tests fail — those referencing filter controls now in Modal (部门, 咨询师, 成交类型, 渠道分类, 项目分类).

- [ ] **Step 4: Commit (broken tests expected, fixed in Task 4)**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: restructure filter bar with toolbar + Modal layout"
```

---

### Task 4: Update App Tests for New Layout

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update filter visibility test**

The test `renders the approved sales-manager filters and removes performance status` checks for controls now in Modal. Update it to only check toolbar-visible controls:

```tsx
  it('renders the toolbar-visible filters and removes performance status', () => {
    render(<App />);

    expect(screen.getByText('统计时间')).toBeInTheDocument();
    expect(screen.getByText('主维度')).toBeInTheDocument();
    expect(screen.getByText('客户统计范围')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '更多筛选' })).toBeInTheDocument();
    expect(screen.queryByText('业绩状态')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Update more-filters test**

Replace the `shows detailed filters after expanding more filters` test — the filters are now in a Modal:

```tsx
  it('shows detailed filters in Modal after clicking more filters', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '更多筛选' }));

    const modal = screen.getByRole('dialog', { name: '更多筛选' });
    expect(within(modal).getByText('部门')).toBeInTheDocument();
    expect(within(modal).getByText('咨询师')).toBeInTheDocument();
    expect(within(modal).getByText('成交类型')).toBeInTheDocument();
    expect(within(modal).getByText('渠道分类')).toBeInTheDocument();
    expect(within(modal).getByText('渠道')).toBeInTheDocument();
    expect(within(modal).getByText('项目分类')).toBeInTheDocument();
    expect(within(modal).getByText('项目')).toBeInTheDocument();
    expect(within(modal).getByText('城市')).toBeInTheDocument();
    expect(within(modal).getByText('机构')).toBeInTheDocument();
  });
```

- [ ] **Step 3: Update customer-scope filtering test**

The `filters the summary table by customer statistical scope` test now uses fireEvent on the selector. The customer scope select is still in the toolbar. Verify it still passes without changes.

- [ ] **Step 4: Update drawer filter test**

The `uses filtered records inside the breakdown drawer` test selects customer scope first. It should still work since customer scope remains in the toolbar.

- [ ] **Step 5: Run App tests**

```bash
npm test -- src/App.test.tsx
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite + build**

```bash
npm test && npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/App.test.tsx
git commit -m "test: update App tests for Modal-based filter layout"
```

---

### Task 5: Manual Verification

**Files:**
- No source changes expected.

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify UI**

Open the local URL and check:
- DatePicker shows Chinese text and today is prefilled
- Presets dropdown shows 8 shortcuts (今日/昨日/本周/上周/本月/上月/近7天/近30天)
- Only 统计时间、主维度、客户统计范围 and buttons are visible
- Clicking 更多筛选 opens Modal with 9 filter controls, all with placeholders
- Modal 确定 applies filters, 取消 reverts
- Metric columns show value immediately followed by ratio (新诊业绩 → 新诊业绩占比, etc.)

- [ ] **Step 3: Stop dev server, check git status**

```bash
git status --short
```

Expected: clean working tree.
