import { Card, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import PerformanceDetailDrawer from './components/PerformanceDetailDrawer';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import {
  buildReportSummaryRows,
  getDetailRecords,
  type ReportSummaryRow,
} from './domain/analytics';
import { dimensions, getDimension, type DimensionKey } from './domain/dimensions';
import { createBaselineFilters, filterDealRecords, type SalesDashboardFilters } from './domain/filters';

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
  const [selectedBreakdownRow, setSelectedBreakdownRow] = useState<ReportSummaryRow | null>(null);
  const [selectedDetailRow, setSelectedDetailRow] = useState<ReportSummaryRow | null>(null);

  const filteredRecords = useMemo(() => filterDealRecords(mockDeals, filters), [filters]);
  const baselineRecords = useMemo(
    () => filterDealRecords(mockDeals, createBaselineFilters(filters)),
    [filters],
  );
  const newCustomerMetricRecords = useMemo(
    () => filterDealRecords(mockDeals, { ...filters, dealType: 'all' }),
    [filters],
  );
  const showContributionRates = useMemo(
    () => filters.customerScope !== 'all' || filters.dealType !== 'all',
    [filters.customerScope, filters.dealType],
  );
  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () =>
      buildReportSummaryRows(
        filteredRecords,
        baselineRecords,
        primaryDimension,
        newCustomerMetricRecords,
      ),
    [filteredRecords, baselineRecords, newCustomerMetricRecords, primaryDimension],
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
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedBreakdownRow(null);
            setSelectedDetailRow(null);
          }}
        />
      </Card>

      <Card className="content-card">
        <div className="report-toolbar">
          <Space>
            <span className="report-toolbar-label">主维度</span>
            <Select
              value={primaryDimension}
              style={{ width: 140 }}
              placeholder="请选择主维度"
              aria-label="主维度"
              virtual={false}
              options={dimensions.map((dimension) => ({
                value: dimension.key,
                label: dimension.label,
              }))}
              onChange={(dimension) => {
                setPrimaryDimension(dimension);
                setSelectedBreakdownRow(null);
                setSelectedDetailRow(null);
              }}
            />
          </Space>
        </div>
        <SummaryTable
          primaryDimension={primaryDimensionConfig}
          rows={summaryRows}
          showContributionRates={showContributionRates}
          showNewCustomerMetrics={filters.customerScope === 'currentNewCustomers'}
          onOpenBreakdown={setSelectedBreakdownRow}
          onOpenDetails={setSelectedDetailRow}
        />
      </Card>

      <BreakdownDrawer
        open={selectedBreakdownRow !== null}
        records={filteredRecords}
        baselineRecords={baselineRecords}
        newCustomerMetricRecords={newCustomerMetricRecords}
        primaryDimension={primaryDimension}
        row={selectedBreakdownRow}
        showContributionRates={showContributionRates}
        showNewCustomerMetrics={filters.customerScope === 'currentNewCustomers'}
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
