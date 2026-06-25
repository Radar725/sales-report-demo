# 报表列表设置：按报表类型共用配置

> **Date:** 2026-06-25
> **Status:** designed

## 目标

业绩报表与转化漏斗报表的主列表支持列表自定义（显隐、顺序、固定列、尺寸、高度）。两类报表各自共用一套列表设置规则，不按筛选组合或主维度拆分。列表设置弹窗内字段名使用规范名、不加动态前缀；主列表与拆解抽屉的表头仍保留 PRD 规定的动态前缀。

## 背景

当前实现已具备 `TableColumnSettings` 组件，并以 `SALES_REPORT_SUMMARY`、`SALES_REPORT_FUNNEL` 作为存储 key。但存在以下问题：

1. 业绩报表传给弹窗的 `baseColumns` 随 `customerScope`、`dealType` 变化，导致条件列（占比、复购历史占比）在部分筛选下不出现在弹窗中。
2. 弹窗字段名使用 `filterTitle`，会带上「新客」「复购」等动态前缀，与「一套配置管所有场景」的语义冲突。
3. 业绩拆解抽屉、转化漏斗拆解抽屉尚未接入列表设置。

## 范围

包含：

- 业绩报表主列表、业绩拆解抽屉的列表配置共用与套用。
- 转化漏斗主列表、维度拆解抽屉的列表配置共用与套用。
- 列表设置弹窗的完整字段目录、规范字段名、跨筛选配置保留。
- `useTableColumnSettings` 扩展以支持「弹窗目录」与「运行时列」分离。
- 相关单元测试与回归测试。

不包含：

- 导出 Excel 是否遵循列表配置（仍导出全部指标列，与本次无关）。
- 业绩明细抽屉的列配置。
- 表头动态前缀规则的变更（仍按 PRD）。
- 后端持久化；继续使用 `localStorage`。

## 已确认的产品决策

| 决策 | 结论 |
| --- | --- |
| 配置粒度 | 业绩报表所有筛选组合共用 `SALES_REPORT_SUMMARY`；转化漏斗所有场景共用 `SALES_REPORT_FUNNEL` |
| 条件列 | 当前筛选不可见的列（如新诊下的复购历史占比）仍可在弹窗配置；配置在列变为可见时生效 |
| 弹窗字段名 | 不加「新客 / 老客 / 新诊 / 复购」前缀 |
| 表头字段名 | 保留 PRD 动态前缀（如「新客新诊上报业绩」） |
| 拆解抽屉 | 与对应主表共用同一套配置；入口仅在主表操作列 |

## 方案选择

采用**静态字段目录 + 运行时按 key 套用**：

- 领域层维护完整指标目录（含条件列），弹窗始终基于目录初始化。
- 列表渲染时先按筛选算出当前可见列，再按 metric key 套用已保存配置。
- 优于「弹窗打开时动态合并」方案：语义清晰、状态稳定；优于「按筛选拆分多套配置」：符合产品要求。

## 存储结构

沿用现有 `TableColumnSetting`：

```ts
{
  columns: Record<metricKey, { hidden?: boolean; fixed?: 'left' | 'right'; index?: number }>,
  tableSize?: 'large' | 'middle' | 'small',
  fixedY?: boolean
}
```

- 存储 key：`SALES_REPORT_SUMMARY`（业绩）、`SALES_REPORT_FUNNEL`（漏斗）。
- 不按 `customerScope`、`dealType`、主维度等维度拆分。
- 旧数据按 key 兼容；未知 key 忽略；新增 key 使用默认（显示、原顺序）。

## 业绩报表字段目录

弹窗始终展示以下全部字段（`settingTitle` 为规范名，无前缀）：

| 分组 | settingTitle | metric key | 列表运行时显示条件 |
| --- | --- | --- | --- |
| 基础 | 上报业绩、确认业绩、业绩确认率、成交单量、成交客户数、客单价 | `reportedAmount` 等 | 始终 |
| 占比 | 业绩占比、成交单量占比、成交客户占比 | `reportedAmountRate` 等 | 客户范围 ≠ 全部 **或** 成交类型 ≠ 全部 |
| 贡献 | 业绩贡献、成交单量贡献、成交客户贡献 | `reportedAmountContributionRate` 等 | 始终 |
| 复购历史 | 复购客户历史占比、复购单量历史占比、复购业绩历史占比 | `repurchaseCustomerTotalRate` 等 | 成交类型 = 复购 |

目录在 `reportMetrics` 中统一定义，新增 `settingTitle`（或与 `label` 复用）专供弹窗；表头继续通过 `getMetricLabel()` 生成带前缀文案。

主维度列、操作列标记 `disabledSetting: true`，不出现在弹窗可选字段中。

## 转化漏斗字段目录

漏斗指标固定、无条件列。弹窗展示全部 15 个指标字段（录单客户数、有效客户数、各阶段客户数、各转化率等），与 `funnelMetrics` 定义一致。主维度列、操作列（若有）不参与配置。

## 套用规则

```
弹窗初始化  →  完整目录列（key + settingTitle）
列表渲染    →  build*MetricColumns(筛选) 得到当前可见列  →  applyColumnSettings(可见列, 已保存配置)
```

具体行为：

1. **条件列当前不可见**：用户在弹窗对该 key 的配置仍写入 `localStorage`；列变为可见后自动套用。
2. **用户在弹窗隐藏某列**：该 key 在当前可见时不再渲染；当前不可见时配置保留。
3. **弹窗搜索**：匹配 `settingTitle`（规范名），不匹配带前缀的表头文案。
4. **重置**：恢复默认显隐与顺序（目录默认全显、指标定义顺序）。

## 组件改造

### `useTableColumnSettings`

新增可选参数 `settingCatalog: SettingColumn[]`：

- `initData.columns` 使用 `settingCatalog`（弹窗展示与编辑）。
- `applyColumnSettings` 仍作用于运行时 `baseColumns`（实际渲染列）。
- 未传 `settingCatalog` 时行为与现有一致（`initData.columns = baseColumns`）。

### 业绩报表

**SummaryTable**

- `tableKey = 'SALES_REPORT_SUMMARY'`
- `settingCatalog = getPerformanceReportSettingCatalog()`
- `baseColumns = [主维度列, ...buildReportMetricColumns(filters, hasComparison), 操作列]`
- 操作列表头齿轮打开弹窗。

**BreakdownDrawer**

- 读取同一份 `SALES_REPORT_SUMMARY` 配置（通过 `useTableColumnSettings` 或抽取的 `applyPerformanceColumnSettings` 辅助函数）。
- 不提供列表设置入口。
- `baseColumns` 结构与主表一致（拆解维度列 + 指标列 + 操作列），指标列套用相同 setting。

### 转化漏斗

**FunnelTable**

- `tableKey = 'SALES_REPORT_FUNNEL'`
- `settingCatalog = getFunnelMetricSettingCatalog()`
- `baseColumns = [主维度列, ...buildFunnelMetricColumns(hasComparison), 操作列]`

**FunnelBreakdownDrawer**

- 读取同一份 `SALES_REPORT_FUNNEL` 配置，无弹窗入口。

## 边界行为

| 场景 | 预期 |
| --- | --- |
| 成交类型 = 新诊时打开弹窗 | 仍显示复购历史占比三列，可配置 |
| 保存后切换到复购 | 三列按已保存配置展示 |
| 全部 + 全部筛选 | 占比三列不出现在列表，弹窗可配置，切到新客/新诊后生效 |
| 主表修改配置后打开拆解 | 拆解表列布局与主表一致 |
| 列表尺寸 / 固定高度 | 主表保存后，拆解抽屉同步（共用 setting 全局项） |

## 测试要点

- 弹窗字段名为规范名、无前缀；表头在「新客 + 新诊」下仍显示「新客新诊上报业绩」。
- 在「全部 + 全部」下配置隐藏「业绩贡献」，切换到「新客 + 新诊」后该列仍隐藏。
- 在「新诊」下配置复购历史占比顺序，切换到「复购」后顺序生效。
- 业绩拆解抽屉列布局与主表一致；漏斗拆解同理。
- 重置恢复默认；旧 `localStorage` 数据不导致报错。

## 与既有文档的关系

- 取代 `2026-06-24-report-export-confirmation-and-table-customization-design.md` 中「列表自定义入口仅为占位提示、不提供真实配置」的约束；本次交付真实列表配置能力。
- 表头动态前缀规则仍以 PRD 及 `2026-06-23-report-contribution-metrics-design.md` 为准，本次不修改。
