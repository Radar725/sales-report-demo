import { Card, Typography } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { buildSummaryRows, type SummaryRow } from './domain/analytics';
import { getDimension, type DimensionKey } from './domain/dimensions';
import { filterDealRecords, type SalesDashboardFilters } from './domain/filters';

const today = dayjs().format('YYYY-MM-DD');

const defaultFilters: SalesDashboardFilters = {
  dateRange: [today, today],
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'all',
  cities: [],
  institutions: [],
};

export default function App() {
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [filters, setFilters] = useState<SalesDashboardFilters>(defaultFilters);
  const [selectedRow, setSelectedRow] = useState<SummaryRow | null>(null);

  const filteredRecords = useMemo(() => filterDealRecords(mockDeals, filters), [filters]);
  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () => buildSummaryRows(filteredRecords, primaryDimension),
    [filteredRecords, primaryDimension],
  );

  return (
    <main className="app-shell">
      <Typography.Title level={2}>CRM 业绩统计 Demo</Typography.Title>
      <Typography.Paragraph type="secondary">
        主维度汇总列表 + 抽屉多维拆解，基于 Ant Design 5.0 常规组件。
      </Typography.Paragraph>

      <Card className="toolbar-card">
        <FilterBar
          filters={filters}
          records={mockDeals}
          primaryDimension={primaryDimension}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedRow(null);
          }}
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
        records={filteredRecords}
        primaryDimension={primaryDimension}
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
      />
    </main>
  );
}
