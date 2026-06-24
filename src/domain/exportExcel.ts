import * as XLSX from 'xlsx';
import type { DealRecord } from '../data/mockDeals';
import { detailColumns } from '../components/detailColumns';
import type { ReportSummaryRow } from './analytics';
import type { FunnelSummaryRow } from './funnel';
import { formatAmount, formatMetricValue, formatPercent } from './metrics';
import { getFunnelMetricDefinitions } from './funnelMetrics';
import { getReportMetricDefinitions, type ReportColumnFilters } from './reportMetrics';
import { downloadBlob } from '../utils/downloadBlob';

type MetricFormat = 'amount' | 'integer' | 'percent';

function formatExportValue(value: number | null | undefined, format: MetricFormat) {
  if (value === null || value === undefined) {
    return '—';
  }

  return formatMetricValue(value, format);
}

function exportRows(filename: string, headers: string[], rows: (string | number)[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}

export function exportPerformanceSummary(
  rows: ReportSummaryRow[],
  primaryDimensionLabel: string,
  filters: ReportColumnFilters,
) {
  const metrics = getReportMetricDefinitions(filters);
  const headers = [primaryDimensionLabel, ...metrics.map((metric) => metric.label)];
  const dataRows = rows.map((row) => [
    row.primaryDimensionValue,
    ...metrics.map((metric) => formatExportValue(row[metric.key], metric.format)),
  ]);

  exportRows('业绩报表-维度数据.xlsx', headers, dataRows);
}

export function exportPerformanceDetails(records: DealRecord[]) {
  const headers = detailColumns.map((column) => String(column.title));
  const dataRows = records.map((record) =>
    detailColumns.map((column) => {
      if ('children' in column) {
        return '';
      }

      if (column.key === 'cooperationAmount') {
        return formatAmount(record.reportedAmount * record.cooperationRatio);
      }

      const dataIndex = column.dataIndex;
      if (!dataIndex || Array.isArray(dataIndex)) {
        return '';
      }

      const field = dataIndex as keyof DealRecord;
      const value = record[field];
      if (column.key === 'reportedAmount' || column.key === 'confirmedAmount') {
        return formatAmount(value as number);
      }

      if (column.key === 'cooperationRatio') {
        return formatPercent(value as number);
      }

      return String(value);
    }),
  );

  exportRows('业绩报表-明细数据.xlsx', headers, dataRows);
}

export function exportFunnelSummary(rows: FunnelSummaryRow[], primaryDimensionLabel: string) {
  const metrics = getFunnelMetricDefinitions();
  const headers = [primaryDimensionLabel, ...metrics.map((metric) => metric.label)];
  const dataRows = rows.map((row) => [
    row.primaryDimensionValue,
    ...metrics.map((metric) => formatExportValue(row[metric.key], metric.format)),
  ]);

  exportRows('转化漏斗报表-导出数据.xlsx', headers, dataRows);
}
