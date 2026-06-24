import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPerformanceSummary } from './exportExcel';
import * as downloadBlobModule from '../utils/downloadBlob';

const sampleRow = {
  key: 'total',
  primaryDimensionValue: '汇总',
  reportedAmount: 1000,
  confirmedAmount: 800,
  confirmedAmountRate: 0.8,
  dealCount: 2,
  customerCount: 2,
  averageDealAmount: 500,
  reportedAmountRate: null,
  dealCountRate: null,
  customerCountRate: null,
  reportedAmountContributionRate: 1,
  dealCountContributionRate: 1,
  customerCountContributionRate: 1,
  repurchaseCustomerTotalRate: null,
  repurchaseDealCountTotalRate: null,
  repurchaseAmountTotalRate: null,
};

describe('exportExcel', () => {
  beforeEach(() => {
    vi.spyOn(downloadBlobModule, 'downloadBlob').mockImplementation(() => {});
  });

  it('exports performance summary with primary dimension and metric headers', () => {
    exportPerformanceSummary([sampleRow], '汇总', { customerScope: 'all', dealType: 'all' });

    expect(downloadBlobModule.downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = downloadBlobModule.downloadBlob.mock.calls[0];
    expect(filename).toBe('业绩报表-维度数据.xlsx');
    expect(blob).toBeInstanceOf(Blob);
  });
});
