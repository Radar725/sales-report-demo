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

function aggregate(records: DealRecord[], dimension: DimensionKey): AggregateSummary[] {
  const groups = new Map<string, DealRecord[]>();

  for (const record of records) {
    const value = getRecordDimensionValue(record, dimension);
    const current = groups.get(value) ?? [];
    current.push(record);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, groupRecords]) => {
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
      const createdCustomerCountInPeriod = Math.max(
        ...groupRecords.map((record) => record.createdCustomerCountInPeriod),
      );
      const historicalRepurchaseCustomerCount = Math.max(
        ...groupRecords.map((record) => record.historicalRepurchaseCustomerCount),
      );
      const historicalRepurchaseAmount = Math.max(
        ...groupRecords.map((record) => record.historicalRepurchaseAmount),
      );

      return {
        value,
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
    })
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
