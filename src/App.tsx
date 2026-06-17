import { Card, Select, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import DashboardOverview from './components/DashboardOverview';
import FilterBar from './components/FilterBar';
import PerformanceDetailDrawer from './components/PerformanceDetailDrawer';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import {
  buildDashboardSummary,
  buildSummaryRows,
  getDetailRecords,
  type SummaryRow,
} from './domain/analytics';
import { dimensions, getDimension, type DimensionKey } from './domain/dimensions';
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
  const dashboardSummary = useMemo(
    () => buildDashboardSummary(filteredRecords),
    [filteredRecords],
  );
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
          onFiltersChange={(nextFilters) => {
            setFilters(nextFilters);
            setSelectedBreakdownRow(null);
            setSelectedDetailRow(null);
          }}
        />
      </Card>

      <Card className="content-card">
        <Tabs
          defaultActiveKey="dashboard"
          items={[
            {
              key: 'dashboard',
              label: '仪表盘',
              children: <DashboardOverview summary={dashboardSummary} />,
            },
            {
              key: 'report',
              label: '报表',
              children: (
                <>
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
                    onOpenBreakdown={setSelectedBreakdownRow}
                    onOpenDetails={setSelectedDetailRow}
                  />
                </>
              ),
            },
          ]}
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
