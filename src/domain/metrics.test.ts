import { describe, expect, it } from 'vitest';
import { metricGroups } from './metrics';

describe('metric column ordering', () => {
  it('pairs new-diagnosis values with their ratios', () => {
    const group = metricGroups.find((g) => g.title === '新诊成交')!;
    const keys = group.metrics.map((m) => m.key);

    expect(keys).toEqual([
      'newDiagnosisAmount',
      'newDiagnosisAmountRate',
      'newDiagnosisDealCount',
      'newDiagnosisDealCountRate',
      'newDiagnosisCustomerCount',
      'newDiagnosisCustomerRate',
    ]);
  });

  it('pairs repurchase values with their ratios', () => {
    const group = metricGroups.find((g) => g.title === '复购成交')!;
    const keys = group.metrics.map((m) => m.key);

    expect(keys).toEqual([
      'repurchaseAmount',
      'repurchaseAmountRate',
      'repurchaseDealCount',
      'repurchaseDealCountRate',
      'repurchaseCustomerCount',
      'repurchaseCustomerRate',
    ]);
  });

  it('keeps overview and conversion groups unchanged', () => {
    expect(metricGroups[0].title).toBe('业绩总览');
    expect(metricGroups[1].title).toBe('成交概况');
    expect(metricGroups[2].title).toBe('新诊成交');
    expect(metricGroups[3].title).toBe('复购成交');
  });
});
