import { describe, expect, it } from 'vitest';
import type {
  FunnelCustomerRecord,
  FunnelCustomerStatus,
} from '../data/mockFunnelCustomers';
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
  departments: [],
  consultants: [],
  channelCategories: [],
  channels: [],
};

function makeCustomer(
  id: string,
  status: FunnelCustomerStatus,
  createdAt = '2026-06-01',
): FunnelCustomerRecord {
  return {
    id,
    customerCreatedAt: createdAt,
    customerType: 'valid',
    status,
    department: '华东一部',
    consultant: '张敏',
    channelCategory: '线上投放',
    channel: '信息流',
  };
}

describe('funnel analytics', () => {
  it('counts statuses cumulatively', () => {
    const statuses: FunnelCustomerStatus[] = [
      'pendingWechat',
      'wechatAdded',
      'dispatched',
      'invited',
      'visited',
      'firstConverted',
      'repurchased',
    ];
    const [row] = buildFunnelSummaryRows(
      statuses.map((status, index) => makeCustomer(String(index), status)),
      'total',
    );
    expect(row).toMatchObject({
      recordedCustomerCount: 7,
      validCustomerCount: 7,
      validCustomerRate: 1,
      addedWechatCustomerCount: 6,
      dispatchedCustomerCount: 5,
      invitedCustomerCount: 4,
      visitedCustomerCount: 3,
      convertedCustomerCount: 2,
      repurchasedCustomerCount: 1,
      addedWechatRate: 6 / 7,
      conversionRate: 2 / 7,
      repurchaseRate: 1 / 7,
    });
  });

  it('excludes customers recorded before the cohort date range', () => {
    const rows = filterFunnelCustomers(mockFunnelCustomers, filters);
    expect(rows.find((row) => row.id === 'C004')).toBeUndefined();
    expect(rows.find((row) => row.id === 'C005')).toBeUndefined();
  });

  it('returns null for every ratio with a zero denominator', () => {
    const [row] = buildFunnelSummaryRows([], 'total');
    expect(row).toMatchObject({
      validCustomerRate: null,
      addedWechatRate: null,
      dispatchRate: null,
      invitationRate: null,
      visitRate: null,
      conversionRate: null,
      repurchaseRate: null,
    });
  });

  it('keeps all recorded customers but calculates stages from valid customers only', () => {
    const validConverted = makeCustomer('valid-converted', 'firstConverted');
    const invalidConverted = {
      ...makeCustomer('invalid-converted', 'repurchased'),
      customerType: 'invalid' as const,
    };

    const [row] = buildFunnelSummaryRows([validConverted, invalidConverted], 'total');

    expect(row).toMatchObject({
      recordedCustomerCount: 2,
      validCustomerCount: 1,
      validCustomerRate: 1 / 2,
      addedWechatCustomerCount: 1,
      convertedCustomerCount: 1,
      repurchasedCustomerCount: 0,
      addedWechatRate: 1,
      conversionRate: 1,
      repurchaseRate: 0,
    });
  });

  it('returns null for the valid-customer rate and every stage rate without valid customers', () => {
    const invalidOnly = {
      ...makeCustomer('invalid-only', 'repurchased'),
      customerType: 'invalid' as const,
    };
    const [row] = buildFunnelSummaryRows([invalidOnly], 'total');

    expect(row).toMatchObject({
      recordedCustomerCount: 1,
      validCustomerCount: 0,
      validCustomerRate: 0,
      addedWechatCustomerCount: 0,
      repurchasedCustomerCount: 0,
      addedWechatRate: null,
      dispatchRate: null,
      invitationRate: null,
      visitRate: null,
      conversionRate: null,
      repurchaseRate: null,
    });
  });

  it('uses customer creation date for the date dimension', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      'date',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '2026-06-05')).toMatchObject({
      recordedCustomerCount: 1,
    });
  });

  it('aggregates by consultant using current status', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      'consultant',
    );
    expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
      recordedCustomerCount: 4,
      addedWechatCustomerCount: 3,
      invitedCustomerCount: 3,
      repurchasedCustomerCount: 1,
    });
  });

  it('aggregates by department correctly', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      'department',
    );
    const east = rows.find((r) => r.primaryDimensionValue === '华东一部');
    expect(east).toBeDefined();
    expect(east!.recordedCustomerCount).toBeGreaterThanOrEqual(2);
  });

  it('aggregates by channel', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      'channel',
    );
    expect(rows.find((r) => r.primaryDimensionValue === '信息流')).toBeDefined();
    expect(rows.find((r) => r.primaryDimensionValue === '私域')).toBeDefined();
  });

  it('aggregates by channel category', () => {
    const rows = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
      'channelCategory',
    );
    expect(rows.find((r) => r.primaryDimensionValue === '线上投放')).toBeDefined();
  });

  it('builds a total row', () => {
    const [row] = buildFunnelSummaryRows(
      filterFunnelCustomers(mockFunnelCustomers, filters),
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
    const rows = buildFunnelBreakdownRows(filtered, {
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
});

describe('funnel comparison', () => {
  it('attaches period-over-period comparison changes to summary rows', () => {
    const currentCustomers = [1, 2, 3].map((index) =>
      makeCustomer(`cur-${index}`, 'firstConverted'),
    );
    const comparisonCustomers = [1, 2].map((index) =>
      makeCustomer(`cmp-${index}`, 'firstConverted', '2026-05-01'),
    );

    const currentRows = buildFunnelSummaryRows(currentCustomers, 'total');
    const comparisonRows = buildFunnelSummaryRows(comparisonCustomers, 'total');

    currentRows[0] = {
      ...currentRows[0],
      recordedCustomerCount: 3,
      validCustomerRate: 0.5,
      conversionRate: 0.5,
    };
    comparisonRows[0] = {
      ...comparisonRows[0],
      recordedCustomerCount: 2,
      validCustomerRate: 0.4,
      conversionRate: 0.4,
    };

    const rows = attachFunnelComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    expect(rows[0].comparison?.recordedCustomerCount).toBe(0.5);
    expect(rows[0].comparison?.validCustomerRate).toBeCloseTo(0.25);
    expect(rows[0].comparison?.conversionRate).toBeCloseTo(0.25);
  });

  it('returns null recordedCustomerCount change when comparison has zero customers', () => {
    const currentRows = buildFunnelSummaryRows(
      [makeCustomer('cur-1', 'firstConverted')],
      'consultant',
    );
    const comparisonRows = buildFunnelSummaryRows([], 'consultant');

    const rows = attachFunnelComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    expect(rows[0].comparison?.recordedCustomerCount).toBeNull();
  });

  it('returns null recordedCustomerCount change when comparison dimension is missing', () => {
    const currentRows = buildFunnelSummaryRows(
      [makeCustomer('cur-1', 'firstConverted')],
      'consultant',
    );
    const comparisonRows = buildFunnelSummaryRows(
      [makeCustomer('cmp-1', 'firstConverted', '2026-05-01')],
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

    expect(rows[0].comparison?.recordedCustomerCount).toBeNull();
  });
});
