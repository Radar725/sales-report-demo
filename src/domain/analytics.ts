import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from './dimensions';
import type { MetricValue } from './metrics';

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
};

export type ReportSummaryRow = SummaryRow & ReportContributionValues;
export type ReportBreakdownRow = BreakdownRow & ReportContributionValues;

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
  return dimension === 'date' ? record.dealDate : record[dimension];
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
  const newCustomerCount = new Set(newCustomerRecords.map((record) => record.customerId)).size;
  const newCustomerAmount = newCustomerRecords.reduce(
    (sum, record) => sum + record.reportedAmount,
    0,
  );
  const createdCustomerCountInPeriod =
    groupRecords.length === 0
      ? 0
      : Math.max(...groupRecords.map((record) => record.createdCustomerCountInPeriod));
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
    newCustomerConversionRate: safeDivide(newCustomerCount, createdCustomerCountInPeriod),
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
    key: `${primaryDimension}:${row.value}`,
    primaryDimensionValue: row.value,
    ...(({ value: _value, ...metrics }) => metrics)(row),
  }));
}

export function buildDashboardSummary(records: DealRecord[]): MetricValue {
  return calculateMetrics(records);
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
  baseline: MetricValue | undefined,
): ReportContributionValues {
  if (!baseline) {
    return { reportedAmountRate: null, dealCountRate: null, customerCountRate: null };
  }

  return {
    reportedAmountRate: baseline.reportedAmount === 0 ? null : current.reportedAmount / baseline.reportedAmount,
    dealCountRate: baseline.dealCount === 0 ? null : current.dealCount / baseline.dealCount,
    customerCountRate: baseline.customerCount === 0 ? null : current.customerCount / baseline.customerCount,
  };
}

export function buildReportSummaryRows(
  records: DealRecord[],
  baselineRecords: DealRecord[],
  primaryDimension: DimensionKey,
): ReportSummaryRow[] {
  const baselineByValue = new Map(
    aggregate(baselineRecords, primaryDimension).map((row) => [row.value, toMetricValue(row)]),
  );

  return aggregate(records, primaryDimension).map((row) => {
    const metrics = toMetricValue(row);
    return {
      key: `${primaryDimension}:${row.value}`,
      primaryDimensionValue: row.value,
      ...metrics,
      ...calculateContributionValues(metrics, baselineByValue.get(row.value)),
    };
  });
}

export function buildReportBreakdownRows(
  records: DealRecord[],
  baselineRecords: DealRecord[],
  query: BreakdownQuery,
): ReportBreakdownRow[] {
  const isPrimaryRow = (record: DealRecord) =>
    getRecordDimensionValue(record, query.primaryDimension) === query.primaryDimensionValue;
  const baselineByValue = new Map(
    aggregate(baselineRecords.filter(isPrimaryRow), query.breakdownDimension).map((row) => [
      row.value,
      toMetricValue(row),
    ]),
  );

  return aggregate(records.filter(isPrimaryRow), query.breakdownDimension).map((row) => {
    const metrics = toMetricValue(row);
    return {
      key: `${query.breakdownDimension}:${row.value}`,
      breakdownDimensionValue: row.value,
      ...metrics,
      ...calculateContributionValues(metrics, baselineByValue.get(row.value)),
    };
  });
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
