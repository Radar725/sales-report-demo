# Filter Bar Inline Expand/Collapse Redesign

> **Date:** 2026-06-17
> **Status:** designed

## Overview

Replace the Modal-based "全部筛选" (all filters) popup with an inline expand/collapse pattern. All filter controls live in a single inline form. By default, the most commonly used filters are visible in one row; a "展开" (expand) link reveals the remaining filters. This eliminates the two-layer modal interaction and keeps the user's flow continuous.

## Current State

- **Toolbar**: 3 controls (date range, primary dimension, customer scope) + buttons (查询/重置/全部筛选/导出汇总)
- **Modal**: Remaining 5 controls (consultant, channel, project, city&institution, customer pool) in a 3-column grid
- Button "全部筛选" opens the Modal

## Target State

- **All 8 filter controls** are in a single `<Form layout="inline">`
- **Default (collapsed)**: First 6 controls visible inline + button group with "展开"
- **Expanded**: All 8 controls visible + button group on its own row, left-aligned, with "收起"
- No Modal component at all

## Filter Groups

### Always visible (6 items)
| # | Label | Component | Notes |
|---|-------|-----------|-------|
| 1 | 统计时间 | `DatePicker.RangePicker` | Unchanged |
| 2 | 主维度 | `Select` | Unchanged |
| 3 | 客户统计范围 | `Select` | Unchanged |
| 4 | 咨询师 | `TreeSelect` | Moved from Modal to inline |
| 5 | 渠道 | `TreeSelect` | Moved from Modal to inline |
| 6 | 项目 | `TreeSelect` | Moved from Modal to inline |

### Collapsed (visible only when expanded, 2 items)
| # | Label | Component | Notes |
|---|-------|-----------|-------|
| 7 | 城市&机构 | `TreeSelect` | Moved from Modal to inline |
| 8 | 客户池 | `Select` multiple | Moved from Modal to inline |

### Removed
- **成交类型** (dealType): Removed entirely per user request. Not displayed anywhere.

## Component Structure

```
<Form layout="inline">
  <!-- Always visible: 6 filter items -->
  <Form.Item label="统计时间"><DatePicker.RangePicker /></Form.Item>
  <Form.Item label="主维度"><Select /></Form.Item>
  <Form.Item label="客户统计范围"><Select /></Form.Item>
  <Form.Item label="咨询师"><TreeSelect /></Form.Item>
  <Form.Item label="渠道"><TreeSelect /></Form.Item>
  <Form.Item label="项目"><TreeSelect /></Form.Item>

  <!-- Collapsed: 2 filter items -->
  {expanded && (
    <>
      <Form.Item label="城市&机构"><TreeSelect /></Form.Item>
      <Form.Item label="客户池"><Select mode="multiple" /></Form.Item>
    </>
  )}

  <!-- Button group: collapsed = inline, expanded = own row left-aligned -->
  {expanded ? (
    <div style={{ width: '100%', marginTop: 8 }}>
      <Space>
        <Button type="primary">查询</Button>
        <Button>重置</Button>
        <Button>导出汇总</Button>
      </Space>
      <span>收起 ▴</span>
    </div>
  ) : (
    <Form.Item>
      <Space>
        <Button type="primary">查询</Button>
        <Button>重置</Button>
        <Button>导出汇总</Button>
      </Space>
      <span>展开 ▾</span>
    </Form.Item>
  )}
</Form>
```

## State Management

### New state
- `expanded: boolean` — defaults to `false`, toggled by clicking 展开/收起

### Removed state
- `modalOpen`, `modalFilters`, `modalPrimaryDimension`
- All modal-related handlers: `openModal`, `handleModalQuery`, `handleModalReset`

### Simplified local state (replaces dual-state pattern)
- `localFilters: SalesDashboardFilters` — single local state for all 8 controls, initialized from `filters` prop and synced via `useEffect`
- `localPrimaryDimension: DimensionKey` — local primary dimension state
- **"查询"** commits: `onFiltersChange(localFilters)` + `onPrimaryDimensionChange(localPrimaryDimension)`, resetting non-toolbar filters to defaults
- **"重置"** resets both local states to defaults and commits to parent
- No separate "toolbar" vs "modal" state — one unified local state copy

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/components/FilterBar.tsx` | **Modify** | Remove Modal, add expand/collapse, restructure form layout |
| `src/styles.css` | **Modify** | Remove `.filter-grid`, `.filter-grid-item`, `.filter-grid-label` |

### Files NOT changed
- `src/domain/filters.ts` — dealType filter still exists in type/function signatures but is always set to `'all'` by default; no behavioral change needed
- `src/App.tsx` — default filters unchanged (dealType already defaults to `'all'`)
- `src/App.test.tsx` — no Modal to test, but filter controls are same components

## Edge Cases

1. **Expand while filters are dirty**: Expand/collapse is purely visual — no state is lost. The expand toggle does not commit or reset anything.
2. **Reset behavior**: "重置" resets both `localFilters` and `localPrimaryDimension` to defaults AND commits to parent (matches current behavior).
3. **Toggle animation**: No animation. Simple conditional rendering with `{expanded && ...}`.
4. **Exported summary button**: Retained as-is. Not part of this change.

## Removed CSS

```css
.filter-grid { ... }
.filter-grid-item { ... }
.filter-grid-label { ... }
```

These classes were only used in the Modal's grid layout and are no longer needed.

## Test Strategy

- Manual verification: collapse/expand toggle, all 8 controls functional, query/reset works
- No new unit tests needed — filter logic unchanged
