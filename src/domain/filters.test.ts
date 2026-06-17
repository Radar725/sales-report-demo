import { describe, expect, it } from 'vitest';
import { mockDeals } from '../data/mockDeals';
import { filterDealRecords, getFilterOptions, type SalesDashboardFilters } from './filters';

const defaultFilters: SalesDashboardFilters = {
  dateRange: null,
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'all',
  cities: [],
  institutions: [],
};

describe('sales dashboard filters', () => {
  it('filters by deal type', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      dealType: 'repurchase',
    });

    expect(rows).toHaveLength(4);
    expect(rows.every((record) => record.dealType === '复购')).toBe(true);
  });

  it('filters by customer statistical scope', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      customerScope: 'currentNewCustomers',
    });

    expect(rows).toHaveLength(5);
    expect(rows.every((record) => record.customerCreatedInPeriod)).toBe(true);
  });

  it('filters by selected dimensions together', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      departments: ['华东一部'],
      channelCategories: ['线上投放'],
      projectCategories: ['高端咨询'],
    });

    expect(rows.map((record) => record.id)).toEqual(['D001', 'D002']);
  });

  it('filters by inclusive date range', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      dateRange: ['2026-06-05', '2026-06-13'],
    });

    expect(rows.map((record) => record.id)).toEqual(['D002', 'D003', 'D006', 'D007', 'D008']);
  });

  it('builds dependent filter options from the current parent selection', () => {
    const options = getFilterOptions(mockDeals, {
      departments: ['华东一部'],
      channelCategories: ['私域运营'],
      projectCategories: ['专项服务'],
      cities: ['上海'],
    });

    expect(options.consultants).toEqual(['张敏']);
    expect(options.channels).toEqual(['私域']);
    expect(options.projects).toEqual(['私域增长诊断', '自然流量优化']);
    expect(options.institutions).toEqual(['上海中心']);
  });
});
