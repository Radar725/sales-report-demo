import { Card } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import PerformanceDetailDrawer from './components/PerformanceDetailDrawer';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { buildSummaryRows, getDetailRecords, type SummaryRow } from './domain/analytics';
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
  customerPools: [],
  cities: [],
  institutions: [],
};

export default function App() {
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [filters, setFilters] = useState<SalesDashboardFilters>(defaultFilters);
  const [selectedBreakdownRow, setSelectedBreakdownRow] = useState<SummaryRow | null>(null);
  const [selectedDetailRow, setSelectedDetailRow] = useState<SummaryRow | null>(null);

  const filteredRecords = useMemo(() => filterDealRecords(mockDeals, filters), [filters]);
  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () => buildSummaryRows(filteredRecords, primaryDimension),
    [filteredRecords, primaryDimension],
  );
  const detailRecords = useMemo(
    () =>
      selectedDetailRow
        ? getDetailRecords(filteredRecords, {
            primaryDimension,
            primaryDimensionValue: selectedDetailRow.primaryDimensionValue,
          })
        : [],
    [filteredRecords, primaryDimension, selectedDetailRow],
  );

  return (
    <main className="app-shell">
      <Card className="toolbar-card">
        <FilterBar
          filters={filters}
          records={mockDeals}
          primaryDimension={primaryDimension}
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedBreakdownRow(null);
            setSelectedDetailRow(null);
          }}
          onPrimaryDimensionChange={(dimension) => {
            setPrimaryDimension(dimension);
            setSelectedBreakdownRow(null);
            setSelectedDetailRow(null);
          }}
        />
      </Card>

      <Card title={`${primaryDimensionConfig.label}业绩汇总`}>
        <SummaryTable
          primaryDimension={primaryDimensionConfig}
          rows={summaryRows}
          onOpenBreakdown={setSelectedBreakdownRow}
          onOpenDetails={setSelectedDetailRow}
        />
      </Card>

      <BreakdownDrawer
        open={selectedBreakdownRow !== null}
        records={filteredRecords}
        primaryDimension={primaryDimension}
        row={selectedBreakdownRow}
        onClose={() => setSelectedBreakdownRow(null)}
      />

      <PerformanceDetailDrawer
        open={selectedDetailRow !== null}
        records={detailRecords}
        primaryDimension={primaryDimensionConfig}
        primaryDimensionValue={selectedDetailRow?.primaryDimensionValue ?? null}
        onClose={() => setSelectedDetailRow(null)}
      />
    </main>
  );
}
