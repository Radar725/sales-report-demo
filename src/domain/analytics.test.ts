import { describe, expect, it } from 'vitest';
import {
  buildBreakdownRows,
  buildDashboardSummary,
  buildReportBreakdownRows,
  buildReportSummaryRows,
  buildSummaryRows,
  getDetailRecords,
} from './analytics';
import { mockDeals } from '../data/mockDeals';

describe('sales analytics aggregation', () => {
  it('builds summary rows with the expanded metric set', () => {
    const rows = buildSummaryRows(mockDeals, 'consultant');

    expect(rows[0]).toMatchObject({
      primaryDimensionValue: '张敏',
      reportedAmount: 1800000,
      confirmedAmount: 1439000,
      dealCount: 5,
      customerCount: 4,
      averageDealAmount: 360000,
      newDiagnosisAmount: 1250000,
      newDiagnosisDealCount: 3,
      newDiagnosisCustomerCount: 3,
      newDiagnosisDealCountRate: 0.6,
      newDiagnosisCustomerRate: 0.75,
      newDiagnosisAmountRate: 0.6944444444444444,
      repurchaseAmount: 550000,
      repurchaseDealCount: 2,
      repurchaseCustomerCount: 2,
      repurchaseDealCountRate: 0.4,
      repurchaseCustomerRate: 0.5,
      repurchaseAmountRate: 0.3055555555555556,
      newCustomerConversionRate: 0.75,
      newCustomerAmountContributionRate: 0.6944444444444444,
      historicalRepurchaseCustomerContributionRate: 0.2,
      historicalRepurchaseAmountContributionRate: 0.1375,
    });
  });

  it('builds breakdown rows with the same expanded metric set', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows[0]).toMatchObject({
      key: 'channel:信息流',
      breakdownDimensionValue: '信息流',
      reportedAmount: 900000,
      confirmedAmount: 824000,
      dealCount: 2,
      customerCount: 2,
      averageDealAmount: 450000,
      newDiagnosisAmount: 900000,
      repurchaseAmount: 0,
      newDiagnosisDealCountRate: 1,
      repurchaseDealCountRate: 0,
    });
  });

  it('builds summary rows by date using dealDate', () => {
    const rows = buildSummaryRows(mockDeals, 'date');

    expect(rows.map((row) => row.primaryDimensionValue)).toContain('2026-06-02');
    expect(rows.find((row) => row.primaryDimensionValue === '2026-06-02')).toMatchObject({
      reportedAmount: 450000,
      confirmedAmount: 412000,
      dealCount: 1,
    });
  });

  it('builds summary rows by project category and project', () => {
    const categoryRows = buildSummaryRows(mockDeals, 'projectCategory');
    const projectRows = buildSummaryRows(mockDeals, 'project');

    expect(categoryRows.find((row) => row.primaryDimensionValue === '高端咨询')).toMatchObject({
      reportedAmount: 1600000,
      dealCount: 3,
    });
    expect(projectRows.find((row) => row.primaryDimensionValue === '私域增长诊断')).toMatchObject({
      reportedAmount: 830000,
      dealCount: 2,
    });
  });

  it('builds breakdown rows for project category to project', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'projectCategory',
      primaryDimensionValue: '复购服务',
      breakdownDimension: 'project',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'project:客户复购提升包',
      breakdownDimensionValue: '客户复购提升包',
      reportedAmount: 650000,
      dealCount: 3,
    });
  });

  it('sorts date summary rows chronologically ascending', () => {
    const rows = buildSummaryRows(mockDeals, 'date');

    const dates = rows.map((row) => row.primaryDimensionValue);
    expect(dates).toEqual([
      '2026-06-02',
      '2026-06-05',
      '2026-06-06',
      '2026-06-09',
      '2026-06-11',
      '2026-06-13',
      '2026-06-17',
      '2026-06-20',
      '2026-06-22',
    ]);
  });

  it('builds summary rows from an already filtered record set', () => {
    const rows = buildSummaryRows(
      mockDeals.filter((record) => record.customerCreatedInPeriod),
      'consultant',
    );

    expect(rows.find((row) => row.primaryDimensionValue === '张敏')).toMatchObject({
      reportedAmount: 1250000,
      dealCount: 3,
    });
    expect(rows.find((row) => row.primaryDimensionValue === '李然')).toMatchObject({
      reportedAmount: 1350000,
      dealCount: 4,
    });
  });

  it('sorts date breakdown rows chronologically ascending', () => {
    const rows = buildBreakdownRows(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'date',
    });

    const dates = rows.map((row) => row.breakdownDimensionValue);
    expect(dates).toEqual([
      '2026-06-02',
      '2026-06-06',
      '2026-06-11',
      '2026-06-17',
      '2026-06-20',
    ]);
  });

  it('returns detail records for the selected summary row scope', () => {
    const records = getDetailRecords(mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
    });

    expect(records.map((record) => record.id)).toEqual(['D001', 'D002', 'D003', 'D004', 'D005']);
  });

  it('builds dashboard summary totals from the full filtered record set', () => {
    const summary = buildDashboardSummary(mockDeals);

    expect(summary).toMatchObject({
      reportedAmount: 3490000,
      confirmedAmount: 2971000,
      dealCount: 12,
      customerCount: 11,
      newDiagnosisAmount: 2570000,
      newDiagnosisDealCount: 7,
      newDiagnosisCustomerCount: 7,
      repurchaseAmount: 920000,
      repurchaseDealCount: 5,
      repurchaseCustomerCount: 5,
    });
  });

  it('builds zero dashboard summary for empty records', () => {
    expect(buildDashboardSummary([])).toMatchObject({
      reportedAmount: 0,
      confirmedAmount: 0,
      dealCount: 0,
      customerCount: 0,
      newDiagnosisAmount: 0,
      newDiagnosisDealCount: 0,
      newDiagnosisCustomerCount: 0,
      repurchaseAmount: 0,
      repurchaseDealCount: 0,
      repurchaseCustomerCount: 0,
    });
  });

  it('calculates summary ratios against the same-dimension baseline row', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportSummaryRows(currentRecords, mockDeals, 'consultant');

    expect(rows).toEqual([
      expect.objectContaining({
        primaryDimensionValue: '张敏',
        reportedAmount: 1250000,
        dealCount: 3,
        customerCount: 3,
        reportedAmountRate: 1250000 / 1800000,
        dealCountRate: 3 / 5,
        customerCountRate: 3 / 4,
      }),
    ]);
  });

  it('calculates breakdown ratios against the same primary and breakdown dimensions', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportBreakdownRows(currentRecords, mockDeals, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    expect(rows.find((row) => row.breakdownDimensionValue === '信息流')).toEqual(
      expect.objectContaining({
        reportedAmount: 900000,
        reportedAmountRate: 1,
        dealCountRate: 1,
        customerCountRate: 1,
      }),
    );
  });
});
