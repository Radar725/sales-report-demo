# Sales Dashboard Filter Optimization Design

> **Date:** 2026-06-17
> **Status:** designed
> **Related plan:** `docs/superpowers/plans/2026-06-17-sales-dashboard-filter.md`

## Overview

Four optimizations to the sales dashboard:

1. **DatePicker defaults & Chinese locale** — date range defaults to today, switch to Chinese locale, add presets (今日/昨日/本周/上周/本月/上月/近7天/近30天)
2. **Filter layout** — only 统计时间、主维度、客户统计范围 shown in toolbar; rest in Modal triggered by "更多筛选"
3. **Placeholders** — all filter controls show watermarks when empty
4. **Metric column ordering** — absolute value followed immediately by its corresponding ratio

## Part 1: DatePicker Improvements

### Chinese locale

- Install `dayjs/locale/zh-cn`
- Wrap app in Ant Design `<ConfigProvider locale={zhCN}>` in `src/main.tsx`

### Default value

- `dateRange` defaults to `[dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]` — single day, today

### Presets (快捷选择)

Use `DatePicker.RangePicker` `presets` prop with 8 shortcuts:

| Preset | Range |
|--------|-------|
| 今日 | dayjs() → dayjs() |
| 昨日 | dayjs().subtract(1, 'day') → dayjs().subtract(1, 'day') |
| 本周 | dayjs().startOf('week') → dayjs() |
| 上周 | dayjs().subtract(1, 'week').startOf('week') → dayjs().subtract(1, 'week').endOf('week') |
| 本月 | dayjs().startOf('month') → dayjs() |
| 上月 | dayjs().subtract(1, 'month').startOf('month') → dayjs().subtract(1, 'month').endOf('month') |
| 近7天 | dayjs().subtract(7, 'day') → dayjs() |
| 近30天 | dayjs().subtract(30, 'day') → dayjs() |

## Part 2: Filter Bar Layout

### Toolbar (always visible, 3 controls + actions)

| # | Control | Notes |
|---|---------|-------|
| 1 | `DatePicker.RangePicker` | Chinese locale, presets, default today |
| 2 | 主维度 `Select` | Unchanged from current |
| 3 | 客户统计范围 `Select` | 全部 / 当期新客 |
| 4 | 查询 / 重置 / **更多筛选** / 导出汇总 | Buttons |

### Modal (triggered by "更多筛选")

Contains 9 filter controls in a `Form` layout:

| Filter | Component | Placeholder |
|--------|-----------|-------------|
| 部门 | `Select` multiple | "请选择部门" |
| 咨询师 | `Select` multiple | "请选择咨询师" |
| 成交类型 | `Select` single | "请选择成交类型" |
| 渠道分类 | `Select` multiple | "请选择渠道分类" |
| 渠道 | `Select` multiple | "请选择渠道" |
| 项目分类 | `Select` multiple | "请选择项目分类" |
| 项目 | `Select` multiple | "请选择项目" |
| 城市 | `Select` multiple | "请选择城市" |
| 机构 | `Select` multiple | "请选择机构" |

- Modal footer: 确定 (apply) / 取消 (discard, revert to pre-modal state)
- Dependency cascading preserved: selecting 部门 narrows 咨询师 options, etc.
- On cancel: revert to filters state snapshot taken before modal opened

### Toolbar placeholders

The 3 visible toolbar controls also get placeholders:
- 统计时间: inherent from RangePicker
- 主维度: `placeholder="请选择主维度"`
- 客户统计范围: `placeholder="请选择客户统计范围"`

## Part 3: Metric Column Ordering

Current ordering groups all absolute values first, then all ratios within each metric group. New ordering: each absolute value immediately followed by its ratio.

### New `metricGroups` order in `src/domain/metrics.ts`

```
业绩总览:
  - 上报业绩, 确认业绩

成交概况:
  - 成交单量, 成交客户数, 客单价

新诊成交:
  - 新诊业绩 → 新诊业绩占比
  - 新诊单量 → 新诊单量占比
  - 新诊客户数 → 新诊客户占比

复购成交:
  - 复购业绩 → 复购业绩占比
  - 复购单量 → 复购单量占比
  - 复购客户数 → 复购客户占比

新客转化:
  - 新客成交率, 新客业绩贡献占比

历史复购贡献:
  - 历史复购客户当期贡献率, 历史复购业绩当期贡献率
```

- 成交概况 group has no ratios — unchanged
- 新客转化 and 历史复购贡献 are rate-only — unchanged
- Only 新诊成交 and 复购成交 groups are reordered

## Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/main.tsx` | Modify | Wrap app in `ConfigProvider` with `zhCN` locale |
| `src/App.tsx` | Modify | Change `defaultFilters.dateRange` to today |
| `src/components/FilterBar.tsx` | Modify | Layout: 3 controls visible, rest in Modal; all with placeholders; presets on DatePicker |
| `src/domain/metrics.ts` | Modify | Reorder 新诊成交/复购成交 metric groups (value → ratio pairing) |
| `src/domain/metrics.test.ts` | **Create** | Test metric group ordering |
| `src/App.test.tsx` | Modify | Update tests for new filter layout |
| `src/domain/filters.test.ts` | Modify | Update filter tests for today default dateRange |

## Test Strategy

- **Unit**: `metrics.test.ts` verifies correct column order in `metricGroups`
- **Filter tests**: update `filters.test.ts` to reflect today-based default
- **Integration**: `App.test.tsx` updated for new visible/hidden filter split and Modal behavior
