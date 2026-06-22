# Report Filter Metric Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move new/old customer and new-diagnosis/repurchase distinctions into public filters, simplify report and breakdown tables to four base metrics, and show three contribution ratios only for a restricted scope.

**Architecture:** Keep the existing public filter state and dashboard metric catalog intact. For report aggregation, derive a filtered record set and a baseline record set that differs only by resetting `customerScope` and `dealType` to `all`; merge same-dimension aggregates to obtain row-level contribution ratios. Introduce a report-only column factory so reducing report columns does not affect `DashboardOverview`.

**Tech Stack:** React 18, TypeScript, Ant Design 5, Vitest, Testing Library.

---

## File structure

| File | Responsibility |
| --- | --- |
| `src/domain/filters.ts` | Add old-customer scope filtering and a helper that creates the all-customer/all-deal-type baseline filters. |
| `src/domain/filters.test.ts` | Prove new/old customer filtering and baseline-filter reset behavior. |
| `src/domain/analytics.ts` | Calculate optional report contribution ratios while aggregating current and baseline record sets by the same dimensions. |
| `src/domain/analytics.test.ts` | Prove main-list and breakdown ratios, including no-baseline behavior. |
| `src/domain/reportMetrics.tsx` | Define only report-table base and optional ratio columns; preserve `metrics.tsx` for the dashboard. |
| `src/domain/reportMetrics.test.tsx` | Prove report columns are four by default and append three ratios when requested. |
| `src/components/FilterBar.tsx` | Rename customer-scope labels and render the existing deal-type filter as a public select. |
| `src/components/SummaryTable.tsx` | Use report-only columns and accept the ratio-column visibility flag. |
| `src/components/BreakdownDrawer.tsx` | Receive baseline records and the visibility flag; build breakdown rows with the same report-only columns. |
| `src/App.tsx` | Derive filtered and baseline record sets, decide ratio visibility, and pass all report-only inputs to tables/drawers. |
| `src/App.test.tsx` | Replace expanded-metric assertions with report fields, exercise the public selects, and verify main-list/drawer ratio visibility. |

### Task 1: Extend the public filter domain

**Files:**
- Modify: `src/domain/filters.ts:4-20, 47-54, 100-121`
- Modify: `src/domain/filters.test.ts:5-40`

- [ ] **Step 1: Write failing filter-domain tests for old customers and baseline filters**

  Add these cases in `src/domain/filters.test.ts` after the current customer-scope case:

  ```ts
  import { createBaselineFilters } from './filters';

  it('filters to old customers', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      customerScope: 'existingCustomers',
    });

    expect(rows).toHaveLength(4);
    expect(rows.every((record) => !record.customerCreatedInPeriod)).toBe(true);
  });

  it('creates baseline filters by clearing only customer scope and deal type', () => {
    const filters = {
      ...defaultFilters,
      departments: ['华东一部'],
      customerScope: 'currentNewCustomers' as const,
      dealType: 'newDiagnosis' as const,
    };

    expect(createBaselineFilters(filters)).toEqual({
      ...filters,
      customerScope: 'all',
      dealType: 'all',
    });
  });
  ```

- [ ] **Step 2: Run the focused domain test to verify it fails**

  Run:

  ```bash
  npm test -- src/domain/filters.test.ts
  ```

  Expected: FAIL because `existingCustomers` is not a valid customer scope and `createBaselineFilters` is not exported.

- [ ] **Step 3: Implement the smallest filtering change**

  In `src/domain/filters.ts`, expand the type and add helpers with these exact semantics:

  ```ts
  export type CustomerScopeFilter = 'all' | 'currentNewCustomers' | 'existingCustomers';

  function matchesCustomerScope(record: DealRecord, customerScope: CustomerScopeFilter) {
    if (customerScope === 'all') return true;
    return customerScope === 'currentNewCustomers'
      ? record.customerCreatedInPeriod
      : !record.customerCreatedInPeriod;
  }

  export function createBaselineFilters(filters: SalesDashboardFilters): SalesDashboardFilters {
    return { ...filters, customerScope: 'all', dealType: 'all' };
  }
  ```

  Replace the inline customer-scope condition in `filterDealRecords` with:

  ```ts
  matchesCustomerScope(record, filters.customerScope)
  ```

- [ ] **Step 4: Run the focused domain test to verify it passes**

  Run:

  ```bash
  npm test -- src/domain/filters.test.ts
  ```

  Expected: PASS, including the new old-customer and baseline-filter tests.

- [ ] **Step 5: Commit the filter-domain change**

  ```bash
  git add src/domain/filters.ts src/domain/filters.test.ts
  git commit -m "feat: add old-customer report filtering"
  ```

### Task 2: Add report-row contribution ratios

**Files:**
- Modify: `src/domain/analytics.ts:4-159`
- Modify: `src/domain/analytics.test.ts:1-169`

- [ ] **Step 1: Write failing aggregation tests for same-row baselines**

  Add a main-list case using the new public filter helpers and a direct breakdown case:

  ```ts
  it('calculates summary ratios against the same-dimension baseline row', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportSummaryRows(currentRecords, mockDeals, 'consultant');

    expect(rows).toEqual([
      expect.objectContaining({
        primaryDimensionValue: '张敏',
        reportedAmount: 1250000,
        dealCount: 3,
        customerCount: 3,
        reportedAmountRate: 1250000 / 1800000,
        dealCountRate: 3 / 5,
        customerCountRate: 3 / 4,
      }),
    ]);
  });

  it('calculates breakdown ratios against the same primary and breakdown dimensions', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportBreakdownRows(currentRecords, mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows.find((row) => row.breakdownDimensionValue === '信息流')).toEqual(
      expect.objectContaining({
        reportedAmount: 900000,
        reportedAmountRate: 1,
        dealCountRate: 1,
        customerCountRate: 1,
      }),
    );
  });
  ```

- [ ] **Step 2: Run the aggregation test to verify it fails**

  Run:

  ```bash
  npm test -- src/domain/analytics.test.ts
  ```

  Expected: FAIL because `buildReportSummaryRows` and `buildReportBreakdownRows` do not exist.

- [ ] **Step 3: Implement report aggregation without changing dashboard aggregation**

  In `src/domain/analytics.ts`, add the ratio shape and safe calculation:

  ```ts
  export type ReportContributionValues = {
    reportedAmountRate: number | null;
    dealCountRate: number | null;
    customerCountRate: number | null;
  };

  function calculateContributionValues(
    current: MetricValue,
    baseline: MetricValue | undefined,
  ): ReportContributionValues {
    if (!baseline) {
      return { reportedAmountRate: null, dealCountRate: null, customerCountRate: null };
    }

    return {
      reportedAmountRate: baseline.reportedAmount === 0 ? null : current.reportedAmount / baseline.reportedAmount,
      dealCountRate: baseline.dealCount === 0 ? null : current.dealCount / baseline.dealCount,
      customerCountRate: baseline.customerCount === 0 ? null : current.customerCount / baseline.customerCount,
    };
  }
  ```

  Define the report row types and functions as follows (place them after the existing `buildSummaryRows` function):

  ```ts
  export type ReportSummaryRow = SummaryRow & ReportContributionValues;
  export type ReportBreakdownRow = BreakdownRow & ReportContributionValues;

  function toMetricValue(row: AggregateSummary): MetricValue {
    const { value: _value, ...metrics } = row;
    return metrics;
  }

  export function buildReportSummaryRows(
    records: DealRecord[],
    baselineRecords: DealRecord[],
    primaryDimension: DimensionKey,
  ): ReportSummaryRow[] {
    const baselineByValue = new Map(
      aggregate(baselineRecords, primaryDimension).map((row) => [row.value, toMetricValue(row)]),
    );

    return aggregate(records, primaryDimension).map((row) => {
      const metrics = toMetricValue(row);
      return {
        key: `${primaryDimension}:${row.value}`,
        primaryDimensionValue: row.value,
        ...metrics,
        ...calculateContributionValues(metrics, baselineByValue.get(row.value)),
      };
    });
  }

  export function buildReportBreakdownRows(
    records: DealRecord[],
    baselineRecords: DealRecord[],
    query: BreakdownQuery,
  ): ReportBreakdownRow[] {
    const isPrimaryRow = (record: DealRecord) =>
      getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue;
    const baselineByValue = new Map(
      aggregate(baselineRecords.filter(isPrimaryRow), query.breakdownDimension).map((row) => [
        row.value,
        toMetricValue(row),
      ]),
    );

    return aggregate(records.filter(isPrimaryRow), query.breakdownDimension).map((row) => {
      const metrics = toMetricValue(row);
      return {
        key: `${query.breakdownDimension}:${row.value}`,
        breakdownDimensionValue: row.value,
        ...metrics,
        ...calculateContributionValues(metrics, baselineByValue.get(row.value)),
      };
    });
  }
  ```

  Keep `buildDashboardSummary`, `buildSummaryRows`, and `buildBreakdownRows` unchanged so the dashboard and any unrelated consumers retain their current behavior.

- [ ] **Step 4: Run the aggregation test to verify it passes**

  Run:

  ```bash
  npm test -- src/domain/analytics.test.ts
  ```

  Expected: PASS, including the existing dashboard aggregation coverage and new same-row ratio coverage.

- [ ] **Step 5: Commit the report aggregation change**

  ```bash
  git add src/domain/analytics.ts src/domain/analytics.test.ts
  git commit -m "feat: calculate report contribution ratios"
  ```

### Task 3: Define independent report-table columns

**Files:**
- Create: `src/domain/reportMetrics.tsx`
- Create: `src/domain/reportMetrics.test.tsx`

- [ ] **Step 1: Write failing tests for the report column factory**

  Create `src/domain/reportMetrics.test.tsx`:

  ```tsx
  import { describe, expect, it } from 'vitest';
  import { buildReportMetricColumns } from './reportMetrics';

  describe('report metric columns', () => {
    it('shows only the four base report metrics by default', () => {
      expect(buildReportMetricColumns(false).map((column) => column.key)).toEqual([
        'reportedAmount',
        'dealCount',
        'customerCount',
        'averageDealAmount',
      ]);
    });

    it('appends three contribution ratios for a restricted scope', () => {
      expect(buildReportMetricColumns(true).map((column) => column.key)).toEqual([
        'reportedAmount',
        'dealCount',
        'customerCount',
        'averageDealAmount',
        'reportedAmountRate',
        'dealCountRate',
        'customerCountRate',
      ]);
    });
  });
  ```

- [ ] **Step 2: Run the column test to verify it fails**

  Run:

  ```bash
  npm test -- src/domain/reportMetrics.test.tsx
  ```

  Expected: FAIL because `reportMetrics.tsx` does not exist.

- [ ] **Step 3: Implement the report-only column factory**

  Create `src/domain/reportMetrics.tsx` with this implementation:

  ```ts
  import type { ColumnsType } from 'antd/es/table';
  import { formatMetricValue, type MetricValue } from './metrics';

  export type ReportMetricValue = Pick<
    MetricValue,
    'reportedAmount' | 'dealCount' | 'customerCount' | 'averageDealAmount'
  > & {
    reportedAmountRate: number | null;
    dealCountRate: number | null;
    customerCountRate: number | null;
  };

  type ReportMetricKey = keyof ReportMetricValue;
  type ReportMetricFormat = 'amount' | 'integer' | 'percent';

  type ReportMetricDefinition = {
    key: ReportMetricKey;
    label: string;
    format: ReportMetricFormat;
  };

  const baseMetrics: ReportMetricDefinition[] = [
    { key: 'reportedAmount', label: '上报业绩', format: 'amount' },
    { key: 'dealCount', label: '成交单量', format: 'integer' },
    { key: 'customerCount', label: '成交客户数', format: 'integer' },
    { key: 'averageDealAmount', label: '客单价', format: 'amount' },
  ];

  const contributionMetrics: ReportMetricDefinition[] = [
    { key: 'reportedAmountRate', label: '业绩占比', format: 'percent' },
    { key: 'dealCountRate', label: '单量占比', format: 'percent' },
    { key: 'customerCountRate', label: '客户占比', format: 'percent' },
  ];

  export function buildReportMetricColumns<T extends ReportMetricValue>(
    showContributionRates: boolean,
  ): ColumnsType<T> {
    const metrics = showContributionRates
      ? [...baseMetrics, ...contributionMetrics]
      : baseMetrics;

    return metrics.map((metric) => ({
      title: metric.label,
      dataIndex: metric.key,
      key: metric.key,
      align: 'right',
      width: 170,
      sorter: (left, right) => {
        const leftValue = left[metric.key] ?? 0;
        const rightValue = right[metric.key] ?? 0;
        return leftValue - rightValue;
      },
      render: (value: number | null) =>
        value === null ? '—' : formatMetricValue(value, metric.format),
    }));
  }
  ```

  Keep `src/domain/metrics.tsx` unchanged.

- [ ] **Step 4: Run the column test to verify it passes**

  Run:

  ```bash
  npm test -- src/domain/reportMetrics.test.tsx
  ```

  Expected: PASS with four base columns by default and seven columns for restricted scopes.

- [ ] **Step 5: Commit the report-column change**

  ```bash
  git add src/domain/reportMetrics.tsx src/domain/reportMetrics.test.tsx
  git commit -m "feat: add simplified report columns"
  ```

### Task 4: Wire filters, baseline records, and report surfaces

**Files:**
- Modify: `src/components/FilterBar.tsx:19-22, 127-137`
- Modify: `src/components/SummaryTable.tsx:4-55`
- Modify: `src/components/BreakdownDrawer.tsx:5-105`
- Modify: `src/App.tsx:9-139`
- Modify: `src/App.test.tsx:9-290`

- [ ] **Step 1: Replace obsolete UI assertions with failing acceptance tests**

  Replace the first two tests in `src/App.test.tsx` with assertions that the report and breakdown tables show only the new columns by default:

  ```tsx
  expect(screen.getByRole('columnheader', { name: '上报业绩' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '成交单量' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '成交客户数' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: '客单价' })).toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: /新诊业绩/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('columnheader', { name: '业绩占比' })).not.toBeInTheDocument();
  ```

  Add an interaction test that widens the date range, selects “新客” and “新诊”, clicks “查询”, then verifies `业绩占比` exists both in the report table and after opening “业绩拆解”. Add a second interaction test that selects “老客” and verifies the report only contains records whose customer scope is old. Update existing option text assertions from “当期新客” to “新客”.

- [ ] **Step 2: Run the app test to verify it fails**

  Run:

  ```bash
  npm test -- src/App.test.tsx
  ```

  Expected: FAIL because the UI still uses expanded metric columns, does not expose the deal-type select, and does not pass baseline records to report tables.

- [ ] **Step 3: Implement the public controls and report-only wiring**

  Make the following focused changes:

  1. In `FilterBar.tsx`, set customer labels to `全部 / 新客 / 老客`; add `dealTypeOptions` with `全部 / 新诊 / 复购`; render an Ant Design `Select` labeled “成交类型” immediately after “客户统计范围”. Both controls read/write `localFilters` and continue to commit only on “查询”.
  2. In `App.tsx`, derive `baselineFilters = createBaselineFilters(filters)` and `baselineRecords = filterDealRecords(mockDeals, baselineFilters)`. Keep `filteredRecords` as the current all-filter set so the dashboard continues to respond exactly as it does today. Derive `showContributionRates` when either `filters.customerScope !== 'all'` or `filters.dealType !== 'all'`.
  3. Replace report-row construction with `buildReportSummaryRows(filteredRecords, baselineRecords, primaryDimension)`.
  4. Pass `showContributionRates` into `SummaryTable`; replace its `buildMetricColumns` call with `buildReportMetricColumns(showContributionRates)`.
  5. Pass `baselineRecords` and `showContributionRates` into `BreakdownDrawer`; build each tab with `buildReportBreakdownRows(records, baselineRecords, query)` and `buildReportMetricColumns(showContributionRates)`.
  6. Leave `DashboardOverview`, `metrics.tsx`, and both performance-detail table usages unchanged.

- [ ] **Step 4: Run the app test to verify it passes**

  Run:

  ```bash
  npm test -- src/App.test.tsx
  ```

  Expected: PASS, with public “成交类型” control, simplified default report columns, conditional ratio columns in both report surfaces, and unchanged dashboard assertions.

- [ ] **Step 5: Run the full verification suite and production build**

  Run:

  ```bash
  npm test
  npm run build
  ```

  Expected: both commands exit 0.

- [ ] **Step 6: Commit the UI integration**

  ```bash
  git add src/App.tsx src/App.test.tsx src/components/FilterBar.tsx src/components/SummaryTable.tsx src/components/BreakdownDrawer.tsx
  git commit -m "feat: simplify report metrics by filter scope"
  ```

## Plan self-review

### Spec coverage

- “全部 / 新客 / 老客” customer scope: Task 1 and Task 4.
- “全部 / 新诊 / 复购” public deal-type selector: Task 4.
- Four base report fields and removal of old report fields: Tasks 3 and 4.
- Conditional three ratios with a denominator that ignores only the two new filters: Tasks 1, 2, and 4.
- Same behavior for the main report and breakdown drawer: Tasks 2 and 4.
- Unchanged dashboard rendering and unchanged detail drawer: Task 4.
- Test and build evidence: Task 4, Step 5.

### Placeholder scan

No unfinished markers, deferred implementation, or undefined helper names remain. All new helper names and their responsibilities are defined in Tasks 1–3 before Task 4 uses them.

### Type consistency

`createBaselineFilters` returns `SalesDashboardFilters`; `buildReportSummaryRows` and `buildReportBreakdownRows` produce the ratio-bearing row shapes consumed by `buildReportMetricColumns`; `showContributionRates` is consistently a boolean prop on both report table surfaces.
