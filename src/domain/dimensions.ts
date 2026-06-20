export type DimensionGroup = 'total' | 'time' | 'org' | 'source' | 'location' | 'project';

export type DimensionKey =
  | 'total'
  | 'date'
  | 'department'
  | 'consultant'
  | 'channelCategory'
  | 'channel'
  | 'city'
  | 'institution'
  | 'projectCategory'
  | 'project';

export type Dimension = {
  key: DimensionKey;
  label: string;
  group: DimensionGroup;
  level?: number;
};

export type RecordDimensionKey = Exclude<DimensionKey, 'date' | 'total'>;

export const dimensions: Dimension[] = [
  { key: 'total', label: '汇总', group: 'total' },
  { key: 'date', label: '日期', group: 'time' },
  { key: 'department', label: '部门', group: 'org', level: 1 },
  { key: 'consultant', label: '咨询师', group: 'org', level: 2 },
  { key: 'channelCategory', label: '渠道分类', group: 'source', level: 1 },
  { key: 'channel', label: '渠道', group: 'source', level: 2 },
  { key: 'city', label: '城市', group: 'location', level: 1 },
  { key: 'institution', label: '机构', group: 'location', level: 2 },
  { key: 'projectCategory', label: '项目分类', group: 'project', level: 1 },
  { key: 'project', label: '项目', group: 'project', level: 2 },
];

export function getDimension(key: DimensionKey) {
  return dimensions.find((dimension) => dimension.key === key)!;
}

function canBreakDown(primaryDimension: Dimension, breakdownDimension: Dimension) {
  if (primaryDimension.key === breakdownDimension.key || breakdownDimension.key === 'total') {
    return false;
  }

  if (primaryDimension.group !== breakdownDimension.group) {
    return true;
  }

  if (primaryDimension.level === undefined || breakdownDimension.level === undefined) {
    return false;
  }

  return primaryDimension.level < breakdownDimension.level;
}

export function getBreakdownDimensions(primaryKey: DimensionKey) {
  if (primaryKey === 'total') {
    return [];
  }

  const primaryDimension = getDimension(primaryKey);
  return dimensions.filter((dimension) => canBreakDown(primaryDimension, dimension));
}
