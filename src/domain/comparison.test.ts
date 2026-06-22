import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import { calculateChange, getDefaultComparisonDateRange } from './comparison';

describe('comparison period helpers', () => {
  it('uses the last day of February for a March 31 default', () => {
    expect(getDefaultComparisonDateRange(dayjs('2026-03-31'))).toEqual([
      '2026-02-01',
      '2026-02-28',
    ]);
  });

  it('returns null when comparison is zero or absent', () => {
    expect(calculateChange(12, 0)).toBeNull();
    expect(calculateChange(12, null)).toBeNull();
    expect(calculateChange(0, 10)).toBe(-1);
  });
});
