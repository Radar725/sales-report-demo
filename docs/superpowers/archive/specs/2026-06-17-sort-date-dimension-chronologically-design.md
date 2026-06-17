# 日期维度按时间正序排列

## 背景

当前 `aggregate()` 函数对所有维度统一按 `reportedAmount` 降序排列。日期维度下数据乱序，不符合用户对时间序列数据的阅读习惯。

## 设计

### 排序规则

| 维度 | 排序方式 | 说明 |
|------|---------|------|
| `date` | 日期值正序（从早到晚） | `YYYY-MM-DD` 格式天然支持字符串 `localeCompare` |
| 其他 8 个维度 | `reportedAmount` 降序 | 保持现有行为不变 |

### 实现方案：方案 1 — `aggregate()` 内条件分支

** `src/domain/analytics.ts`**

1. `aggregate()` 新增 `dimension: DimensionKey` 参数
2. 将末尾的 `.sort((left, right) => right.reportedAmount - left.reportedAmount)` 替换为条件排序：
   - `dimension === 'date'` → `left.value.localeCompare(right.value)` （正序）
   - 其他 → `right.reportedAmount - left.reportedAmount`（降序，不变）
3. `buildSummaryRows()` 调用 `aggregate()` 时传入 `primaryDimension`
4. `buildBreakdownRows()` 调用 `aggregate()` 时传入 `query.breakdownDimension`

**`src/domain/analytics.test.ts`**

- 日期 summary 测试：验证结果按日期从早到晚排列
- 日期 breakdown 测试：验证拆解结果同样按日期正序
- 非日期维度测试保持不动（已有验证按金额降序的逻辑）

### 不影响

- UI 层（`SummaryTable`、`BreakdownDrawer`）无变更
- 维度元数据（`dimensions.ts`）无变更
- 其他维度的既有排序行为完全不变
