import type { TreeSelectProps } from 'antd';
import type {
  FunnelCustomerRecord,
  FunnelCustomerStatus,
} from '../data/mockFunnelCustomers';
import type { Dimension, DimensionKey } from './dimensions';
import { calculateChange, getDateComparisonKey } from './comparison';

export type FunnelDimensionKey =
  | 'total'
  | 'date'
  | 'department'
  | 'consultant'
  | 'channelCategory'
  | 'channel';

export type FunnelFilters = {
  dateRange: [string, string] | null;
  comparisonDateRange: [string, string] | null;
  departments: string[];
  consultants: string[];
  channelCategories: string[];
  channels: string[];
  customerPools: string[];
};

export type FunnelSummaryRow = {
  key: string;
  primaryDimensionValue: string;
  recordedCustomerCount: number;
  validCustomerCount: number;
  addedWechatCustomerCount: number;
  dispatchedCustomerCount: number;
  invitedCustomerCount: number;
  visitedCustomerCount: number;
  convertedCustomerCount: number;
  repurchasedCustomerCount: number;
  validCustomerRate: number | null;
  addedWechatRate: number | null;
  dispatchRate: number | null;
  invitationRate: number | null;
  visitRate: number | null;
  conversionRate: number | null;
  repurchaseRate: number | null;
};

export type FunnelMetricKey =
  | 'recordedCustomerCount'
  | 'validCustomerCount'
  | 'addedWechatCustomerCount'
  | 'dispatchedCustomerCount'
  | 'invitedCustomerCount'
  | 'visitedCustomerCount'
  | 'convertedCustomerCount'
  | 'repurchasedCustomerCount'
  | 'validCustomerRate'
  | 'addedWechatRate'
  | 'dispatchRate'
  | 'invitationRate'
  | 'visitRate'
  | 'conversionRate'
  | 'repurchaseRate';

export type FunnelComparisonValues = Partial<Record<FunnelMetricKey, number | null>>;

export type FunnelBreakdownRow = {
  key: string;
  breakdownDimensionValue: string;
  recordedCustomerCount: number;
  validCustomerCount: number;
  addedWechatCustomerCount: number;
  dispatchedCustomerCount: number;
  invitedCustomerCount: number;
  visitedCustomerCount: number;
  convertedCustomerCount: number;
  repurchasedCustomerCount: number;
  validCustomerRate: number | null;
  addedWechatRate: number | null;
  dispatchRate: number | null;
  invitationRate: number | null;
  visitRate: number | null;
  conversionRate: number | null;
  repurchaseRate: number | null;
};

export type FunnelComparableSummaryRow = FunnelSummaryRow & {
  comparison: FunnelComparisonValues;
};

export type FunnelComparableBreakdownRow = FunnelBreakdownRow & {
  comparison: FunnelComparisonValues;
};

type FunnelBreakdownQuery = {
  primaryDimension: FunnelDimensionKey;
  primaryDimensionValue: string;
  breakdownDimension: FunnelDimensionKey;
};

export type FunnelTreeDataNode = NonNullable<TreeSelectProps['treeData']>[number];

export type FunnelTreeData = {
  consultantTree: FunnelTreeDataNode[];
  channelTree: FunnelTreeDataNode[];
};

const statusLevel: Record<FunnelCustomerStatus, number> = {
  pendingWechat: 0,
  wechatAdded: 1,
  dispatched: 2,
  invited: 3,
  visited: 4,
  firstConverted: 5,
  repurchased: 6,
};

function hasReached(record: FunnelCustomerRecord, target: FunnelCustomerStatus) {
  return statusLevel[record.status] >= statusLevel[target];
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

function countReached(customers: FunnelCustomerRecord[], target: FunnelCustomerStatus) {
  const ids = new Set<string>();
  for (const customer of customers) {
    if (hasReached(customer, target)) {
      ids.add(customer.id);
    }
  }
  return ids.size;
}

function countAll(customers: FunnelCustomerRecord[]) {
  const ids = new Set<string>();
  for (const customer of customers) {
    ids.add(customer.id);
  }
  return ids.size;
}

function calculateFunnelMetrics(customers: FunnelCustomerRecord[]) {
  const recordedCustomerCount = countAll(customers);
  const validCustomers = customers.filter((customer) => customer.customerType === 'valid');
  const validCustomerCount = countAll(validCustomers);
  const addedWechatCustomerCount = countReached(validCustomers, 'wechatAdded');
  const dispatchedCustomerCount = countReached(validCustomers, 'dispatched');
  const invitedCustomerCount = countReached(validCustomers, 'invited');
  const visitedCustomerCount = countReached(validCustomers, 'visited');
  const convertedCustomerCount = countReached(validCustomers, 'firstConverted');
  const repurchasedCustomerCount = countReached(validCustomers, 'repurchased');

  return {
    recordedCustomerCount,
    validCustomerCount,
    addedWechatCustomerCount,
    dispatchedCustomerCount,
    invitedCustomerCount,
    visitedCustomerCount,
    convertedCustomerCount,
    repurchasedCustomerCount,
    validCustomerRate: ratio(validCustomerCount, recordedCustomerCount),
    addedWechatRate: ratio(addedWechatCustomerCount, validCustomerCount),
    dispatchRate: ratio(dispatchedCustomerCount, validCustomerCount),
    invitationRate: ratio(invitedCustomerCount, validCustomerCount),
    visitRate: ratio(visitedCustomerCount, validCustomerCount),
    conversionRate: ratio(convertedCustomerCount, validCustomerCount),
    repurchaseRate: ratio(repurchasedCustomerCount, validCustomerCount),
  };
}

export function filterFunnelCustomers(
  records: FunnelCustomerRecord[],
  filters: FunnelFilters,
): FunnelCustomerRecord[] {
  return records.filter((record) => {
    if (filters.dateRange) {
      if (
        record.customerCreatedAt < filters.dateRange[0] ||
        record.customerCreatedAt > filters.dateRange[1]
      ) {
        return false;
      }
    }

    if (
      filters.departments.length > 0 &&
      !filters.departments.includes(record.department)
    ) {
      return false;
    }
    if (
      filters.consultants.length > 0 &&
      !filters.consultants.includes(record.consultant)
    ) {
      return false;
    }

    if (
      filters.channelCategories.length > 0 &&
      !filters.channelCategories.includes(record.channelCategory)
    ) {
      return false;
    }
    if (
      filters.channels.length > 0 &&
      !filters.channels.includes(record.channel)
    ) {
      return false;
    }

    if (
      filters.customerPools.length > 0 &&
      !filters.customerPools.includes(record.customerPool)
    ) {
      return false;
    }

    return true;
  });
}

function getFunnelDimensionValue(record: FunnelCustomerRecord, dimension: FunnelDimensionKey) {
  if (dimension === 'total') return '汇总';
  if (dimension === 'date') return record.customerCreatedAt;
  return record[dimension as keyof FunnelCustomerRecord] as string;
}

function getFunnelRowKey(dimension: FunnelDimensionKey, value: string) {
  return dimension === 'total' ? 'total' : `${dimension}:${value}`;
}

export function buildFunnelSummaryRows(
  records: FunnelCustomerRecord[],
  dimension: FunnelDimensionKey,
): FunnelSummaryRow[] {
  if (dimension === 'total') {
    const metrics = calculateFunnelMetrics(records);
    return [
      {
        key: 'total',
        primaryDimensionValue: '汇总',
        ...metrics,
      },
    ];
  }

  const groups = new Map<string, FunnelCustomerRecord[]>();
  for (const record of records) {
    const value = getFunnelDimensionValue(record, dimension);
    const current = groups.get(value) ?? [];
    current.push(record);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, groupRecords]) => ({
      key: getFunnelRowKey(dimension, value),
      primaryDimensionValue: value,
      ...calculateFunnelMetrics(groupRecords),
    }))
    .sort((left, right) => {
      if (dimension === 'date') {
        return left.primaryDimensionValue.localeCompare(right.primaryDimensionValue);
      }
      return right.recordedCustomerCount - left.recordedCustomerCount;
    });
}

export function buildFunnelBreakdownRows(
  records: FunnelCustomerRecord[],
  query: FunnelBreakdownQuery,
): FunnelBreakdownRow[] {
  const scopedRecords = records.filter(
    (record) =>
      getFunnelDimensionValue(record, query.primaryDimension) ===
      query.primaryDimensionValue,
  );

  if (query.breakdownDimension === 'total') {
    return [];
  }

  const groups = new Map<string, FunnelCustomerRecord[]>();
  for (const record of scopedRecords) {
    const value = getFunnelDimensionValue(record, query.breakdownDimension);
    const current = groups.get(value) ?? [];
    current.push(record);
    groups.set(value, current);
  }

  return [...groups.entries()]
    .map(([value, groupRecords]) => ({
      key: getFunnelRowKey(query.breakdownDimension, value),
      breakdownDimensionValue: value,
      ...calculateFunnelMetrics(groupRecords),
    }))
    .sort((left, right) => {
      if (query.breakdownDimension === 'date') {
        return left.breakdownDimensionValue.localeCompare(right.breakdownDimensionValue);
      }
      return right.recordedCustomerCount - left.recordedCustomerCount;
    });
}

const FUNNEL_METRIC_KEYS: FunnelMetricKey[] = [
  'recordedCustomerCount',
  'validCustomerCount',
  'addedWechatCustomerCount',
  'dispatchedCustomerCount',
  'invitedCustomerCount',
  'visitedCustomerCount',
  'convertedCustomerCount',
  'repurchasedCustomerCount',
  'validCustomerRate',
  'addedWechatRate',
  'dispatchRate',
  'invitationRate',
  'visitRate',
  'conversionRate',
  'repurchaseRate',
];

function isDateDimensionValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getComparisonLookupKey(value: string, isDateDimension: boolean) {
  return isDateDimension ? getDateComparisonKey(value) : value;
}

function getFunnelRowDimensionValue(
  row: FunnelSummaryRow | FunnelBreakdownRow,
  valueKey: 'primaryDimensionValue' | 'breakdownDimensionValue',
) {
  return valueKey === 'primaryDimensionValue'
    ? (row as FunnelSummaryRow).primaryDimensionValue
    : (row as FunnelBreakdownRow).breakdownDimensionValue;
}

function buildFunnelComparisonValues<T extends FunnelSummaryRow | FunnelBreakdownRow>(
  currentRow: T,
  comparisonRow: T | undefined,
): FunnelComparisonValues {
  return Object.fromEntries(
    FUNNEL_METRIC_KEYS.map((key) => [
      key,
      calculateChange(currentRow[key], comparisonRow?.[key] ?? null),
    ]),
  ) as FunnelComparisonValues;
}

export function attachFunnelComparison<T extends FunnelSummaryRow | FunnelBreakdownRow>(
  currentRows: T[],
  comparisonRows: T[],
  _currentRange: [string, string],
  _comparisonRange: [string, string],
  valueKey: 'primaryDimensionValue' | 'breakdownDimensionValue',
): Array<T & { comparison: FunnelComparisonValues }> {
  const sampleValue =
    (currentRows[0] && getFunnelRowDimensionValue(currentRows[0], valueKey)) ??
    (comparisonRows[0] && getFunnelRowDimensionValue(comparisonRows[0], valueKey));
  const isDateDimension =
    sampleValue !== undefined && isDateDimensionValue(sampleValue);

  const comparisonByKey = new Map(
    comparisonRows.map((row) => [
      getComparisonLookupKey(getFunnelRowDimensionValue(row, valueKey), isDateDimension),
      row,
    ]),
  );

  return currentRows.map((currentRow) => ({
    ...currentRow,
    comparison: buildFunnelComparisonValues(
      currentRow,
      comparisonByKey.get(
        getComparisonLookupKey(getFunnelRowDimensionValue(currentRow, valueKey), isDateDimension),
      ),
    ),
  }));
}

const funnelDimensions: Dimension[] = [
  { key: 'total', label: '汇总', group: 'total' },
  { key: 'date', label: '日期', group: 'time' },
  { key: 'department', label: '部门', group: 'org', level: 1 },
  { key: 'consultant', label: '咨询师', group: 'org', level: 2 },
  { key: 'channelCategory', label: '渠道分类', group: 'source', level: 1 },
  { key: 'channel', label: '渠道', group: 'source', level: 2 },
];

function canBreakDown(
  primaryDimension: Dimension,
  breakdownDimension: Dimension,
): boolean {
  if (
    primaryDimension.key === breakdownDimension.key ||
    breakdownDimension.key === 'total'
  ) {
    return false;
  }

  if (primaryDimension.group !== breakdownDimension.group) {
    return true;
  }

  if (
    primaryDimension.level === undefined ||
    breakdownDimension.level === undefined
  ) {
    return false;
  }

  return primaryDimension.level < breakdownDimension.level;
}

export function getFunnelBreakdownDimensions(
  primaryKey: FunnelDimensionKey,
): Dimension[] {
  if (primaryKey === 'total') {
    return [];
  }

  const primaryDimension = funnelDimensions.find((d) => d.key === primaryKey)!;
  return funnelDimensions.filter((dimension) =>
    canBreakDown(primaryDimension, dimension),
  );
}

function uniqueSorted(values: string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'));
}

export function getFunnelFilterOptions(records: FunnelCustomerRecord[]) {
  return {
    customerPools: uniqueSorted(records.map((record) => record.customerPool)),
  };
}

export function buildFunnelTreeData(
  records: FunnelCustomerRecord[],
): FunnelTreeData {
  const deptMap = new Map<string, Set<string>>();
  const channelCatMap = new Map<string, Set<string>>();

  for (const r of records) {
    if (!deptMap.has(r.department)) deptMap.set(r.department, new Set());
    deptMap.get(r.department)!.add(r.consultant);

    if (!channelCatMap.has(r.channelCategory))
      channelCatMap.set(r.channelCategory, new Set());
    channelCatMap.get(r.channelCategory)!.add(r.channel);
  }

  function toTree(map: Map<string, Set<string>>): FunnelTreeDataNode[] {
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
  };
}
