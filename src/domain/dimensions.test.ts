import { describe, expect, it } from 'vitest';
import { dimensions, getBreakdownDimensions } from './dimensions';

describe('dimension rules', () => {
  it('lists all supported primary dimensions', () => {
    expect(dimensions.map((dimension) => dimension.label)).toEqual([
      '咨询师',
      '部门',
      '渠道',
      '渠道分类',
      '机构',
      '城市',
    ]);
  });

  it('allows consultant to break down by source and location dimensions', () => {
    expect(getBreakdownDimensions('consultant').map((dimension) => dimension.label)).toEqual([
      '渠道',
      '渠道分类',
      '机构',
      '城市',
    ]);
  });

  it('does not allow dimensions from the same group', () => {
    expect(getBreakdownDimensions('consultant').map((dimension) => dimension.key)).not.toContain('department');
    expect(getBreakdownDimensions('channel').map((dimension) => dimension.key)).not.toContain('channelCategory');
    expect(getBreakdownDimensions('institution').map((dimension) => dimension.key)).not.toContain('city');
  });
});
