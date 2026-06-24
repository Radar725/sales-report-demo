import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReportSummaryRows } from './analytics';
import { mockDeals } from '../data/mockDeals';
import { exportPerformanceSummary } from './exportExcel';
import * as downloadBlobModule from '../utils/downloadBlob';

const [sampleRow] = buildReportSummaryRows(mockDeals, [], [], 'total');

describe('exportExcel', () => {
  beforeEach(() => {
    vi.spyOn(downloadBlobModule, 'downloadBlob').mockImplementation(() => {});
  });

  it('exports performance summary with primary dimension and metric headers', () => {
    exportPerformanceSummary([sampleRow], '汇总', { customerScope: 'all', dealType: 'all' });

    expect(downloadBlobModule.downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlobModule.downloadBlob).mock.calls[0];
    expect(filename).toBe('业绩报表-维度数据.xlsx');
    expect(blob).toBeInstanceOf(Blob);
  });
});
