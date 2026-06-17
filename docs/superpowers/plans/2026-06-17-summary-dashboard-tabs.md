# Summary Dashboard Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an “仪表盘 / 报表” content Tab structure where global filters control both views, the dashboard shows 10 total metrics, and the primary dimension selector moves into the report Tab.

**Architecture:** Keep filtering in `App.tsx` as the single source of `filteredRecords`. Add a total aggregation function in `src/domain/analytics.ts`, reuse metric formatting from `src/domain/metrics.tsx`, and render a focused `DashboardOverview` component for the 10 metric cards. Keep the existing report table and drawers intact, only moving the primary dimension control out of `FilterBar`.

**Tech Stack:** React 18, TypeScript, Ant Design 5, Vitest, Testing Library.

---

## File Structure

- Modify `src/domain/analytics.ts`
  - Extract a reusable metric calculator from the current private `aggregate()` logic.
  - Export `buildDashboardSummary(records)` for whole filtered-record totals.
- Modify `src/domain/analytics.test.ts`
  - Add tests for dashboard totals and empty data.
- Create `src/components/DashboardOverview.tsx`
  - Render the 10 configured dashboard metrics as Ant Design cards.
- Modify `src/components/FilterBar.tsx`
  - Remove primary dimension props, local state, and global “主维度” field.
- Modify `src/App.tsx`
  - Add Tabs.
  - Put `DashboardOverview` in “仪表盘”.
  - Put primary dimension selector and existing `SummaryTable` in “报表”.
- Modify `src/App.test.tsx`
  - Update tests that locate the primary dimension selector.
  - Add tests for the new Tabs, dashboard metrics, and primary dimension behavior.
- Modify `src/styles.css`
  - Add small layout classes for dashboard cards and report toolbar.

---

### Task 1: Add Whole-Result Dashboard Aggregation

**Files:**
- Modify: `src/domain/analytics.ts`
- Test: `src/domain/analytics.test.ts`

- [ ] **Step 1: Add failing tests for dashboard totals**

Add `buildDashboardSummary` to the import:

```ts
import {
  buildBreakdownRows,
  buildDashboardSummary,
  buildSummaryRows,
  getDetailRecords,
} from './analytics';
```

Append these tests inside `describe('sales analytics aggregation', () => { ... })`:

```ts
  it('builds dashboard summary totals from the full filtered record set', () => {
    const summary = buildDashboardSummary(mockDeals);

    expect(summary).toMatchObject({
      reportedAmount: 3900000,
      confirmedAmount: 3312000,
      dealCount: 9,
      customerCount: 8,
      newDiagnosisAmount: 2150000,
      newDiagnosisDealCount: 5,
      newDiagnosisCustomerCount: 5,
      repurchaseAmount: 1750000,
      repurchaseDealCount: 4,
      repurchaseCustomerCount: 4,
    });
  });

  it('builds zero dashboard summary for empty records', () => {
    expect(buildDashboardSummary([])).toMatchObject({
      reportedAmount: 0,
      confirmedAmount: 0,
      dealCount: 0,
      customerCount: 0,
      newDiagnosisAmount: 0,
      newDiagnosisDealCount: 0,
      newDiagnosisCustomerCount: 0,
      repurchaseAmount: 0,
      repurchaseDealCount: 0,
      repurchaseCustomerCount: 0,
    });
  });
```

- [ ] **Step 2: Run the focused analytics test and verify it fails**

Run:

```bash
npm test -- src/domain/analytics.test.ts
```

Expected: FAIL because `buildDashboardSummary` is not exported from `src/domain/analytics.ts`.

- [ ] **Step 3: Extract reusable metric calculation**

In `src/domain/analytics.ts`, add this function above `aggregate()`:

```ts
function calculateMetrics(groupRecords: DealRecord[]): MetricValue {
  const customerIds = new Set(groupRecords.map((record) => record.customerId));
  const newDiagnosisRecords = groupRecords.filter((record) => record.dealType === '新诊');
  const repurchaseRecords = groupRecords.filter((record) => record.dealType === '复购');
  const newCustomerRecords = groupRecords.filter((record) => record.customerCreatedInPeriod);

  const reportedAmount = groupRecords.reduce((sum, record) => sum + record.reportedAmount, 0);
  const confirmedAmount = groupRecords.reduce((sum, record) => sum + record.confirmedAmount, 0);
  const dealCount = groupRecords.length;
  const customerCount = customerIds.size;
  const newDiagnosisAmount = newDiagnosisRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const repurchaseAmount = repurchaseRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const newDiagnosisCustomerCount = new Set(
    newDiagnosisRecords.map((record) => record.customerId),
  ).size;
  const repurchaseCustomerCount = new Set(
    repurchaseRecords.map((record) => record.customerId),
  ).size;
  const newCustomerCount = new Set(newCustomerRecords.map((record) => record.customerId)).size;
  const newCustomerAmount = newCustomerRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const createdCustomerCountInPeriod =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.createdCustomerCountInPeriod));
  const historicalRepurchaseCustomerCount =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.historicalRepurchaseCustomerCount));
  const historicalRepurchaseAmount =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.historicalRepurchaseAmount));

  return {
    reportedAmount,
    confirmedAmount,
    dealCount,
    customerCount,
    averageDealAmount: safeDivide(reportedAmount, dealCount),
    newDiagnosisAmount,
    newDiagnosisDealCount: newDiagnosisRecords.length,
    newDiagnosisCustomerCount,
    newDiagnosisDealCountRate: safeDivide(newDiagnosisRecords.length, dealCount),
    newDiagnosisCustomerRate: safeDivide(newDiagnosisCustomerCount, customerCount),
    newDiagnosisAmountRate: safeDivide(newDiagnosisAmount, reportedAmount),
    repurchaseAmount,
    repurchaseDealCount: repurchaseRecords.length,
    repurchaseCustomerCount,
    repurchaseDealCountRate: safeDivide(repurchaseRecords.length, dealCount),
    repurchaseCustomerRate: safeDivide(repurchaseCustomerCount, customerCount),
    repurchaseAmountRate: safeDivide(repurchaseAmount, reportedAmount),
    newCustomerConversionRate: safeDivide(newCustomerCount, createdCustomerCountInPeriod),
    newCustomerAmountContributionRate: safeDivide(newCustomerAmount, reportedAmount),
    historicalRepurchaseCustomerContributionRate: safeDivide(
      repurchaseCustomerCount,
      historicalRepurchaseCustomerCount,
    ),
    historicalRepurchaseAmountContributionRate: safeDivide(
      repurchaseAmount,
      historicalRepurchaseAmount,
    ),
  };
}
```

Then replace the repeated metric calculation inside `aggregate().map()` with:

```ts
    .map(([value, groupRecords]) => ({
      value,
      ...calculateMetrics(groupRecords),
    }))
```

Add the exported dashboard function below `buildSummaryRows()`:

```ts
export function buildDashboardSummary(records: DealRecord[]): MetricValue {
  return calculateMetrics(records);
}
```

- [ ] **Step 4: Run analytics tests and verify they pass**

Run:

```bash
npm test -- src/domain/analytics.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit analytics aggregation**

```bash
git add src/domain/analytics.ts src/domain/analytics.test.ts
git commit -m "feat: add dashboard summary aggregation"
```

---

### Task 2: Create Dashboard Overview Component

**Files:**
- Create: `src/components/DashboardOverview.tsx`
- Test: `src/App.test.tsx`

- [ ] **Step 1: Add failing App test for dashboard cards**

Append this test inside `describe('App', () => { ... })` in `src/App.test.tsx`:

```ts
  it('renders dashboard tab with ten total metric cards', () => {
    render(<App />);

    expect(screen.getByRole('tab', { name: '仪表盘' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '报表' })).toBeInTheDocument();
    expect(screen.getByText('上报业绩')).toBeInTheDocument();
    expect(screen.getByText('确认业绩')).toBeInTheDocument();
    expect(screen.getByText('成交单量')).toBeInTheDocument();
    expect(screen.getByText('成交客户数')).toBeInTheDocument();
    expect(screen.getByText('新诊业绩')).toBeInTheDocument();
    expect(screen.getByText('新诊单量')).toBeInTheDocument();
    expect(screen.getByText('新诊客户数')).toBeInTheDocument();
    expect(screen.getByText('复购业绩')).toBeInTheDocument();
    expect(screen.getByText('复购单量')).toBeInTheDocument();
    expect(screen.getByText('复购客户数')).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the App test and verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the Tabs and dashboard component do not exist yet.

- [ ] **Step 3: Create DashboardOverview component**

Create `src/components/DashboardOverview.tsx`:

```tsx
import { Card } from 'antd';
import type { MetricKey, MetricValue } from '../domain/metrics';
import { formatMetricValue, metricGroups } from '../domain/metrics';

type DashboardOverviewProps = {
  summary: MetricValue;
};

const dashboardMetricKeys: MetricKey[] = [
  'reportedAmount',
  'confirmedAmount',
  'dealCount',
  'customerCount',
  'newDiagnosisAmount',
  'newDiagnosisDealCount',
  'newDiagnosisCustomerCount',
  'repurchaseAmount',
  'repurchaseDealCount',
  'repurchaseCustomerCount',
];

const metricDefinitions = metricGroups.flatMap((group) => group.metrics);

function getMetricDefinition(key: MetricKey) {
  const definition = metricDefinitions.find((metric) => metric.key === key);

  if (!definition) {
    throw new Error(`Missing metric definition: ${key}`);
  }

  return definition;
}

export default function DashboardOverview({ summary }: DashboardOverviewProps) {
  return (
    <div className="dashboard-grid">
      {dashboardMetricKeys.map((key) => {
        const metric = getMetricDefinition(key);

        return (
          <Card key={key} className="dashboard-metric-card">
            <div className="dashboard-metric-label">{metric.label}</div>
            <div className="dashboard-metric-value">
              {formatMetricValue(summary[key], metric.format)}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Add dashboard styles**

Append to `src/styles.css`:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.dashboard-metric-card .ant-card-body {
  padding: 16px;
}

.dashboard-metric-label {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 8px;
}

.dashboard-metric-value {
  color: #111827;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
```

- [ ] **Step 5: Do not commit yet**

Expected: component exists, but App is not wired yet. Commit after Task 3 so this component is used.

---

### Task 3: Add Tabs And Move Primary Dimension Into Report Tab

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/FilterBar.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update FilterBar props and behavior**

In `src/components/FilterBar.tsx`, change the props type to:

```ts
type FilterBarProps = {
  filters: SalesDashboardFilters;
  records: DealRecord[];
  onFiltersChange: (filters: SalesDashboardFilters) => void;
};
```

Update the function signature:

```ts
export default function FilterBar({
  filters,
  records,
  onFiltersChange,
}: FilterBarProps) {
```

Remove these lines:

```ts
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';
```

Remove local primary dimension state and sync effect:

```ts
  const [localPrimaryDimension, setLocalPrimaryDimension] = useState<DimensionKey>(primaryDimension);

  useEffect(() => {
    setLocalPrimaryDimension(primaryDimension);
  }, [primaryDimension]);
```

Change `handleQuery()` to:

```ts
  function handleQuery() {
    onFiltersChange(localFilters);
  }
```

Change `handleReset()` to:

```ts
  function handleReset() {
    const reset = { ...defaultFiltersReset };
    setLocalFilters(reset);
    onFiltersChange(reset);
  }
```

Remove the full global primary dimension `Form.Item`:

```tsx
      <Form.Item label="主维度">
        <Select
          value={localPrimaryDimension}
          style={{ width: 140 }}
          placeholder="请选择主维度"
          aria-label="主维度"
          virtual={false}
          options={dimensions.map((d) => ({ value: d.key, label: d.label }))}
          onChange={setLocalPrimaryDimension}
        />
      </Form.Item>
```

- [ ] **Step 2: Wire App with Tabs and dashboard summary**

In `src/App.tsx`, update imports:

```tsx
import { Card, Select, Space, Tabs } from 'antd';
import DashboardOverview from './components/DashboardOverview';
import {
  buildDashboardSummary,
  buildSummaryRows,
  getDetailRecords,
  type SummaryRow,
} from './domain/analytics';
import { dimensions, getDimension, type DimensionKey } from './domain/dimensions';
```

Add dashboard summary memo after `filteredRecords`:

```tsx
  const dashboardSummary = useMemo(
    () => buildDashboardSummary(filteredRecords),
    [filteredRecords],
  );
```

Update `FilterBar` usage:

```tsx
        <FilterBar
          filters={filters}
          records={mockDeals}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedBreakdownRow(null);
            setSelectedDetailRow(null);
          }}
        />
```

Replace the summary table `Card` with:

```tsx
      <Card className="content-card">
        <Tabs
          defaultActiveKey="dashboard"
          items={[
            {
              key: 'dashboard',
              label: '仪表盘',
              children: <DashboardOverview summary={dashboardSummary} />,
            },
            {
              key: 'report',
              label: '报表',
              children: (
                <>
                  <div className="report-toolbar">
                    <Space>
                      <span className="report-toolbar-label">主维度</span>
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
                        onChange={(dimension) => {
                          setPrimaryDimension(dimension);
                          setSelectedBreakdownRow(null);
                          setSelectedDetailRow(null);
                        }}
                      />
                    </Space>
                  </div>
                  <SummaryTable
                    primaryDimension={primaryDimensionConfig}
                    rows={summaryRows}
                    onOpenBreakdown={setSelectedBreakdownRow}
                    onOpenDetails={setSelectedDetailRow}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>
```

- [ ] **Step 3: Add report toolbar styles**

Append to `src/styles.css`:

```css
.content-card {
  margin-top: 16px;
}

.report-toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.report-toolbar-label {
  color: #374151;
  font-weight: 500;
}
```

- [ ] **Step 4: Update tests that need the report Tab**

In `src/App.test.tsx`, add this helper above `describe('App', () => {`:

```ts
async function openReportTab(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: '报表' }));
}
```

For every test that clicks the primary dimension selector or expects report-table buttons, call `await openReportTab(user);` before interacting with report-only UI.

Examples:

```ts
  it('shows date and project dimensions in the primary dimension selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));

    expect(await screen.findByRole('option', { name: '日期' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目分类' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '项目' })).toBeInTheDocument();
  });
```

```ts
  it('allows department to break down by consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await openReportTab(user);
    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(await screen.findByRole('option', { name: '部门' }));
    await user.click(screen.getAllByRole('button', { name: '业绩拆解' })[0]);

    const drawer = screen.getByRole('dialog', { name: /业绩拆解/ });
    expect(within(drawer).getByRole('tab', { name: '咨询师' })).toBeInTheDocument();
  });
```

Update the inline filters test expectation:

```ts
    expect(screen.getByText('统计时间')).toBeInTheDocument();
    expect(screen.queryByText('主维度')).not.toBeInTheDocument();
    expect(screen.getByText('客户统计范围')).toBeInTheDocument();
```

Add a dedicated assertion that primary dimension appears in the report Tab:

```ts
  it('shows primary dimension only inside the report tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.queryByRole('combobox', { name: '主维度' })).not.toBeInTheDocument();

    await openReportTab(user);

    expect(screen.getByRole('combobox', { name: '主维度' })).toBeInTheDocument();
  });
```

- [ ] **Step 5: Run App tests and verify they pass**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit tabs and dashboard UI**

```bash
git add src/App.tsx src/App.test.tsx src/components/DashboardOverview.tsx src/components/FilterBar.tsx src/styles.css
git commit -m "feat: add dashboard and report tabs"
```

---

### Task 4: Verify Filtering Controls Both Tabs

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing test for shared filter behavior**

Append this test inside `describe('App', () => { ... })`:

```ts
  it('uses global filters for both dashboard totals and report rows', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('¥430,000')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    const customerScopeFormItem = screen.getByText('客户统计范围').closest('.ant-form-item')!;
    const selector = customerScopeFormItem.querySelector('.ant-select-selector')!;
    fireEvent.mouseDown(selector);
    fireEvent.click(await screen.findByText('当期新客'));

    const filterBar = document.querySelector('.filter-bar')!;
    await user.click(within(filterBar as HTMLElement).getByRole('button', { name: '查 询' }));

    await waitFor(() => {
      expect(screen.getByText('¥0')).toBeInTheDocument();
    });

    await openReportTab(user);

    expect(screen.queryByRole('button', { name: '业绩拆解' })).not.toBeInTheDocument();
  });
```

This test relies on the default date range being today. In the existing mock data, today’s default record is not an “当期新客”, so the dashboard should move to zero and the report should become empty after applying the filter.

- [ ] **Step 2: Run App tests**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: PASS if Task 3 wiring is correct. If it fails because several zero cards render `¥0`, replace the assertion with this less ambiguous check:

```ts
    await waitFor(() => {
      expect(screen.getAllByText('¥0').length).toBeGreaterThan(0);
    });
```

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 4: Commit shared filter coverage**

```bash
git add src/App.test.tsx
git commit -m "test: cover shared dashboard filters"
```

---

### Task 5: Build And Browser Smoke Test

**Files:**
- No planned source changes unless verification finds a bug.

- [ ] **Step 1: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 2: Start local dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Browser smoke test**

Open the local URL and verify:

- “仪表盘” is the default visible Tab.
- Dashboard shows the 10 metric cards.
- Top filter bar no longer shows “主维度”.
- Switching to “报表” shows the primary dimension selector.
- Changing primary dimension changes report rows, but does not change dashboard totals.
- Applying global filters changes both dashboard totals and report rows.
- “业绩拆解” and “业绩明细” still open from the report Tab.

- [ ] **Step 4: Stop local dev server**

Stop the Vite server from the terminal session.

- [ ] **Step 5: Final status check**

Run:

```bash
git status --short
```

Expected: clean working tree.

If there are uncommitted fixes from the smoke test, commit them with a focused message:

```bash
git add <changed-files>
git commit -m "fix: polish dashboard tab behavior"
```

---

## Self-Review

- Spec coverage: Covered the two Tabs, 10 dashboard metrics, shared global filters, moving primary dimension into the report Tab, preserving report/drawer behavior, empty filtered data, and no chart implementation.
- Placeholder scan: No unresolved placeholder markers. Code steps include concrete snippets and commands.
- Type consistency: `buildDashboardSummary(records): MetricValue`, `DashboardOverview({ summary })`, and existing `SummaryRow`/`DimensionKey` types are used consistently.
