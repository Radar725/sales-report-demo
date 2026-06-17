import { describe, expect, it } from 'vitest';
import { dimensions, getBreakdownDimensions } from './dimensions';

function breakdownLabels(primaryKey: Parameters<typeof getBreakdownDimensions>[0]) {
  return getBreakdownDimensions(primaryKey).map((dimension) => dimension.label);
}

function breakdownKeys(primaryKey: Parameters<typeof getBreakdownDimensions>[0]) {
  return getBreakdownDimensions(primaryKey).map((dimension) => dimension.key);
}

describe('dimension rules', () => {
  it('lists all supported primary dimensions', () => {
    expect(dimensions.map((dimension) => dimension.label)).toEqual([
      '日期',
      '部门',
      '咨询师',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });

  it('allows parent dimensions to break down into child dimensions', () => {
    expect(breakdownKeys('department')).toContain('consultant');
    expect(breakdownKeys('channelCategory')).toContain('channel');
    expect(breakdownKeys('city')).toContain('institution');
    expect(breakdownKeys('projectCategory')).toContain('project');
  });

  it('does not allow child dimensions to break down into parent dimensions', () => {
    expect(breakdownKeys('consultant')).not.toContain('department');
    expect(breakdownKeys('channel')).not.toContain('channelCategory');
    expect(breakdownKeys('institution')).not.toContain('city');
    expect(breakdownKeys('project')).not.toContain('projectCategory');
  });

  it('keeps cross-group breakdown dimensions available', () => {
    expect(breakdownLabels('consultant')).toEqual([
      '日期',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });

  it('allows date to break down by every business dimension but not itself', () => {
    expect(breakdownLabels('date')).toEqual([
      '部门',
      '咨询师',
      '渠道分类',
      '渠道',
      '城市',
      '机构',
      '项目分类',
      '项目',
    ]);
  });
});
