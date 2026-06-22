import { describe, expect, it } from 'vitest';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import {
  attachFunnelComparison,
  buildFunnelSummaryRows,
} from './funnel';

function makeCustomer(
  id: string,
  convertedAt: string | null,
  createdAt = '2026-06-01',
): FunnelCustomerRecord {
  return {
    id,
    customerCreatedAt: createdAt,
    customerType: 'valid',
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
    dispatchedAt: null,
    invitedAt: null,
    visitedAt: null,
    convertedAt,
  };
}

describe('funnel comparison', () => {
  it('attaches period-over-period comparison changes to summary rows', () => {
    const currentCustomers = [1, 2, 3].map((index) =>
      makeCustomer(`cur-${index}`, '2026-06-15'),
    );
    const comparisonCustomers = [1, 2].map((index) =>
      makeCustomer(`cmp-${index}`, '2026-05-15', '2026-05-01'),
    );

    const currentRows = buildFunnelSummaryRows(
      currentCustomers,
      ['2026-06-01', '2026-06-30'],
      'total',
    );
    const comparisonRows = buildFunnelSummaryRows(
      comparisonCustomers,
      ['2026-05-01', '2026-05-31'],
      'total',
    );

    currentRows[0] = {
      ...currentRows[0],
      customerCount: 3,
      conversionRate: 0.5,
    };
    comparisonRows[0] = {
      ...comparisonRows[0],
      customerCount: 2,
      conversionRate: 0.4,
    };

    const rows = attachFunnelComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    expect(rows[0].comparison?.customerCount).toBe(0.5);
    expect(rows[0].comparison?.conversionRate).toBeCloseTo(0.25);
  });

  it('returns null customerCount change when comparison has zero customers', () => {
    const currentRows = buildFunnelSummaryRows(
      [makeCustomer('cur-1', '2026-06-15')],
      ['2026-06-01', '2026-06-30'],
      'consultant',
    );
    const comparisonRows = buildFunnelSummaryRows(
      [],
      ['2026-05-01', '2026-05-31'],
      'consultant',
    );

    const rows = attachFunnelComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    expect(rows[0].comparison?.customerCount).toBeNull();
  });

  it('returns null customerCount change when comparison dimension is missing', () => {
    const currentRows = buildFunnelSummaryRows(
      [makeCustomer('cur-1', '2026-06-15')],
      ['2026-06-01', '2026-06-30'],
      'consultant',
    );
    const comparisonRows = buildFunnelSummaryRows(
      [makeCustomer('cmp-1', '2026-05-15', '2026-05-01')],
      ['2026-05-01', '2026-05-31'],
      'consultant',
    );
    comparisonRows[0] = {
      ...comparisonRows[0],
      primaryDimensionValue: '李然',
    };

    const rows = attachFunnelComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    expect(rows[0].comparison?.customerCount).toBeNull();
  });
});
