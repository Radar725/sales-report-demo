import { describe, expect, it } from 'vitest';
import { buildBreakdownRows, buildSummaryRows } from './analytics';
import { mockDeals } from '../data/mockDeals';

describe('sales analytics aggregation', () => {
  it('builds summary rows by primary dimension', () => {
    const rows = buildSummaryRows(mockDeals, 'consultant');

    expect(rows[0]).toMatchObject({
      primaryDimensionValue: '张敏',
      customerCount: 4,
      totalAmount: 1439000,
    });
    expect(rows[1]).toMatchObject({
      primaryDimensionValue: '李然',
      customerCount: 4,
      totalAmount: 1332000,
    });
  });

  it('builds breakdown rows for one selected primary object', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows).toEqual([
      {
        key: 'channel:信息流',
        breakdownDimensionValue: '信息流',
        customerCount: 2,
        totalAmount: 824000,
      },
      {
        key: 'channel:私域',
        breakdownDimensionValue: '私域',
        customerCount: 1,
        totalAmount: 318000,
      },
      {
        key: 'channel:转介绍',
        breakdownDimensionValue: '转介绍',
        customerCount: 1,
        totalAmount: 186000,
      },
      {
        key: 'channel:自然流量',
        breakdownDimensionValue: '自然流量',
        customerCount: 1,
        totalAmount: 111000,
      },
    ]);
  });
});
