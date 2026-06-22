# Filter Bar Inline Expand/Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Modal-based "全部筛选" with inline expand/collapse — all 8 filter controls in a single Form, 6 always visible, 2 collapsed behind "展开"/"收起".

**Architecture:** Rewrite FilterBar.tsx: remove Modal + dual-state pattern, use single `localFilters`/`localPrimaryDimension` state synced from props. Expand toggle is pure conditional rendering. Button group moves to its own row (left-aligned) when expanded.

**Tech Stack:** React 18, Ant Design 5, TypeScript, dayjs

---

### Task 1: Rewrite FilterBar state management

**Files:**
- Modify: `src/components/FilterBar.tsx` (entire file)

- [ ] **Step 1: Replace dual-state pattern with unified local state**

Replace the current state declarations (lines 85-101) with a single unified state:

```tsx
// --- local filter state (committed to parent on "查询") ---
const [localFilters, setLocalFilters] = useState<SalesDashboardFilters>(() => ({
  ...defaultFiltersReset,
  ...filters,
}));
const [localPrimaryDimension, setLocalPrimaryDimension] = useState<DimensionKey>(primaryDimension);
const [expanded, setExpanded] = useState(false);

// Sync from parent when effective filters change externally
useEffect(() => {
  setLocalFilters((prev) => ({
    ...defaultFiltersReset,
    ...filters,
  }));
}, [filters]);

useEffect(() => {
  setLocalPrimaryDimension(primaryDimension);
}, [primaryDimension]);
```

- [ ] **Step 2: Replace toolbar/modal handlers with simplified query/reset**

Remove old handlers (`handleToolbarQuery`, `handleToolbarReset`, `openModal`, `handleModalQuery`, `handleModalReset`) and add:

```tsx
function handleQuery() {
  onFiltersChange(localFilters);
  onPrimaryDimensionChange(localPrimaryDimension);
}

function handleReset() {
  const reset = { ...defaultFiltersReset };
  setLocalFilters(reset);
  setLocalPrimaryDimension('consultant');
  onFiltersChange(reset);
  onPrimaryDimensionChange('consultant');
}
```

- [ ] **Step 3: Remove unused imports and constants**

Replace the import line:
```tsx
import { Button, DatePicker, Form, Modal, Select, Space, TreeSelect } from 'antd';
```
with:
```tsx
import { Button, DatePicker, Form, Select, Space, TreeSelect } from 'antd';
```

Remove the unused `dealTypeOptions` constant (lines 23-27):
```tsx
// DELETE these lines:
const dealTypeOptions: Array<{ value: DealTypeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'newDiagnosis', label: '新诊' },
  { value: 'repurchase', label: '复购' },
];
```

Remove unused `DealTypeFilter` from the filter imports:
```tsx
import {
  buildTreeData,
  getFilterOptions,
  type CustomerScopeFilter,
  type SalesDashboardFilters,
  type TreeDataNode,
} from '../domain/filters';
```

- [ ] **Step 4: Verify the file compiles**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "refactor: unify FilterBar state, remove Modal-related state/handlers"
```

---

### Task 2: Rewrite FilterBar JSX — inline expand/collapse layout

**Files:**
- Modify: `src/components/FilterBar.tsx` (return statement)

- [ ] **Step 1: Replace the entire return statement**

Replace the current return statement (lines 130-377) with the new inline layout. All 8 controls + conditional expand + conditional button group:

```tsx
  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
        <DatePicker.RangePicker
          allowClear={false}
          presets={presets}
          value={
            localFilters.dateRange?.map((date) => dayjs(date)) as
              | [dayjs.Dayjs, dayjs.Dayjs]
              | undefined
          }
          onChange={(_, dateStrings) => {
            setLocalFilters((prev) => ({
              ...prev,
              dateRange:
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
            }));
          }}
        />
      </Form.Item>
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
      <Form.Item label="客户统计范围">
        <Select
          value={localFilters.customerScope}
          style={{ width: 160 }}
          placeholder="请选择客户统计范围"
          options={customerScopeOptions}
          onChange={(customerScope) =>
            setLocalFilters((prev) => ({ ...prev, customerScope }))
          }
        />
      </Form.Item>
      <Form.Item label="咨询师">
        <TreeSelect
          treeData={treeData.consultantTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择部门/咨询师"
          value={[...localFilters.departments, ...localFilters.consultants]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.consultantTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              departments: parents,
              consultants: children,
            }));
          }}
        />
      </Form.Item>
      <Form.Item label="渠道">
        <TreeSelect
          treeData={treeData.channelTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择渠道分类/渠道"
          value={[...localFilters.channelCategories, ...localFilters.channels]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.channelTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              channelCategories: parents,
              channels: children,
            }));
          }}
        />
      </Form.Item>
      <Form.Item label="项目">
        <TreeSelect
          treeData={treeData.projectTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择项目分类/项目"
          value={[...localFilters.projectCategories, ...localFilters.projects]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.projectTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              projectCategories: parents,
              projects: children,
            }));
          }}
        />
      </Form.Item>

      {expanded && (
        <>
          <Form.Item label="城市&机构">
            <TreeSelect
              treeData={treeData.cityTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: 180 }}
              placeholder="请选择城市/机构"
              value={[...localFilters.cities, ...localFilters.institutions]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.cityTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setLocalFilters((prev) => ({
                  ...prev,
                  cities: parents,
                  institutions: children,
                }));
              }}
            />
          </Form.Item>
          <Form.Item label="客户池">
            <Select
              mode="multiple"
              value={localFilters.customerPools}
              placeholder="请选择客户池"
              maxTagCount="responsive"
              style={{ width: 180 }}
              options={toSelectOptions(customerPoolOptions)}
              onChange={(customerPools) =>
                setLocalFilters((prev) => ({ ...prev, customerPools }))
              }
            />
          </Form.Item>
        </>
      )}

      {expanded ? (
        <div style={{ width: '100%', marginTop: 8 }}>
          <Space>
            <Button type="primary" onClick={handleQuery}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button>导出汇总</Button>
          </Space>
          <Button
            type="link"
            style={{ padding: 0, marginLeft: 8 }}
            onClick={() => setExpanded(false)}
          >
            收起 &#x25B2;
          </Button>
        </div>
      ) : (
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleQuery}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button>导出汇总</Button>
          </Space>
          <Button
            type="link"
            style={{ padding: 0, marginLeft: 8 }}
            onClick={() => setExpanded(true)}
          >
            展开 &#x25BC;
          </Button>
        </Form.Item>
      )}
    </Form>
  );
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: replace Modal with inline expand/collapse filter layout"
```

---

### Task 3: Remove unused Modal-related CSS

**Files:**
- Modify: `src/styles.css` (lines 27-43)

- [ ] **Step 1: Remove filter-grid CSS classes**

Replace the filter-grid block (lines 27-43):
```css
/* Filter grid — 3-column layout for the all-filters modal */
.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.filter-grid-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-grid-label {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.88);
  white-space: nowrap;
}
```

with nothing (delete the block entirely).

- [ ] **Step 2: Also remove the unused `.filter-bar-more` class** (lines 19-23):
```css
.filter-bar-more {
  display: flex;
  flex-wrap: wrap;
  gap: 0 0;
  width: 100%;
}
```

- [ ] **Step 3: Verify the page loads without CSS errors**

```bash
npm run dev
```
Open browser, confirm no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css
git commit -m "style: remove unused filter-grid and filter-bar-more CSS classes"
```

---

### Task 4: Final verification

**Files:**
- Read: `src/components/FilterBar.tsx` (full file)
- Read: `src/styles.css` (full file)

- [ ] **Step 1: Read the final FilterBar.tsx to verify completeness**

```bash
# Read the file from disk
```

Checklist:
- [ ] No `Modal` import or JSX
- [ ] No `modalOpen`, `modalFilters`, `modalPrimaryDimension` state
- [ ] No `toolbarDateRange`, `toolbarPrimaryDimension`, `toolbarCustomerScope` state
- [ ] `localFilters` and `localPrimaryDimension` with useEffect sync
- [ ] `expanded` boolean state
- [ ] `handleQuery` and `handleReset` handlers
- [ ] 6 always-visible Form.Item controls
- [ ] 2 conditionally rendered Form.Item controls (`{expanded && ...}`)
- [ ] Button group: collapsed = inline `Form.Item`, expanded = full-width div left-aligned
- [ ] Expand/Collapse link with ▾/▴ arrows

- [ ] **Step 2: Read styles.css to verify cleanup**

```bash
# Read the file from disk
```

Checklist:
- [ ] No `.filter-grid` class
- [ ] No `.filter-grid-item` class
- [ ] No `.filter-grid-label` class
- [ ] No `.filter-bar-more` class

- [ ] **Step 3: TypeScript compilation check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Run dev server and smoke test**

```bash
npm run dev
```

Manual verification:
- [ ] Page loads, no console errors
- [ ] All 6 default filter controls visible in one row
- [ ] Click "展开" → 城市&机构 and 客户池 appear, button group moves below left-aligned
- [ ] Click "收起" → extra controls hide, button group back inline
- [ ] "查询" commits all filters correctly
- [ ] "重置" clears all filters to defaults

- [ ] **Step 5: Commit final verification state if any fixes made**

```bash
git status
# Only commit if changes were made during verification
```
