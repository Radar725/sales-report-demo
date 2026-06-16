export type DimensionGroup = 'org' | 'source' | 'location';

export type DimensionKey =
  | 'consultant'
  | 'department'
  | 'channel'
  | 'channelCategory'
  | 'institution'
  | 'city';

export type Dimension = {
  key: DimensionKey;
  label: string;
  group: DimensionGroup;
};

export const dimensions: Dimension[] = [
  { key: 'consultant', label: '咨询师', group: 'org' },
  { key: 'department', label: '部门', group: 'org' },
  { key: 'channel', label: '渠道', group: 'source' },
  { key: 'channelCategory', label: '渠道分类', group: 'source' },
  { key: 'institution', label: '机构', group: 'location' },
  { key: 'city', label: '城市', group: 'location' },
];

export function getDimension(key: DimensionKey) {
  return dimensions.find((dimension) => dimension.key === key)!;
}

export function getBreakdownDimensions(primaryKey: DimensionKey) {
  const primaryDimension = getDimension(primaryKey);
  return dimensions.filter((dimension) => dimension.group !== primaryDimension.group);
}
