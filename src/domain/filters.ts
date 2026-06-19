import type { TreeSelectProps } from 'antd';
import type { DealRecord, DealType } from '../data/mockDeals';

export type DealTypeFilter = 'all' | 'newDiagnosis' | 'repurchase';
export type CustomerScopeFilter = 'all' | 'currentNewCustomers' | 'existingCustomers';

function matchesCustomerScope(record: DealRecord, customerScope: CustomerScopeFilter) {
  if (customerScope === 'all') return true;
  return customerScope === 'currentNewCustomers'
    ? record.customerCreatedInPeriod
    : !record.customerCreatedInPeriod;
}

export type SalesDashboardFilters = {
  dateRange: [string, string] | null;
  departments: string[];
  consultants: string[];
  dealType: DealTypeFilter;
  channelCategories: string[];
  channels: string[];
  projectCategories: string[];
  projects: string[];
  customerScope: CustomerScopeFilter;
  customerPools: string[];
  cities: string[];
  institutions: string[];
};

export type TreeDataNode = NonNullable<TreeSelectProps['treeData']>[number];

export type FilterTreeData = {
  consultantTree: TreeDataNode[];
  channelTree: TreeDataNode[];
  projectTree: TreeDataNode[];
  cityTree: TreeDataNode[];
};

export type SalesDashboardFilterOptions = {
  departments: string[];
  consultants: string[];
  channelCategories: string[];
  channels: string[];
  projectCategories: string[];
  projects: string[];
  customerPools: string[];
  cities: string[];
  institutions: string[];
};

function isInSelection(value: string, selection: string[]) {
  return selection.length === 0 || selection.includes(value);
}

function matchesDealType(record: DealRecord, dealType: DealTypeFilter) {
  const dealTypeByFilter: Record<Exclude<DealTypeFilter, 'all'>, DealType> = {
    newDiagnosis: '新诊',
    repurchase: '复购',
  };

  return dealType === 'all' || record.dealType === dealTypeByFilter[dealType];
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
}

export function buildTreeData(records: DealRecord[]): FilterTreeData {
  const deptMap = new Map<string, Set<string>>();
  const channelCatMap = new Map<string, Set<string>>();
  const projectCatMap = new Map<string, Set<string>>();
  const cityMap = new Map<string, Set<string>>();

  for (const r of records) {
    if (!deptMap.has(r.department)) deptMap.set(r.department, new Set());
    deptMap.get(r.department)!.add(r.consultant);

    if (!channelCatMap.has(r.channelCategory)) channelCatMap.set(r.channelCategory, new Set());
    channelCatMap.get(r.channelCategory)!.add(r.channel);

    if (!projectCatMap.has(r.projectCategory)) projectCatMap.set(r.projectCategory, new Set());
    projectCatMap.get(r.projectCategory)!.add(r.project);

    if (!cityMap.has(r.city)) cityMap.set(r.city, new Set());
    cityMap.get(r.city)!.add(r.institution);
  }

  function toTree(map: Map<string, Set<string>>): TreeDataNode[] {
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'zh-Hans-CN'))
      .map(([parent, children]) => ({
        title: parent,
        value: parent,
        children: [...children]
          .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
          .map((child) => ({ title: child, value: child })),
      }));
  }

  return {
    consultantTree: toTree(deptMap),
    channelTree: toTree(channelCatMap),
    projectTree: toTree(projectCatMap),
    cityTree: toTree(cityMap),
  };
}

export function filterDealRecords(records: DealRecord[], filters: SalesDashboardFilters) {
  return records.filter((record) => {
    const matchesDateRange =
      filters.dateRange === null ||
      (record.dealDate >= filters.dateRange[0] && record.dealDate <= filters.dateRange[1]);

    return (
      matchesDateRange &&
      isInSelection(record.department, filters.departments) &&
      isInSelection(record.consultant, filters.consultants) &&
      matchesDealType(record, filters.dealType) &&
      isInSelection(record.channelCategory, filters.channelCategories) &&
      isInSelection(record.channel, filters.channels) &&
      isInSelection(record.projectCategory, filters.projectCategories) &&
      isInSelection(record.project, filters.projects) &&
      matchesCustomerScope(record, filters.customerScope) &&
      isInSelection(record.customerPool, filters.customerPools) &&
      isInSelection(record.city, filters.cities) &&
      isInSelection(record.institution, filters.institutions)
    );
  });
}

export function getFilterOptions(
  records: DealRecord[],
): Pick<SalesDashboardFilterOptions, 'customerPools'> {
  return {
    customerPools: uniqueSorted(records.map((record) => record.customerPool)),
  };
}

export function createBaselineFilters(filters: SalesDashboardFilters): SalesDashboardFilters {
  return { ...filters, customerScope: 'all', dealType: 'all' };
}
