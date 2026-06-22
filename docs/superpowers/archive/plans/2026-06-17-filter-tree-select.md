# Filter TreeSelect Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 4 pairs of hierarchical `Select` controls with 4 antd `TreeSelect` components in the filter modal, add back customer pool filter, and reorder modal to 3×3 grid.

**Architecture:** Add `buildTreeData()` to `filters.ts` that builds 4 tree structures from `DealRecord[]`; `FilterBar.tsx` uses `TreeSelect` with `treeCheckable` and splits flat selected values back into parent/child filter arrays.

**Tech Stack:** React, TypeScript, antd `TreeSelect`, vitest

---

## File Structure

| File | Role |
|---|---|
| `src/domain/filters.ts` | Add `buildTreeData()` + `FilterTreeData` type; simplify `getFilterOptions()` |
| `src/domain/filters.test.ts` | Test `buildTreeData()` structure; update `getFilterOptions` tests |
| `src/components/FilterBar.tsx` | Replace 4 pairs of Select → 4 TreeSelect + customer pool; reorder grid |

---

### Task 1: Add `buildTreeData()` and simplify `getFilterOptions()`

**Files:**
- Modify: `src/domain/filters.ts`

- [ ] **Step 1: Add import and types**

In `src/domain/filters.ts`, add the import and new type after `SalesDashboardFilterOptions`:

```typescript
import type { TreeSelectProps } from 'antd';

export type TreeDataNode = NonNullable<TreeSelectProps['treeData']>[number];

export type FilterTreeData = {
  consultantTree: TreeDataNode[];
  channelTree: TreeDataNode[];
  projectTree: TreeDataNode[];
  cityTree: TreeDataNode[];
};
```

- [ ] **Step 2: Add `buildTreeData()` function**

Add after the `uniqueSorted` function:

```typescript
export function buildTreeData(records: DealRecord[]): FilterTreeData {
  const deptMap = new Map<string, Set<string>>();
  const channelCatMap = new Map<string, Set<string>>();
  const projectCatMap = new Map<string, Set<string>>();
  const cityMap = new Map<string, Set<string>>();

  for (const r of records) {
    if (!deptMap.has(r.department)) deptMap.set(r.department, new Set());
    deptMap.get(r.department)!.add(r.consultant);

    if (!channelCatMap.has(r.channelCategory)) channelCatMap.set(r.channelCategory, new Set());
    channelCatMap.get(r.channelCategory)!.add(r.channel);

    if (!projectCatMap.has(r.projectCategory)) projectCatMap.set(r.projectCategory, new Set());
    projectCatMap.get(r.projectCategory)!.add(r.project);

    if (!cityMap.has(r.city)) cityMap.set(r.city, new Set());
    cityMap.get(r.city)!.add(r.institution);
  }

  function toTree(map: Map<string, Set<string>>): TreeDataNode[] {
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .map(([parent, children]) => ({
        title: parent,
        value: parent,
        children: [...children]
          .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
          .map((child) => ({ title: child, value: child })),
      }));
  }

  return {
    consultantTree: toTree(deptMap),
    channelTree: toTree(channelCatMap),
    projectTree: toTree(projectCatMap),
    cityTree: toTree(cityMap),
  };
}
```

- [ ] **Step 3: Simplify `getFilterOptions()` — remove scope and cascade logic**

Replace the current `getFilterOptions` function. It no longer needs `FilterOptionScope` or cascade filtering since TreeSelect shows full tree:

```typescript
export function getFilterOptions(
  records: DealRecord[],
): Pick<SalesDashboardFilterOptions, 'customerPools'> {
  return {
    customerPools: uniqueSorted(records.map((record) => record.customerPool)),
  };
}
```

- [ ] **Step 4: Remove unused `FilterOptionScope` export**

Delete the `FilterOptionScope` type export. The block:

```typescript
export type FilterOptionScope = Pick<
  SalesDashboardFilters,
  'departments' | 'channelCategories' | 'projectCategories' | 'cities'
>;
```

should be removed.

- [ ] **Step 5: Run existing tests to confirm no accidental breaks**

```bash
npx vitest run src/domain/filters.test.ts
```

Expected: some tests may fail due to `getFilterOptions` signature change — that's expected, will be fixed in Task 2.

- [ ] **Step 6: Commit**

```bash
git add src/domain/filters.ts
git commit -m "feat: add buildTreeData() and simplify getFilterOptions() for TreeSelect"
```

---

### Task 2: Update and add tests in `filters.test.ts`

**Files:**
- Modify: `src/domain/filters.test.ts`

- [ ] **Step 1: Add import**

Add `buildTreeData` to the import:

```typescript
import { buildTreeData, filterDealRecords, getFilterOptions, type SalesDashboardFilters } from './filters';
```

- [ ] **Step 2: Add tests for `buildTreeData`**

Add at the end of the file, before the closing of the parent `describe`:

```typescript
  describe('buildTreeData', () => {
    it('builds consultant tree keyed by department', () => {
      const { consultantTree } = buildTreeData(mockDeals);

      const deptNames = consultantTree.map((n) => n.title);
      expect(deptNames).toEqual(['华东一部', '华南一部']);

      const huadong = consultantTree.find((n) => n.title === '华东一部')!;
      expect(huadong.children).toHaveLength(1);
      expect(huadong.children![0].title).toBe('张敏');

      const huanan = consultantTree.find((n) => n.title === '华南一部')!;
      expect(huanan.children).toHaveLength(1);
      expect(huanan.children![0].title).toBe('李然');
    });

    it('builds channel tree keyed by channelCategory', () => {
      const { channelTree } = buildTreeData(mockDeals);

      const catNames = channelTree.map((n) => n.title);
      expect(catNames).toContain('线上投放');
      expect(catNames).toContain('私域运营');

      const onlineAd = channelTree.find((n) => n.title === '线上投放')!;
      const childNames = onlineAd.children!.map((c) => c.title);
      expect(childNames).toContain('信息流');
    });

    it('builds project tree keyed by projectCategory', () => {
      const { projectTree } = buildTreeData(mockDeals);

      const catNames = projectTree.map((n) => n.title);
      expect(catNames).toContain('高端咨询');
      expect(catNames).toContain('专项服务');

      const premium = projectTree.find((n) => n.title === '高端咨询')!;
      expect(premium.children![0].title).toBe('年度管理咨询包');
    });

    it('builds city tree keyed by city', () => {
      const { cityTree } = buildTreeData(mockDeals);

      const cityNames = cityTree.map((n) => n.title);
      expect(cityNames).toContain('上海');
      expect(cityNames).toContain('杭州');

      const shanghai = cityTree.find((n) => n.title === '上海')!;
      expect(shanghai.children![0].title).toBe('上海中心');
    });

    it('sorts tree nodes alphabetically by Chinese locale', () => {
      const { cityTree } = buildTreeData(mockDeals);
      // All trees should be sorted by their parent titles
      for (let i = 1; i < cityTree.length; i++) {
        expect(cityTree[i - 1].title <= cityTree[i].title).toBe(true);
      }
    });

    it('returns empty trees for empty records', () => {
      const { consultantTree, channelTree, projectTree, cityTree } = buildTreeData([]);
      expect(consultantTree).toHaveLength(0);
      expect(channelTree).toHaveLength(0);
      expect(projectTree).toHaveLength(0);
      expect(cityTree).toHaveLength(0);
    });
  });
```

- [ ] **Step 3: Update existing `getFilterOptions` test**

The old test calls `getFilterOptions(records, scope)` with a scope object. Update it to call without scope and only assert `customerPools`:

```typescript
  it('returns customer pool options from all records', () => {
    const options = getFilterOptions(mockDeals);

    expect(options.customerPools).toEqual(
      expect.arrayContaining(['高客单价池', '普通客户池', '复购客户池']),
    );
  });
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run src/domain/filters.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/domain/filters.test.ts
git commit -m "test: add buildTreeData tests, update getFilterOptions test"
```

---

### Task 3: Replace Select pairs with TreeSelect in FilterBar modal

**Files:**
- Modify: `src/components/FilterBar.tsx`

- [ ] **Step 1: Add TreeSelect import**

Add `TreeSelect` to the antd import line (line 1):

```typescript
import { Button, DatePicker, Form, Modal, Select, Space, TreeSelect } from 'antd';
```

- [ ] **Step 2: Replace imports and options computation**

Replace the import of `getFilterOptions`:

```typescript
import {
  buildTreeData,
  getFilterOptions,
  type CustomerScopeFilter,
  type DealTypeFilter,
  type SalesDashboardFilters,
  type TreeDataNode,
} from '../domain/filters';
```

Replace the `options` useMemo. Before (around line 108-119):

```typescript
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
```

Replace with:

```typescript
  const treeData = useMemo(() => buildTreeData(records), [records]);
  const customerPoolOptions = useMemo(
    () => getFilterOptions(records).customerPools,
    [records],
  );
```

- [ ] **Step 3: Add helper to split TreeSelect values into parent/child**

Add a helper function inside `FilterBar`, before the `return`:

```typescript
  function getParentValues(tree: TreeDataNode[]): Set<string> {
    return new Set(tree.map((node) => node.value as string));
  }
```

- [ ] **Step 4: Replace modal Row 2 (部门 + 咨询师 + 成交类型)**

Delete lines ~259-293 (the `{/* Row 2 */}` section with 部门 Select, 咨询师 Select, 成交类型 Select).

Replace with:

```tsx
          {/* Row 2 */}
          <div className="filter-grid-item">
            <div className="filter-grid-label">咨询师</div>
            <TreeSelect
              treeData={treeData.consultantTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择部门/咨询师"
              value={[...modalFilters.departments, ...modalFilters.consultants]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.consultantTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  departments: parents,
                  consultants: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">渠道</div>
            <TreeSelect
              treeData={treeData.channelTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择渠道分类/渠道"
              value={[...modalFilters.channelCategories, ...modalFilters.channels]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.channelTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  channelCategories: parents,
                  channels: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">项目</div>
            <TreeSelect
              treeData={treeData.projectTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择项目分类/项目"
              value={[...modalFilters.projectCategories, ...modalFilters.projects]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.projectTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  projectCategories: parents,
                  projects: children,
                }));
              }}
            />
          </div>
```

- [ ] **Step 5: Replace modal Row 3 + Row 4 (渠道分类, 渠道, 项目分类, 项目, 城市, 机构)**

Delete lines ~296-398 (the `{/* Row 3 */}` and `{/* Row 4 */}` sections containing 渠道分类, 渠道, 项目分类, 项目, 城市, 机构 Selects).

Replace with:

```tsx
          {/* Row 3 */}
          <div className="filter-grid-item">
            <div className="filter-grid-label">城市&机构</div>
            <TreeSelect
              treeData={treeData.cityTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择城市/机构"
              value={[...modalFilters.cities, ...modalFilters.institutions]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.cityTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  cities: parents,
                  institutions: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">客户池</div>
            <Select
              mode="multiple"
              value={modalFilters.customerPools}
              placeholder="请选择客户池"
              maxTagCount="responsive"
              style={{ width: '100%' }}
              options={toSelectOptions(customerPoolOptions)}
              onChange={(customerPools) =>
                setModalFilters((prev) => ({ ...prev, customerPools }))
              }
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">成交类型</div>
            <Select
              value={modalFilters.dealType}
              placeholder="请选择成交类型"
              style={{ width: '100%' }}
              options={dealTypeOptions}
              onChange={(dealType) =>
                setModalFilters((prev) => ({ ...prev, dealType }))
              }
            />
          </div>
```

- [ ] **Step 6: Run full test suite**

```bash
npx vitest run
```

Expected: all existing tests pass.

- [ ] **Step 7: Verify app compiles**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/FilterBar.tsx
git commit -m "feat: replace 4 pairs of Select with TreeSelect, add customer pool, reorder modal to 3x3 grid"
```

---

### Task 4: Update App.test.tsx for new filter labels

**Files:**
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Update the modal labels assertion (line 109-127)**

The test `'shows detailed filters in Modal after clicking more filters'` checks for old labels. Replace the assertion at lines 118-127:

```typescript
    const gridLabels = modal.querySelectorAll('.filter-grid-label');
    const labelTexts = Array.from(gridLabels).map((el) => el.textContent?.trim());
    expect(labelTexts).toEqual(
      expect.arrayContaining([
        '统计时间',
        '主维度',
        '客户统计范围',
        '咨询师',
        '渠道',
        '项目',
        '城市&机构',
        '客户池',
        '成交类型',
      ]),
    );
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add src/App.test.tsx
git commit -m "test: update App test for new TreeSelect filter labels"
```
