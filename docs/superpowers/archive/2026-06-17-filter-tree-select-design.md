# 筛选项层级合并：TreeSelect 精简设计

> **日期:** 2026-06-17
> **状态:** designed
> **关联:** `docs/superpowers/specs/2026-06-17-sales-dashboard-filter-design.md`

## 背景

当前销售看板弹窗筛选区有 4 对层级字段（部门&咨询师、渠道分类&渠道、项目分类&项目、城市&机构），每对使用两个独立 `Select` 控件，共 8 个多选下拉。这导致筛选项冗余、层级关系不直观。

## 目标

将 4 对层级筛选合并为 4 个 antd `TreeSelect` 组件，每个 TreeSelect 以树形结构同时展示父子层级，用户可在同一控件内选择父级或子级节点。

## 不做范围

- 不改变 `SalesDashboardFilters` 类型结构
- 不改变 `filterDealRecords` 筛选逻辑
- 不改变工具栏（toolbar）布局
- 不新增维度或指标

---

## 设计方案

### 1. 组件选型

使用 antd `TreeSelect`，配置 `treeCheckable` 开启多选复选框模式。

核心配置：

| 属性 | 值 | 说明 |
|---|---|---|
| `treeData` | 从 records 构建的树形数组 | 每个 TreeSelect 独立构建 |
| `treeCheckable` | `true` | 显示勾选框 |
| `treeCheckStrictly` | `false` | 勾选父节点自动关联所有子节点 |
| `showCheckedStrategy` | `TreeSelect.SHOW_ALL` | 下拉展示所有选中值 |
| `maxTagCount` | `'responsive'` | 标签过多时自动折叠 |

### 2. 交互行为

- **点击复选框**：勾选/取消该节点及其所有子孙节点
- **点击文字或展开箭头**：展开/折叠子节点，不改变勾选状态
- **半选态**：部分子节点被勾选时，父节点显示半选状态

### 3. 弹窗布局

3 行 × 3 列网格：

| 行 | 列1 | 列2 | 列3 |
|---|---|---|---|
| 1 | 统计时间 (RangePicker) | 主维度 (Select) | 客户统计范围 (Select) |
| 2 | 咨询师 (TreeSelect) | 渠道 (TreeSelect) | 项目 (TreeSelect) |
| 3 | 城市&机构 (TreeSelect) | 客户池 (Select multiple) | 成交类型 (Select) |

### 4. 树形数据构建

在 `src/domain/filters.ts` 中新增 `buildTreeData` 函数，从 `DealRecord[]` 构建 4 组 `TreeDataNode[]`。

树节点 `value` 使用维度原始值（如 `'华东一部'`、`'张敏'`），每个 TreeSelect 内的父子值来自不同维度字段，天然不会重复。

**咨询师树**：按 `department` 分组，每个部门下挂 `consultant`
```
华东一部
  ├── 张敏
  └── 李华
华北二部
  └── 王强
```

**渠道树**：按 `channelCategory` 分组，每个分类下挂 `channel`
```
线上投放
  ├── 信息流
  └── 搜索引擎
私域运营
  └── 私域
```

**项目树**：按 `projectCategory` 分组，每个分类下挂 `project`
```
高端咨询
  └── 年度管理咨询包
```

**城市&机构树**：按 `city` 分组，每个城市下挂 `institution`
```
上海
  ├── 上海中心
  └── 浦东中心
杭州
  └── 杭州中心
```

### 5. 选中值映射

TreeSelect 的 `onChange` 返回选中节点的所有 `value` 数组（扁平），需要拆回两组筛选字段：

```
选中值 → 父级 value 集合（存在于父级 keys）→ 写入 parentField[]
选中值 → 子级 value 集合（其余）→ 写入 childField[]
```

映射表：

| TreeSelect | 父级字段 | 子级字段 |
|---|---|---|
| 咨询师 | `departments` | `consultants` |
| 渠道 | `channelCategories` | `channels` |
| 项目 | `projectCategories` | `projects` |
| 城市&机构 | `cities` | `institutions` |

由于树形数据构建时已知哪些 value 是父级、哪些是子级，可直接在 `onChange` 中按此规则拆分。

### 6. 补回客户池

当前 `customerPools` 字段存在于 `SalesDashboardFilters` 类型和 `getFilterOptions` 返回值中，但弹窗 UI 遗漏了该筛选控件。本次补回一个普通 `Select mode="multiple"`。

### 7. 类型变化

`SalesDashboardFilters` 类型**不变**。`FilterBar` 组件内部新增局部 state 用于跟踪每个 TreeSelect 的选中值数组，在 `handleModalQuery` 时做映射后写入 filter 字段。

`FilterOptionScope`（用于联动过滤选项范围）不再需要：TreeSelect 直接展示全量树形数据，不需要父子联动过滤。

`getFilterOptions` 简化：不再需要 `scope` 参数，直接返回全量树形数据和普通下拉选项（客户池）。

---

## 修改文件

| 文件 | 修改 |
|---|---|
| `src/domain/filters.ts` | 新增 `buildTreeData()` 函数；简化 `getFilterOptions()`（移除 scope 参数和联动过滤） |
| `src/components/FilterBar.tsx` | 4 对 Select → 4 个 TreeSelect；补回客户池；调整弹窗布局；移除旧的联动逻辑 |
| `src/domain/filters.test.ts` | 新增 `buildTreeData` 单元测试；更新 `getFilterOptions` 测试 |

---

## 验收标准

- [ ] 弹窗中只显示 4 个 TreeSelect + 客户池 + 成交类型（原来 8 个独立 Select 不再出现）
- [ ] 每个 TreeSelect 以树形展示父子层级
- [ ] 点击复选框勾选父节点时，所有子节点自动勾选
- [ ] 点击文字/箭头可展开折叠子节点，不影响勾选
- [ ] 选中值正确映射回 `SalesDashboardFilters` 对应字段
- [ ] 客户池多选下拉出现在弹窗第三行
- [ ] 弹窗布局为 3 行 × 3 列
- [ ] 筛选结果（`filterDealRecords`）与改造前行为一致
- [ ] 现有测试继续通过
