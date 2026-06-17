import type { DealRecord, DealType } from '../data/mockDeals';

export type DealTypeFilter = 'all' | 'newDiagnosis' | 'repurchase';
export type CustomerScopeFilter = 'all' | 'currentNewCustomers';

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
  cities: string[];
  institutions: string[];
};

export type FilterOptionScope = Pick<
  SalesDashboardFilters,
  'departments' | 'channelCategories' | 'projectCategories' | 'cities'
>;

export type SalesDashboardFilterOptions = {
  departments: string[];
  consultants: string[];
  channelCategories: string[];
  channels: string[];
  projectCategories: string[];
  projects: string[];
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
      (filters.customerScope === 'all' || record.customerCreatedInPeriod) &&
      isInSelection(record.city, filters.cities) &&
      isInSelection(record.institution, filters.institutions)
    );
  });
}

export function getFilterOptions(
  records: DealRecord[],
  scope: FilterOptionScope,
): SalesDashboardFilterOptions {
  const consultantRecords = records.filter((record) =>
    isInSelection(record.department, scope.departments),
  );
  const channelRecords = records.filter((record) =>
    isInSelection(record.channelCategory, scope.channelCategories),
  );
  const projectRecords = records.filter((record) =>
    isInSelection(record.projectCategory, scope.projectCategories),
  );
  const institutionRecords = records.filter((record) => isInSelection(record.city, scope.cities));

  return {
    departments: uniqueSorted(records.map((record) => record.department)),
    consultants: uniqueSorted(consultantRecords.map((record) => record.consultant)),
    channelCategories: uniqueSorted(records.map((record) => record.channelCategory)),
    channels: uniqueSorted(channelRecords.map((record) => record.channel)),
    projectCategories: uniqueSorted(records.map((record) => record.projectCategory)),
    projects: uniqueSorted(projectRecords.map((record) => record.project)),
    cities: uniqueSorted(records.map((record) => record.city)),
    institutions: uniqueSorted(institutionRecords.map((record) => record.institution)),
  };
}
