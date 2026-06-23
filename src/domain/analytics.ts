import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from './dimensions';
import { calculateChange, getDateComparisonKey } from './comparison';
import type { MetricValue } from './metrics';
import type { ReportMetricKey } from './reportMetrics';

export type SummaryRow = MetricValue & {
  key: string;
  primaryDimensionValue: string;
};

export type BreakdownRow = MetricValue & {
  key: string;
  breakdownDimensionValue: string;
};

export type ReportContributionValues = {
  reportedAmountRate: number | null;
  dealCountRate: number | null;
  customerCountRate: number | null;
  repurchaseCustomerTotalRate: number | null;
  repurchaseDealCountTotalRate: number | null;
  repurchaseAmountTotalRate: number | null;
};

export type ReportHistoricalRepurchaseContributionValues = {
  repurchaseCustomerTotalRate: number | null;
  repurchaseDealCountTotalRate: number | null;
  repurchaseAmountTotalRate: number | null;
};

export type ReportSummaryRow = SummaryRow & ReportContributionValues;
export type ReportBreakdownRow = BreakdownRow & ReportContributionValues;

export type ReportComparisonMetricKey =
  | ReportMetricKey
  | 'confirmedAmount'
  | 'confirmedAmountRate';

export type ReportComparisonValues = Partial<Record<ReportComparisonMetricKey, number | null>>;

export type ReportComparableSummaryRow = ReportSummaryRow & {
  comparison: ReportComparisonValues | null;
};

export type ReportComparableBreakdownRow = ReportBreakdownRow & {
  comparison: ReportComparisonValues | null;
};

const REPORT_METRIC_KEYS: ReportComparisonMetricKey[] = [
  'reportedAmount',
  'confirmedAmount',
  'confirmedAmountRate',
  'dealCount',
  'customerCount',
  'averageDealAmount',
  'reportedAmountRate',
  'dealCountRate',
  'customerCountRate',
  'repurchaseCustomerTotalRate',
  'repurchaseDealCountTotalRate',
  'repurchaseAmountTotalRate',
];

function isDateDimensionValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getComparisonLookupKey(value: string, isDateDimension: boolean) {
  return isDateDimension ? getDateComparisonKey(value) : value;
}

function buildComparisonValues<T extends ReportSummaryRow | ReportBreakdownRow>(
  currentRow: T,
  comparisonRow: T | undefined,
): ReportComparisonValues {
  return Object.fromEntries(
    REPORT_METRIC_KEYS.map((key) => [
      key,
      calculateChange(currentRow[key], comparisonRow?.[key] ?? null),
    ]),
  ) as ReportComparisonValues;
}

type BreakdownQuery = {
  primaryDimension: DimensionKey;
  primaryDimensionValue: string;
  breakdownDimension: DimensionKey;
};

type DetailQuery = {
  primaryDimension: DimensionKey;
  primaryDimensionValue: string;
};

type AggregateSummary = {
  value: string;
} & MetricValue;

function safeDivide(numerator: number, denominator: number) {
  return denominator === 0 ? 0 : numerator / denominator;
}

function getRecordDimensionValue(record: DealRecord, dimension: DimensionKey) {
  if (dimension === 'total') {
    return '汇总';
  }

  return dimension === 'date' ? record.dealDate : record[dimension];
}

function getSummaryRowKey(dimension: DimensionKey, value: string) {
  return dimension === 'total' ? 'total' : `${dimension}:${value}`;
}

function getNewCustomerCount(groupRecords: DealRecord[]) {
  const countByConsultant = new Map<string, number>();

  for (const record of groupRecords) {
    countByConsultant.set(
      record.consultant,
      Math.max(countByConsultant.get(record.consultant) ?? 0, record.createdCustomerCountInPeriod),
    );
  }

  return [...countByConsultant.values()].reduce((sum, count) => sum + count, 0);
}

function calculateMetrics(groupRecords: DealRecord[]): MetricValue {
  const customerIds = new Set(groupRecords.map((record) => record.customerId));
  const newDiagnosisRecords = groupRecords.filter((record) => record.dealType === '新诊');
  const repurchaseRecords = groupRecords.filter((record) => record.dealType === '复购');
  const newCustomerRecords = groupRecords.filter((record) => record.customerCreatedInPeriod);

  const reportedAmount = groupRecords.reduce((sum, record) => sum + record.reportedAmount, 0);
  const confirmedAmount = groupRecords.reduce((sum, record) => sum + record.confirmedAmount, 0);
  const dealCount = groupRecords.length;
  const customerCount = customerIds.size;
  const newDiagnosisAmount = newDiagnosisRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const repurchaseAmount = repurchaseRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const newDiagnosisCustomerCount = new Set(
    newDiagnosisRecords.map((record) => record.customerId),
  ).size;
  const repurchaseCustomerCount = new Set(
    repurchaseRecords.map((record) => record.customerId),
  ).size;
  const convertedNewCustomerCount = new Set(
    newCustomerRecords.map((record) => record.customerId),
  ).size;
  const newCustomerCount = getNewCustomerCount(groupRecords);
  const newCustomerAmount = newCustomerRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const historicalRepurchaseCustomerCount =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.historicalRepurchaseCustomerCount));
  const historicalRepurchaseAmount =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.historicalRepurchaseAmount));

  return {
    reportedAmount,
    confirmedAmount,
    confirmedAmountRate: reportedAmount === 0 ? null : confirmedAmount / reportedAmount,
    dealCount,
    customerCount,
    averageDealAmount: safeDivide(reportedAmount, dealCount),
    newDiagnosisAmount,
    newDiagnosisDealCount: newDiagnosisRecords.length,
    newDiagnosisCustomerCount,
    newDiagnosisDealCountRate: safeDivide(newDiagnosisRecords.length, dealCount),
    newDiagnosisCustomerRate: safeDivide(newDiagnosisCustomerCount, customerCount),
    newDiagnosisAmountRate: safeDivide(newDiagnosisAmount, reportedAmount),
    repurchaseAmount,
    repurchaseDealCount: repurchaseRecords.length,
    repurchaseCustomerCount,
    repurchaseDealCountRate: safeDivide(repurchaseRecords.length, dealCount),
    repurchaseCustomerRate: safeDivide(repurchaseCustomerCount, customerCount),
    repurchaseAmountRate: safeDivide(repurchaseAmount, reportedAmount),
    newCustomerCount,
    convertedNewCustomerCount,
    newCustomerConversionRate: safeDivide(convertedNewCustomerCount, newCustomerCount),
    newCustomerAmountContributionRate: safeDivide(newCustomerAmount, reportedAmount),
    historicalRepurchaseCustomerContributionRate: safeDivide(
      repurchaseCustomerCount,
      historicalRepurchaseCustomerCount,
    ),
    historicalRepurchaseAmountContributionRate: safeDivide(
      repurchaseAmount,
      historicalRepurchaseAmount,
    ),
  };
}

function aggregate(records: DealRecord[], dimension: DimensionKey): AggregateSummary[] {
  if (dimension === 'total') {
    return [{ value: '汇总', ...calculateMetrics(records) }];
  }

  const groups = new Map<string, DealRecord[]>();

  for (const record of records) {
    const value = getRecordDimensionValue(record, dimension);
    const current = groups.get(value) ?? [];
    current.push(record);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, groupRecords]) => ({
      value,
      ...calculateMetrics(groupRecords),
    }))
    .sort((left, right) => {
      if (dimension === 'date') {
        return left.value.localeCompare(right.value);
      }
      return right.reportedAmount - left.reportedAmount;
    });
}

export function buildSummaryRows(records: DealRecord[], primaryDimension: DimensionKey): SummaryRow[] {
  return aggregate(records, primaryDimension).map((row) => ({
    key: getSummaryRowKey(primaryDimension, row.value),
    primaryDimensionValue: row.value,
    ...(({ value: _value, ...metrics }) => metrics)(row),
  }));
}

export function buildBreakdownRows(records: DealRecord[], query: BreakdownQuery): BreakdownRow[] {
  const scopedRecords = records.filter(
    (record) => getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue,
  );

  return aggregate(scopedRecords, query.breakdownDimension).map((row) => ({
    key: `${query.breakdownDimension}:${row.value}`,
    breakdownDimensionValue: row.value,
    ...(({ value: _value, ...metrics }) => metrics)(row),
  }));
}

export function getDetailRecords(records: DealRecord[], query: DetailQuery) {
  if (query.primaryDimension === 'total') {
    return records;
  }

  return records.filter(
    (record) => getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue,
  );
}

function toMetricValue(row: AggregateSummary): MetricValue {
  const { value: _value, ...metrics } = row;
  return metrics;
}

function calculateContributionValues(
  current: MetricValue,
  total: MetricValue,
): ReportContributionValues {
  return {
    reportedAmountRate: total.reportedAmount === 0 ? null : current.reportedAmount / total.reportedAmount,
    dealCountRate: total.dealCount === 0 ? null : current.dealCount / total.dealCount,
    customerCountRate: total.customerCount === 0 ? null : current.customerCount / total.customerCount,
    repurchaseCustomerTotalRate: null,
    repurchaseDealCountTotalRate: null,
    repurchaseAmountTotalRate: null,
  };
}

function calculateHistoricalRepurchaseContributionValues(
  current: MetricValue,
  historical: MetricValue | undefined,
): ReportHistoricalRepurchaseContributionValues {
  if (!historical) {
    return {
      repurchaseCustomerTotalRate: null,
      repurchaseDealCountTotalRate: null,
      repurchaseAmountTotalRate: null,
    };
  }

  return {
    repurchaseCustomerTotalRate:
      historical.repurchaseCustomerCount === 0
        ? null
        : current.repurchaseCustomerCount / historical.repurchaseCustomerCount,
    repurchaseDealCountTotalRate:
      historical.repurchaseDealCount === 0
        ? null
        : current.repurchaseDealCount / historical.repurchaseDealCount,
    repurchaseAmountTotalRate:
      historical.repurchaseAmount === 0 ? null : current.repurchaseAmount / historical.repurchaseAmount,
  };
}

export function buildReportSummaryRows(
  records: DealRecord[],
  historicalRepurchaseRecords: DealRecord[],
  primaryDimension: DimensionKey,
): ReportSummaryRow[] {
  const total = calculateMetrics(records);
  const historicalByValue = new Map(
    aggregate(historicalRepurchaseRecords, primaryDimension).map((row) => [
      row.value,
      toMetricValue(row),
    ]),
  );

  return aggregate(records, primaryDimension).map((row) => {
    const metrics = toMetricValue(row);
    return {
      key: getSummaryRowKey(primaryDimension, row.value),
      primaryDimensionValue: row.value,
      ...metrics,
      ...calculateContributionValues(metrics, total),
      ...calculateHistoricalRepurchaseContributionValues(metrics, historicalByValue.get(row.value)),
    };
  });
}

export function buildReportBreakdownRows(
  records: DealRecord[],
  historicalRepurchaseRecords: DealRecord[],
  query: BreakdownQuery,
): ReportBreakdownRow[] {
  const isPrimaryRow = (record: DealRecord) =>
    getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue;
  const scopedRecords = records.filter(isPrimaryRow);
  const total = calculateMetrics(scopedRecords);
  const historicalByValue = new Map(
    aggregate(historicalRepurchaseRecords.filter(isPrimaryRow), query.breakdownDimension).map(
      (row) => [row.value, toMetricValue(row)],
    ),
  );

  return aggregate(scopedRecords, query.breakdownDimension).map((row) => {
    const metrics = toMetricValue(row);
    return {
      key: `${query.breakdownDimension}:${row.value}`,
      breakdownDimensionValue: row.value,
      ...metrics,
      ...calculateContributionValues(metrics, total),
      ...calculateHistoricalRepurchaseContributionValues(metrics, historicalByValue.get(row.value)),
    };
  });
}

function getRowDimensionValue(
  row: ReportSummaryRow | ReportBreakdownRow,
  valueKey: 'primaryDimensionValue' | 'breakdownDimensionValue',
) {
  return valueKey === 'primaryDimensionValue'
    ? (row as ReportSummaryRow).primaryDimensionValue
    : (row as ReportBreakdownRow).breakdownDimensionValue;
}

export function attachReportComparison<T extends ReportSummaryRow | ReportBreakdownRow>(
  currentRows: T[],
  comparisonRows: T[],
  _currentRange: [string, string],
  _comparisonRange: [string, string],
  valueKey: 'primaryDimensionValue' | 'breakdownDimensionValue',
): Array<T & { comparison: ReportComparisonValues }> {
  const sampleValue =
    (currentRows[0] && getRowDimensionValue(currentRows[0], valueKey)) ??
    (comparisonRows[0] && getRowDimensionValue(comparisonRows[0], valueKey));
  const isDateDimension =
    sampleValue !== undefined && isDateDimensionValue(sampleValue);

  const comparisonByKey = new Map(
    comparisonRows.map((row) => [
      getComparisonLookupKey(getRowDimensionValue(row, valueKey), isDateDimension),
      row,
    ]),
  );

  return currentRows.map((currentRow) => ({
    ...currentRow,
    comparison: buildComparisonValues(
      currentRow,
      comparisonByKey.get(
        getComparisonLookupKey(getRowDimensionValue(currentRow, valueKey), isDateDimension),
      ),
    ),
  }));
}

type BreakdownDetailQuery = {
  primaryDimension: DimensionKey;
  primaryDimensionValue: string;
  breakdownDimension: DimensionKey;
  breakdownDimensionValue: string;
};

export function getBreakdownDetailRecords(records: DealRecord[], query: BreakdownDetailQuery) {
  return records.filter(
    (record) =>
      getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue &&
      getRecordDimensionValue(record, query.breakdownDimension) === query.breakdownDimensionValue,
  );
}
