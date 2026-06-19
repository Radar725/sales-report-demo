import { describe, expect, it } from 'vitest';
import { mockDeals } from '../data/mockDeals';
import { buildTreeData, createBaselineFilters, filterDealRecords, getFilterOptions, type SalesDashboardFilters } from './filters';

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
  customerPools: [],
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

  it('filters to old customers', () => {
    const rows = filterDealRecords(mockDeals, {
      ...defaultFilters,
      customerScope: 'existingCustomers',
    });

    expect(rows).toHaveLength(4);
    expect(rows.every((record) => !record.customerCreatedInPeriod)).toBe(true);
  });

  it('creates baseline filters by clearing only customer scope and deal type', () => {
    const filters = {
      ...defaultFilters,
      departments: ['华东一部'],
      customerScope: 'currentNewCustomers' as const,
      dealType: 'newDiagnosis' as const,
    };

    expect(createBaselineFilters(filters)).toEqual({
      ...filters,
      customerScope: 'all',
      dealType: 'all',
    });
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

  it('returns customer pool options from all records', () => {
    const options = getFilterOptions(mockDeals);

    expect(options.customerPools).toEqual(
      expect.arrayContaining(['高客单价池', '普通客户池', '复购客户池']),
    );
  });

  describe('buildTreeData', () => {
    it('builds consultant tree keyed by department', () => {
      const { consultantTree } = buildTreeData(mockDeals);

      const deptNames = consultantTree.map((n) => n.title);
      expect(deptNames).toEqual(['华东一部', '华南一部']);

      const huadong = consultantTree.find((n) => n.title === '华东一部')!;
      expect(huadong.children).toHaveLength(1);
      expect(huadong.children![0].title).toBe('张敏');

      const huanan = consultantTree.find((n) => n.title === '华南一部')!;
      expect(huanan.children).toHaveLength(1);
      expect(huanan.children![0].title).toBe('李然');
    });

    it('builds channel tree keyed by channelCategory', () => {
      const { channelTree } = buildTreeData(mockDeals);

      const catNames = channelTree.map((n) => n.title);
      expect(catNames).toContain('线上投放');
      expect(catNames).toContain('私域运营');

      const onlineAd = channelTree.find((n) => n.title === '线上投放')!;
      const childNames = onlineAd.children!.map((c) => c.title);
      expect(childNames).toContain('信息流');
    });

    it('builds project tree keyed by projectCategory', () => {
      const { projectTree } = buildTreeData(mockDeals);

      const catNames = projectTree.map((n) => n.title);
      expect(catNames).toContain('高端咨询');
      expect(catNames).toContain('专项服务');

      const premium = projectTree.find((n) => n.title === '高端咨询')!;
      expect(premium.children![0].title).toBe('年度管理咨询包');
    });

    it('builds city tree keyed by city', () => {
      const { cityTree } = buildTreeData(mockDeals);

      const cityNames = cityTree.map((n) => n.title);
      expect(cityNames).toContain('上海');
      expect(cityNames).toContain('杭州');

      const shanghai = cityTree.find((n) => n.title === '上海')!;
      expect(shanghai.children![0].title).toBe('上海中心');
    });

    it('sorts tree nodes alphabetically by Chinese locale', () => {
      const { cityTree } = buildTreeData(mockDeals);
      const names = cityTree.map((n) => n.title);
      // Chinese locale sort: 广州 < 杭州 < 南京 < 上海 < 深圳
      expect(names).toEqual(['广州', '杭州', '南京', '上海', '深圳']);
    });

    it('returns empty trees for empty records', () => {
      const { consultantTree, channelTree, projectTree, cityTree } = buildTreeData([]);
      expect(consultantTree).toHaveLength(0);
      expect(channelTree).toHaveLength(0);
      expect(projectTree).toHaveLength(0);
      expect(cityTree).toHaveLength(0);
    });
  });
});
