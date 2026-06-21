import { Card, Select, Space, Tabs } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import BreakdownDrawer from './components/BreakdownDrawer';
import FilterBar from './components/FilterBar';
import FunnelBreakdownDrawer from './components/FunnelBreakdownDrawer';
import FunnelFilterBar from './components/FunnelFilterBar';
import { FunnelTable } from './components/FunnelTable';
import PerformanceDetailDrawer from './components/PerformanceDetailDrawer';
import SummaryTable from './components/SummaryTable';
import { mockDeals } from './data/mockDeals';
import { mockFunnelCustomers } from './data/mockFunnelCustomers';
import {
  buildReportSummaryRows,
  getDetailRecords,
  type ReportSummaryRow,
} from './domain/analytics';
import { dimensions, getDimension, type DimensionKey } from './domain/dimensions';
import { createBaselineFilters, filterDealRecords, type SalesDashboardFilters } from './domain/filters';
import {
  buildFunnelSummaryRows,
  filterFunnelCustomers,
  type FunnelDimensionKey,
  type FunnelFilters,
  type FunnelSummaryRow,
} from './domain/funnel';

const today = dayjs().format('YYYY-MM-DD');

const defaultFilters: SalesDashboardFilters = {
  dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), today],
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'currentNewCustomers',
  customerPools: [],
  cities: [],
  institutions: [],
};

const defaultFunnelFilters: FunnelFilters = {
  dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), today],
  customerScope: 'currentNewCustomers',
  customerType: 'valid',
  departments: [],
  consultants: [],
  channelCategories: [],
  channels: [],
};

const funnelDimensions = [
  { key: 'total' as const, label: '汇总' },
  { key: 'date' as const, label: '日期' },
  { key: 'department' as const, label: '部门' },
  { key: 'consultant' as const, label: '咨询师' },
  { key: 'channelCategory' as const, label: '渠道分类' },
  { key: 'channel' as const, label: '渠道' },
];

export default function App() {
  const [activeReport, setActiveReport] = useState<'performance' | 'funnel'>('performance');
  const [primaryDimension, setPrimaryDimension] = useState<DimensionKey>('consultant');
  const [filters, setFilters] = useState<SalesDashboardFilters>(defaultFilters);
  const [selectedBreakdownRow, setSelectedBreakdownRow] = useState<ReportSummaryRow | null>(null);
  const [selectedDetailRow, setSelectedDetailRow] = useState<ReportSummaryRow | null>(null);

  // Funnel state
  const [funnelFilters, setFunnelFilters] = useState<FunnelFilters>(defaultFunnelFilters);
  const [funnelPrimaryDimension, setFunnelPrimaryDimension] = useState<FunnelDimensionKey>('consultant');
  const [selectedFunnelBreakdownRow, setSelectedFunnelBreakdownRow] = useState<FunnelSummaryRow | null>(null);

  const filteredRecords = useMemo(() => filterDealRecords(mockDeals, filters), [filters]);
  const baselineRecords = useMemo(
    () => filterDealRecords(mockDeals, createBaselineFilters(filters)),
    [filters],
  );
  const primaryDimensionConfig = getDimension(primaryDimension);
  const summaryRows = useMemo(
    () =>
      buildReportSummaryRows(
        filteredRecords,
        baselineRecords,
        primaryDimension,
      ),
    [filteredRecords, baselineRecords, primaryDimension],
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

  // Funnel computed values
  const filteredFunnelCustomers = useMemo(
    () => filterFunnelCustomers(mockFunnelCustomers, funnelFilters),
    [funnelFilters],
  );
  const funnelSummaryRows = useMemo(
    () =>
      funnelFilters.dateRange
        ? buildFunnelSummaryRows(
            filteredFunnelCustomers,
            funnelFilters.dateRange,
            funnelPrimaryDimension,
          )
        : [],
    [filteredFunnelCustomers, funnelFilters.dateRange, funnelPrimaryDimension],
  );

  return (
    <main className="app-shell">
      <Tabs
        activeKey={activeReport}
        onChange={(key) => setActiveReport(key as 'performance' | 'funnel')}
        items={[
          {
            key: 'performance',
            label: '业绩报表',
            children: (
              <>
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
                    filters={{ customerScope: filters.customerScope, dealType: filters.dealType }}
                    onOpenBreakdown={setSelectedBreakdownRow}
                    onOpenDetails={setSelectedDetailRow}
                  />
                </Card>

                <BreakdownDrawer
                  open={selectedBreakdownRow !== null}
                  records={filteredRecords}
                  baselineRecords={baselineRecords}
                  primaryDimension={primaryDimension}
                  row={selectedBreakdownRow}
                  filters={{ customerScope: filters.customerScope, dealType: filters.dealType }}
                  onClose={() => setSelectedBreakdownRow(null)}
                />

                <PerformanceDetailDrawer
                  open={selectedDetailRow !== null}
                  records={detailRecords}
                  primaryDimension={primaryDimensionConfig}
                  primaryDimensionValue={selectedDetailRow?.primaryDimensionValue ?? null}
                  onClose={() => setSelectedDetailRow(null)}
                />
              </>
            ),
          },
          {
            key: 'funnel',
            label: '转化漏斗报表',
            children: (
              <>
                <Card className="toolbar-card">
                  <FunnelFilterBar
                    filters={funnelFilters}
                    records={mockFunnelCustomers}
                    onFiltersChange={(nextFilters) => {
                      setFunnelFilters(nextFilters);
                      setSelectedFunnelBreakdownRow(null);
                    }}
                  />
                </Card>
                <Card className="content-card">
                  <div className="report-toolbar">
                    <Space>
                      <span className="report-toolbar-label">漏斗主维度</span>
                      <Select
                        value={funnelPrimaryDimension}
                        style={{ width: 140 }}
                        placeholder="请选择漏斗主维度"
                        aria-label="漏斗主维度"
                        virtual={false}
                        options={funnelDimensions.map((d) => ({
                          value: d.key,
                          label: d.label,
                        }))}
                        onChange={(dimension) => {
                          setFunnelPrimaryDimension(dimension);
                          setSelectedFunnelBreakdownRow(null);
                        }}
                      />
                    </Space>
                  </div>
                  <FunnelTable
                    primaryDimension={
                      funnelDimensions.find((d) => d.key === funnelPrimaryDimension) ?? funnelDimensions[0]
                    }
                    rows={funnelSummaryRows}
                    filters={{
                      customerScope: funnelFilters.customerScope,
                      customerType: funnelFilters.customerType,
                    }}
                    onOpenBreakdown={setSelectedFunnelBreakdownRow}
                  />
                </Card>

                <FunnelBreakdownDrawer
                  open={selectedFunnelBreakdownRow !== null}
                  records={filteredFunnelCustomers}
                  dateRange={funnelFilters.dateRange ?? ['', '']}
                  primaryDimension={
                    funnelDimensions.find((d) => d.key === funnelPrimaryDimension) ?? funnelDimensions[0]
                  }
                  row={selectedFunnelBreakdownRow}
                  filters={{
                    customerScope: funnelFilters.customerScope,
                    customerType: funnelFilters.customerType,
                  }}
                  onClose={() => setSelectedFunnelBreakdownRow(null)}
                />
              </>
            ),
          },
        ]}
      />
    </main>
  );
}
