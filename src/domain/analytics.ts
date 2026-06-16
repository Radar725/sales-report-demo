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
