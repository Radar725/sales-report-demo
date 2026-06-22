import { describe, expect, it } from 'vitest';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import { mockFunnelCustomers } from '../data/mockFunnelCustomers';
import {
  attachFunnelComparison,
  buildFunnelBreakdownRows,
  buildFunnelSummaryRows,
  buildFunnelTreeData,
  filterFunnelCustomers,
  getFunnelBreakdownDimensions,
  type FunnelFilters,
} from './funnel';

const filters: FunnelFilters = {
  dateRange: ['2026-06-01', '2026-06-30'],
  comparisonDateRange: null,
  customerScope: 'currentNewCustomers',
  customerType: 'valid',
  departments: [],
  consultants: [],
  channelCategories: [],
  channels: [],
};

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

describe('funnel analytics', () => {
  it('counts customers by creation date but stages by their own dates', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'consultant',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
      customerCount: 3,
      dispatchedCustomerCount: 2,
      invitedCustomerCount: 2,
      visitedCustomerCount: 1,
      convertedCustomerCount: 1,
      dispatchRate: 2 / 3,
      invitationRate: 2 / 3,
      visitConversionRate: 1,
    });
  });

  it('uses customer creation date for the date dimension', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'date',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '2026-06-05')).toMatchObject({
      customerCount: 1,
    });
  });

  it('keeps old, invalid customers when both filters select them', () => {
    const rows = filterFunnelCustomers(mockFunnelCustomers, {
      ...filters,
      customerScope: 'existingCustomers',
      customerType: 'invalid',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].customerCreatedAt < filters.dateRange![0]).toBe(true);
  });

  it('returns null for every ratio with a zero denominator', () => {
    const [row] = buildFunnelSummaryRows([], filters.dateRange!, 'total');
    expect(row).toMatchObject({
      dispatchRate: null,
      inviteVisitRate: null,
      visitConversionRate: null,
    });
  });

  it('aggregates by department correctly', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'department',
    );
    const east = rows.find((r) => r.primaryDimensionValue === '华东一部');
    expect(east).toBeDefined();
    expect(east!.customerCount).toBeGreaterThanOrEqual(2);
  });

  it('aggregates by channel', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'channel',
    );
    expect(rows.find((r) => r.primaryDimensionValue === '信息流')).toBeDefined();
    expect(rows.find((r) => r.primaryDimensionValue === '私域')).toBeDefined();
  });

  it('aggregates by channel category', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'channelCategory',
    );
    expect(rows.find((r) => r.primaryDimensionValue === '线上投放')).toBeDefined();
  });

  it('builds a total row', () => {
    const [row] = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      filters.dateRange!,
      'total',
    );
    expect(row).toBeDefined();
    expect(row.primaryDimensionValue).toBe('汇总');
  });

  it('produces tree data for consultants and channels', () => {
    const tree = buildFunnelTreeData(mockFunnelCustomers);
    expect(tree.consultantTree.length).toBeGreaterThan(0);
    expect(tree.channelTree.length).toBeGreaterThan(0);

    const eastNode = tree.consultantTree.find(
      (n) => (n as { value: string }).value === '华东一部',
    );
    expect(eastNode).toBeDefined();
    expect(
      (eastNode as { children?: Array<{ value: string }> }).children?.some(
        (c) => c.value === '张敏',
      ),
    ).toBe(true);
  });

  it('breaks down department to consultant', () => {
    const filtered = filterFunnelCustomers(mockFunnelCustomers, filters);
    const rows = buildFunnelBreakdownRows(filtered, filters.dateRange!, {
      primaryDimension: 'department',
      primaryDimensionValue: '华东一部',
      breakdownDimension: 'consultant',
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].breakdownDimensionValue).toBeDefined();
  });

  it('excludes child-to-parent breakdown', () => {
    const dims = getFunnelBreakdownDimensions('consultant');
    expect(dims.find((d) => d.key === 'department')).toBeUndefined();
  });

  it('allows cross-group breakdown', () => {
    const dims = getFunnelBreakdownDimensions('department');
    expect(dims.find((d) => d.key === 'channel')).toBeDefined();
  });

  it('cross-period dispatched leads to rate above 1', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, {
        ...filters,
        dateRange: ['2026-07-01', '2026-07-31'],
        customerScope: 'currentNewCustomers',
      }),
      ['2026-07-01', '2026-07-31'],
      'consultant',
    );
    expect(rows).toBeDefined();
  });
});

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
