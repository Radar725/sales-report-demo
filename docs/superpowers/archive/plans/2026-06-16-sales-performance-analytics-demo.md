# Sales Performance Analytics Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Ant Design 5.0 demo for the CRM sales performance analytics redesign: primary-dimension summary table plus drawer-based multi-dimension breakdown.

**Architecture:** Create a small React + TypeScript + Vite app with Ant Design 5.0. Keep business rules in pure TypeScript modules, feed deterministic fixture data into UI components, and make the UI a faithful demo of the approved product design rather than a production CRM integration.

**Tech Stack:** React, TypeScript, Vite, Ant Design 5.0, Vitest, Testing Library, dayjs.

---

## File Structure

- Create: `package.json`  
  Defines scripts and dependencies for the local demo.
- Create: `index.html`  
  Vite HTML entry.
- Create: `tsconfig.json`  
  TypeScript config for app and tests.
- Create: `tsconfig.node.json`  
  TypeScript config for Vite config.
- Create: `vite.config.ts`  
  Vite + React + Vitest setup.
- Create: `src/main.tsx`  
  React entry.
- Create: `src/App.tsx`  
  Page shell and state orchestration.
- Create: `src/styles.css`  
  Minimal layout polish around AntD components.
- Create: `src/domain/dimensions.ts`  
  Dimension definitions and legal breakdown rules.
- Create: `src/domain/metrics.ts`  
  Metric labels and amount formatting.
- Create: `src/domain/analytics.ts`  
  Pure aggregation functions for summary and breakdown tables.
- Create: `src/data/mockDeals.ts`  
  Deterministic CRM-like fixture data.
- Create: `src/components/FilterBar.tsx`  
  AntD filter controls and primary dimension selector.
- Create: `src/components/SummaryTable.tsx`  
  AntD main summary table.
- Create: `src/components/BreakdownDrawer.tsx`  
  AntD drawer with tabs and breakdown tables.
- Create: `src/domain/dimensions.test.ts`  
  Tests for legal dimension rules.
- Create: `src/domain/analytics.test.ts`  
  Tests for aggregation behavior.
- Create: `src/test/setup.ts`  
  Testing Library setup.

## Task 1: Scaffold The React AntD Demo

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Create package manifest**

Create `package.json`:

```json
{
  "name": "sales-performance-analytics-demo",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^5.6.1",
    "antd": "^5.0.0",
    "dayjs": "^1.11.13",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.1",
    "@types/react": "^18.2.79",
    "@types/react-dom": "^18.2.25",
    "@vitejs/plugin-react": "^4.6.0",
    "jsdom": "^26.1.0",
    "typescript": "~5.8.3",
    "vite": "^7.0.0",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: dependencies install and `package-lock.json` is created.

- [ ] **Step 3: Create Vite entry files**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CRM 业绩统计 Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/App.tsx`:

```tsx
export default function App() {
  return (
    <main className="app-shell">
      <h1>CRM 业绩统计 Demo</h1>
    </main>
  );
}
```

Create `src/styles.css`:

```css
body {
  margin: 0;
  background: #f5f7fb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}
```

- [ ] **Step 4: Create TypeScript and test config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
```

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 5: Verify scaffold**

Run: `npm test`

Expected: PASS with no tests found or an empty-suite success depending on Vitest output.

Run: `npm run build`

Expected: PASS and `dist/` is generated.

- [ ] **Step 6: Commit scaffold if Git is available**

Run: `git status --short`

Expected if this folder is a Git repo: new scaffold files appear.

If Git is available, run:

```bash
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts src/main.tsx src/App.tsx src/styles.css src/test/setup.ts
git commit -m "chore: scaffold sales analytics demo"
```

If Git is not available, record that the workspace is not a Git repo and continue.

## Task 2: Implement Dimension Rules With Tests

**Files:**
- Create: `src/domain/dimensions.ts`
- Create: `src/domain/dimensions.test.ts`

- [ ] **Step 1: Write failing tests for dimension rules**

Create `src/domain/dimensions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { dimensions, getBreakdownDimensions } from './dimensions';

describe('dimension rules', () => {
  it('lists all supported primary dimensions', () => {
    expect(dimensions.map((dimension) => dimension.label)).toEqual([
      '咨询师',
      '部门',
      '渠道',
      '渠道分类',
      '机构',
      '城市',
    ]);
  });

  it('allows consultant to break down by source and location dimensions', () => {
    expect(getBreakdownDimensions('consultant').map((dimension) => dimension.label)).toEqual([
      '渠道',
      '渠道分类',
      '机构',
      '城市',
    ]);
  });

  it('does not allow dimensions from the same group', () => {
    expect(getBreakdownDimensions('consultant').map((dimension) => dimension.key)).not.toContain('department');
    expect(getBreakdownDimensions('channel').map((dimension) => dimension.key)).not.toContain('channelCategory');
    expect(getBreakdownDimensions('institution').map((dimension) => dimension.key)).not.toContain('city');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/dimensions.test.ts`

Expected: FAIL because `src/domain/dimensions.ts` does not exist.

- [ ] **Step 3: Implement dimension definitions**

Create `src/domain/dimensions.ts`:

```ts
export type DimensionGroup = 'org' | 'source' | 'location';

export type DimensionKey =
  | 'consultant'
  | 'department'
  | 'channel'
  | 'channelCategory'
  | 'institution'
  | 'city';

export type Dimension = {
  key: DimensionKey;
  label: string;
  group: DimensionGroup;
};

export const dimensions: Dimension[] = [
  { key: 'consultant', label: '咨询师', group: 'org' },
  { key: 'department', label: '部门', group: 'org' },
  { key: 'channel', label: '渠道', group: 'source' },
  { key: 'channelCategory', label: '渠道分类', group: 'source' },
  { key: 'institution', label: '机构', group: 'location' },
  { key: 'city', label: '城市', group: 'location' },
];

export function getDimension(key: DimensionKey) {
  return dimensions.find((dimension) => dimension.key === key)!;
}

export function getBreakdownDimensions(primaryKey: DimensionKey) {
  const primaryDimension = getDimension(primaryKey);
  return dimensions.filter((dimension) => dimension.group !== primaryDimension.group);
}
```

- [ ] **Step 4: Run dimension tests**

Run: `npm test -- src/domain/dimensions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit dimension rules if Git is available**

```bash
git add src/domain/dimensions.ts src/domain/dimensions.test.ts
git commit -m "feat: add sales dimension rules"
```

If Git is not available, continue without committing.

## Task 3: Implement Metrics, Fixtures, And Aggregation

**Files:**
- Create: `src/domain/metrics.ts`
- Create: `src/data/mockDeals.ts`
- Create: `src/domain/analytics.ts`
- Create: `src/domain/analytics.test.ts`

- [ ] **Step 1: Write failing aggregation tests**

Create `src/domain/analytics.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildBreakdownRows, buildSummaryRows } from './analytics';
import { mockDeals } from '../data/mockDeals';

describe('sales analytics aggregation', () => {
  it('builds summary rows by primary dimension', () => {
    const rows = buildSummaryRows(mockDeals, 'consultant');

    expect(rows[0]).toMatchObject({
      primaryDimensionValue: '张敏',
      customerCount: 4,
      totalAmount: 1439000,
    });
    expect(rows[1]).toMatchObject({
      primaryDimensionValue: '李然',
      customerCount: 4,
      totalAmount: 1332000,
    });
  });

  it('builds breakdown rows for one selected primary object', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows).toEqual([
      {
        key: 'channel:信息流',
        breakdownDimensionValue: '信息流',
        customerCount: 2,
        totalAmount: 824000,
      },
      {
        key: 'channel:私域',
        breakdownDimensionValue: '私域',
        customerCount: 1,
        totalAmount: 318000,
      },
      {
        key: 'channel:转介绍',
        breakdownDimensionValue: '转介绍',
        customerCount: 1,
        totalAmount: 186000,
      },
      {
        key: 'channel:自然流量',
        breakdownDimensionValue: '自然流量',
        customerCount: 1,
        totalAmount: 111000,
      },
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/domain/analytics.test.ts`

Expected: FAIL because analytics and fixture modules do not exist.

- [ ] **Step 3: Create metric helpers**

Create `src/domain/metrics.ts`:

```ts
export type MetricKey = 'customerCount' | 'totalAmount';

export const metrics: { key: MetricKey; label: string }[] = [
  { key: 'customerCount', label: '成交客户数' },
  { key: 'totalAmount', label: '成交总金额' },
];

export function formatAmount(value: number) {
  return `${(value / 10000).toFixed(1)}万`;
}
```

- [ ] **Step 4: Create fixture data**

Create `src/data/mockDeals.ts`:

```ts
import type { DimensionKey } from '../domain/dimensions';

export type DealRecord = Record<DimensionKey, string> & {
  id: string;
  customerId: string;
  amount: number;
  dealDate: string;
  dealStatus: '已成交';
};

export const mockDeals: DealRecord[] = [
  {
    id: 'D001',
    customerId: 'C001',
    consultant: '张敏',
    department: '华东一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '上海中心',
    city: '上海',
    amount: 412000,
    dealDate: '2026-06-02',
    dealStatus: '已成交',
  },
  {
    id: 'D002',
    customerId: 'C002',
    consultant: '张敏',
    department: '华东一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '杭州中心',
    city: '杭州',
    amount: 412000,
    dealDate: '2026-06-06',
    dealStatus: '已成交',
  },
  {
    id: 'D003',
    customerId: 'C003',
    consultant: '张敏',
    department: '华东一部',
    channel: '私域',
    channelCategory: '私域运营',
    institution: '上海中心',
    city: '上海',
    amount: 318000,
    dealDate: '2026-06-11',
    dealStatus: '已成交',
  },
  {
    id: 'D004',
    customerId: 'C004',
    consultant: '张敏',
    department: '华东一部',
    channel: '转介绍',
    channelCategory: '口碑推荐',
    institution: '南京中心',
    city: '南京',
    amount: 186000,
    dealDate: '2026-06-17',
    dealStatus: '已成交',
  },
  {
    id: 'D005',
    customerId: 'C004',
    consultant: '张敏',
    department: '华东一部',
    channel: '自然流量',
    channelCategory: '自然增长',
    institution: '上海中心',
    city: '上海',
    amount: 111000,
    dealDate: '2026-06-20',
    dealStatus: '已成交',
  },
  {
    id: 'D006',
    customerId: 'C005',
    consultant: '李然',
    department: '华南一部',
    channel: '信息流',
    channelCategory: '线上投放',
    institution: '广州中心',
    city: '广州',
    amount: 645000,
    dealDate: '2026-06-05',
    dealStatus: '已成交',
  },
  {
    id: 'D007',
    customerId: 'C006',
    consultant: '李然',
    department: '华南一部',
    channel: '私域',
    channelCategory: '私域运营',
    institution: '深圳中心',
    city: '深圳',
    amount: 441000,
    dealDate: '2026-06-09',
    dealStatus: '已成交',
  },
  {
    id: 'D008',
    customerId: 'C007',
    consultant: '李然',
    department: '华南一部',
    channel: '转介绍',
    channelCategory: '口碑推荐',
    institution: '广州中心',
    city: '广州',
    amount: 97000,
    dealDate: '2026-06-13',
    dealStatus: '已成交',
  },
  {
    id: 'D009',
    customerId: 'C008',
    consultant: '李然',
    department: '华南一部',
    channel: '自然流量',
    channelCategory: '自然增长',
    institution: '深圳中心',
    city: '深圳',
    amount: 149000,
    dealDate: '2026-06-22',
    dealStatus: '已成交',
  },
];
```

- [ ] **Step 5: Implement aggregation functions**

Create `src/domain/analytics.ts`:

```ts
import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from './dimensions';

export type SummaryRow = {
  key: string;
  primaryDimensionValue: string;
  customerCount: number;
  totalAmount: number;
};

export type BreakdownRow = {
  key: string;
  breakdownDimensionValue: string;
  customerCount: number;
  totalAmount: number;
};

type BreakdownQuery = {
  primaryDimension: DimensionKey;
  primaryDimensionValue: string;
  breakdownDimension: DimensionKey;
};

function aggregate(records: DealRecord[], dimension: DimensionKey) {
  const groups = new Map<string, { customerIds: Set<string>; totalAmount: number }>();

  for (const record of records) {
    const value = record[dimension];
    const current = groups.get(value) ?? { customerIds: new Set<string>(), totalAmount: 0 };
    current.customerIds.add(record.customerId);
    current.totalAmount += record.amount;
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, summary]) => ({
      value,
      customerCount: summary.customerIds.size,
      totalAmount: summary.totalAmount,
    }))
    .sort((left, right) => right.totalAmount - left.totalAmount);
}

export function buildSummaryRows(records: DealRecord[], primaryDimension: DimensionKey): SummaryRow[] {
  return aggregate(records, primaryDimension).map((row) => ({
    key: `${primaryDimension}:${row.value}`,
    primaryDimensionValue: row.value,
    customerCount: row.customerCount,
    totalAmount: row.totalAmount,
  }));
}

export function buildBreakdownRows(records: DealRecord[], query: BreakdownQuery): BreakdownRow[] {
  const scopedRecords = records.filter(
    (record) => record[query.primaryDimension] === query.primaryDimensionValue,
  );

  return aggregate(scopedRecords, query.breakdownDimension).map((row) => ({
    key: `${query.breakdownDimension}:${row.value}`,
    breakdownDimensionValue: row.value,
    customerCount: row.customerCount,
    totalAmount: row.totalAmount,
  }));
}
```

- [ ] **Step 6: Run aggregation tests**

Run: `npm test -- src/domain/analytics.test.ts`

Expected: PASS.

- [ ] **Step 7: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 8: Commit analytics domain if Git is available**

```bash
git add src/domain/metrics.ts src/data/mockDeals.ts src/domain/analytics.ts src/domain/analytics.test.ts
git commit -m "feat: add sales analytics aggregation"
```

If Git is not available, continue without committing.

## Task 4: Build The Filter Bar And Summary Table

**Files:**
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/SummaryTable.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Create filter bar component**

Create `src/components/FilterBar.tsx`:

```tsx
import { Button, DatePicker, Form, Select, Space } from 'antd';
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';

type FilterBarProps = {
  primaryDimension: DimensionKey;
  onPrimaryDimensionChange: (dimension: DimensionKey) => void;
};

export default function FilterBar({ primaryDimension, onPrimaryDimensionChange }: FilterBarProps) {
  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
        <DatePicker.RangePicker />
      </Form.Item>
      <Form.Item label="业绩状态">
        <Select
          value="已成交"
          style={{ width: 120 }}
          options={[{ value: '已成交', label: '已成交' }]}
        />
      </Form.Item>
      <Form.Item label="主维度">
        <Select
          value={primaryDimension}
          style={{ width: 140 }}
          options={dimensions.map((dimension) => ({
            value: dimension.key,
            label: dimension.label,
          }))}
          onChange={onPrimaryDimensionChange}
        />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button type="primary">查询</Button>
          <Button>重置</Button>
          <Button>导出汇总</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
```

- [ ] **Step 2: Create summary table component**

Create `src/components/SummaryTable.tsx`:

```tsx
import { Button, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Dimension } from '../domain/dimensions';
import type { SummaryRow } from '../domain/analytics';
import { formatAmount } from '../domain/metrics';

type SummaryTableProps = {
  primaryDimension: Dimension;
  rows: SummaryRow[];
  onOpenBreakdown: (row: SummaryRow) => void;
};

export default function SummaryTable({ primaryDimension, rows, onOpenBreakdown }: SummaryTableProps) {
  const columns: ColumnsType<SummaryRow> = [
    {
      title: primaryDimension.label,
      dataIndex: 'primaryDimensionValue',
      key: 'primaryDimensionValue',
    },
    {
      title: '成交客户数',
      dataIndex: 'customerCount',
      key: 'customerCount',
      align: 'right',
      sorter: (left, right) => left.customerCount - right.customerCount,
    },
    {
      title: '成交总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      sorter: (left, right) => left.totalAmount - right.totalAmount,
      render: (value: number) => formatAmount(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, row) => (
        <Button type="link" onClick={() => onOpenBreakdown(row)}>
          查看拆解
        </Button>
      ),
    },
  ];

  return <Table rowKey="key" columns={columns} dataSource={rows} pagination={false} />;
}
```

- [ ] **Step 3: Wire filter bar and summary table into App**

Replace `src/App.tsx`:

```tsx
import { Card, Typography } from 'antd';
import { useMemo, useState } from 'react';
import FilterBar from './components/FilterBar';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { buildSummaryRows, type SummaryRow } from './domain/analytics';
import { getDimension, type DimensionKey } from './domain/dimensions';

export default function App() {
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [selectedRow, setSelectedRow] = useState<SummaryRow | null>(null);

  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () => buildSummaryRows(mockDeals, primaryDimension),
    [primaryDimension],
  );

  return (
    <main className="app-shell">
      <Typography.Title level={2}>CRM 业绩统计 Demo</Typography.Title>
      <Typography.Paragraph type="secondary">
        主维度汇总列表 + 抽屉多维拆解，基于 Ant Design 5.0 常规组件。
      </Typography.Paragraph>

      <Card className="toolbar-card">
        <FilterBar
          primaryDimension={primaryDimension}
          onPrimaryDimensionChange={(dimension) => {
            setPrimaryDimension(dimension);
            setSelectedRow(null);
          }}
        />
      </Card>

      <Card title={`${primaryDimensionConfig.label}业绩汇总`}>
        <SummaryTable
          primaryDimension={primaryDimensionConfig}
          rows={summaryRows}
          onOpenBreakdown={setSelectedRow}
        />
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Update layout styles**

Replace `src/styles.css`:

```css
body {
  margin: 0;
  background: #f5f7fb;
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.toolbar-card {
  margin-bottom: 16px;
}

.filter-bar {
  row-gap: 12px;
}
```

- [ ] **Step 5: Verify summary UI compiles**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit summary UI if Git is available**

```bash
git add src/components/FilterBar.tsx src/components/SummaryTable.tsx src/App.tsx src/styles.css
git commit -m "feat: add sales summary table"
```

If Git is not available, continue without committing.

## Task 5: Build Drawer Tabs Breakdown Interaction

**Files:**
- Create: `src/components/BreakdownDrawer.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create breakdown drawer component**

Create `src/components/BreakdownDrawer.tsx`:

```tsx
import { Button, Drawer, Space, Table, Tabs } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { mockDeals } from '../data/mockDeals';
import { buildBreakdownRows, type BreakdownRow, type SummaryRow } from '../domain/analytics';
import { type DimensionKey, getBreakdownDimensions, getDimension } from '../domain/dimensions';
import { formatAmount } from '../domain/metrics';

type BreakdownDrawerProps = {
  open: boolean;
  primaryDimension: DimensionKey;
  row: SummaryRow | null;
  onClose: () => void;
};

const columns: ColumnsType<BreakdownRow> = [
  {
    title: '拆解维度',
    dataIndex: 'breakdownDimensionValue',
    key: 'breakdownDimensionValue',
  },
  {
    title: '成交客户数',
    dataIndex: 'customerCount',
    key: 'customerCount',
    align: 'right',
    sorter: (left, right) => left.customerCount - right.customerCount,
  },
  {
    title: '成交总金额',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    align: 'right',
    sorter: (left, right) => left.totalAmount - right.totalAmount,
    render: (value: number) => formatAmount(value),
  },
];

export default function BreakdownDrawer({ open, primaryDimension, row, onClose }: BreakdownDrawerProps) {
  const primaryDimensionConfig = getDimension(primaryDimension);
  const breakdownDimensions = getBreakdownDimensions(primaryDimension);

  return (
    <Drawer
      title={row ? `${row.primaryDimensionValue} · 业绩拆解` : '业绩拆解'}
      width={720}
      open={open}
      onClose={onClose}
      extra={<Button>导出当前拆解</Button>}
    >
      {row ? (
        <Tabs
          items={breakdownDimensions.map((breakdownDimension) => {
            const dataSource = buildBreakdownRows(mockDeals, {
              primaryDimension,
              primaryDimensionValue: row.primaryDimensionValue,
              breakdownDimension: breakdownDimension.key,
            });

            return {
              key: breakdownDimension.key,
              label: breakdownDimension.label,
              children: (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <div>
                    {primaryDimensionConfig.label}「{row.primaryDimensionValue}」按
                    {breakdownDimension.label}拆解
                  </div>
                  <Table
                    rowKey="key"
                    columns={[
                      {
                        ...columns[0],
                        title: breakdownDimension.label,
                      },
                      columns[1],
                      columns[2],
                    ]}
                    dataSource={dataSource}
                    pagination={false}
                  />
                </Space>
              ),
            };
          })}
        />
      ) : null}
    </Drawer>
  );
}
```

- [ ] **Step 2: Wire drawer into App**

Replace `src/App.tsx`:

```tsx
import { Card, Typography } from 'antd';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { buildSummaryRows, type SummaryRow } from './domain/analytics';
import { getDimension, type DimensionKey } from './domain/dimensions';

export default function App() {
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [selectedRow, setSelectedRow] = useState<SummaryRow | null>(null);

  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () => buildSummaryRows(mockDeals, primaryDimension),
    [primaryDimension],
  );

  return (
    <main className="app-shell">
      <Typography.Title level={2}>CRM 业绩统计 Demo</Typography.Title>
      <Typography.Paragraph type="secondary">
        主维度汇总列表 + 抽屉多维拆解，基于 Ant Design 5.0 常规组件。
      </Typography.Paragraph>

      <Card className="toolbar-card">
        <FilterBar
          primaryDimension={primaryDimension}
          onPrimaryDimensionChange={(dimension) => {
            setPrimaryDimension(dimension);
            setSelectedRow(null);
          }}
        />
      </Card>

      <Card title={`${primaryDimensionConfig.label}业绩汇总`}>
        <SummaryTable
          primaryDimension={primaryDimensionConfig}
          rows={summaryRows}
          onOpenBreakdown={setSelectedRow}
        />
      </Card>

      <BreakdownDrawer
        open={selectedRow !== null}
        primaryDimension={primaryDimension}
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </main>
  );
}
```

- [ ] **Step 3: Verify drawer UI compiles**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 5: Commit drawer interaction if Git is available**

```bash
git add src/components/BreakdownDrawer.tsx src/App.tsx
git commit -m "feat: add breakdown drawer interaction"
```

If Git is not available, continue without committing.

## Task 6: Add Interaction Tests

**Files:**
- Create: `src/App.test.tsx`

- [ ] **Step 1: Write UI interaction tests**

Create `src/App.test.tsx`:

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('sales analytics demo', () => {
  it('opens breakdown drawer with legal tabs for consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    expect(screen.getByText('张敏 · 业绩拆解')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '渠道' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '渠道分类' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '机构' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '城市' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('changes primary dimension and updates table heading', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('combobox', { name: '主维度' }));
    await user.click(screen.getByTitle('渠道'));

    expect(screen.getByText('渠道业绩汇总')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '渠道' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI tests to verify current behavior**

Run: `npm test -- src/App.test.tsx`

Expected: PASS. If the AntD select query is unstable in jsdom, replace the second test with a lower-risk render assertion for the default summary page and rely on manual browser verification for select behavior.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Commit UI tests if Git is available**

```bash
git add src/App.test.tsx
git commit -m "test: cover sales analytics interactions"
```

If Git is not available, continue without committing.

## Task 7: Browser Smoke Test And Final Polish

**Files:**
- Modify: `src/styles.css` only if visual spacing needs adjustment after browser review.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`

Expected: Vite starts and prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 2: Open the local URL in the in-app browser**

Use the Browser plugin to open the printed local URL.

Expected: the page renders with:

- title `CRM 业绩统计 Demo`
- filter bar
- primary dimension selector
- summary table
- `查看拆解` buttons

- [ ] **Step 3: Smoke-test the main workflow**

In the browser:

- Change 主维度 from 咨询师 to 渠道.
- Confirm the table title changes to 渠道业绩汇总.
- Click a row's 查看拆解.
- Confirm the drawer opens.
- Confirm illegal same-group tabs are absent.
- Switch at least one drawer tab.
- Close the drawer.

Expected: no blank screen, no visible overlap, and no console-level runtime crash.

- [ ] **Step 4: Apply minimal visual polish if needed**

If the browser smoke test reveals spacing problems, update only `src/styles.css`:

```css
.app-shell {
  min-height: 100vh;
  padding: 24px;
}

.toolbar-card {
  margin-bottom: 16px;
}

.filter-bar {
  row-gap: 12px;
}
```

Do not introduce custom table widgets or custom drawer behavior. Keep AntD components as the interaction source.

- [ ] **Step 5: Final verification**

Run: `npm test`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

- [ ] **Step 6: Commit final polish if Git is available**

```bash
git add src/styles.css
git commit -m "style: polish sales analytics demo"
```

If `src/styles.css` did not change, skip this commit. If Git is not available, continue without committing.

## Self-Review

- Spec coverage: the plan covers the primary dimension selector, AntD Table summary list, Drawer, Tabs, breakdown table, legal dimension rules, fixed metrics, fixture data, demo-only scope, tests, build, and browser smoke test.
- Scope control: the plan does not include real CRM APIs, permissions, saved dashboards, custom metrics, charts, three-dimensional combinations, free dragging, or full export implementation.
- Type consistency: the plan consistently uses `DimensionKey`, `SummaryRow`, `BreakdownRow`, `customerCount`, and `totalAmount`.
- Git caveat: the current workspace may not be a Git repository. Each commit step is conditional so execution can continue in this empty folder without destructive setup.
