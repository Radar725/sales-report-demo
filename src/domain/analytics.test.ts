import { describe, expect, it } from 'vitest';
import {
  attachReportComparison,
  buildBreakdownRows,
  buildReportBreakdownRows,
  buildReportSummaryRows,
  buildSummaryRows,
  getDetailRecords,
  type ReportSummaryRow,
} from './analytics';
import { demoDealRecords, mockDeals } from '../data/mockDeals';
import {
  filterDealRecords,
  filterHistoricalRepurchaseRecords,
  type SalesDashboardFilters,
} from './filters';

describe('sales analytics aggregation', () => {
  it('builds summary rows with the expanded metric set', () => {
    const rows = buildSummaryRows(mockDeals, 'consultant');

    expect(rows[0]).toMatchObject({
      primaryDimensionValue: '张敏',
      reportedAmount: 1800000,
      confirmedAmount: 1439000,
      confirmedAmountRate: 1439000 / 1800000,
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
      newCustomerCount: 4,
      convertedNewCustomerCount: 3,
      newCustomerConversionRate: 0.75,
      newCustomerAmountContributionRate: 0.6944444444444444,
      historicalRepurchaseCustomerContributionRate: 0.2,
      historicalRepurchaseAmountContributionRate: 0.1375,
    });
  });

  it('returns an unavailable confirmation rate when reported amount is zero', () => {
    const [row] = buildSummaryRows(
      [{ ...mockDeals[0], reportedAmount: 0, confirmedAmount: 412000 }],
      'total',
    );

    expect(row).toMatchObject({
      reportedAmount: 0,
      confirmedAmount: 412000,
      confirmedAmountRate: null,
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

  it('builds one total row and returns every record in its detail scope', () => {
    const rows = buildReportSummaryRows(mockDeals, [], [], 'total');
    const records = getDetailRecords(mockDeals, {
      primaryDimension: 'total',
      primaryDimensionValue: '汇总',
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      key: 'total',
      primaryDimensionValue: '汇总',
      reportedAmount: 3490000,
      dealCount: 12,
    });
    expect(records.map((record) => record.id)).toEqual(mockDeals.map((record) => record.id));
  });

  it('returns 100 percent share and contribution rates for a single total row', () => {
    const [row] = buildReportSummaryRows(mockDeals, mockDeals, [], 'total');

    expect(row).toMatchObject({
      reportedAmountRate: 1,
      dealCountRate: 1,
      customerCountRate: 1,
      reportedAmountContributionRate: 1,
      dealCountContributionRate: 1,
      customerCountContributionRate: 1,
    });
  });

  it('calculates summary ratios against the same-dimension baseline row', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportSummaryRows(currentRecords, mockDeals, [], 'consultant');

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

  it('calculates summary contributions against all current filtered records', () => {
    const currentRecords = mockDeals.filter((record) => record.dealType === '新诊');
    const rows = buildReportSummaryRows(currentRecords, mockDeals, [], 'consultant');
    const zhangMin = rows.find((row) => row.primaryDimensionValue === '张敏')!;

    expect(zhangMin).toMatchObject({
      reportedAmountContributionRate:
        zhangMin.reportedAmount /
        currentRecords.reduce((sum, record) => sum + record.reportedAmount, 0),
      dealCountContributionRate: zhangMin.dealCount / currentRecords.length,
      customerCountContributionRate:
        zhangMin.customerCount /
        new Set(currentRecords.map((record) => record.customerId)).size,
    });
  });

  it('attaches period-over-period comparison changes to summary rows', () => {
    const baseMetrics = {
      confirmedAmount: 0,
      confirmedAmountRate: 0,
      newDiagnosisAmount: 0,
      newDiagnosisDealCount: 0,
      newDiagnosisCustomerCount: 0,
      newDiagnosisDealCountRate: 0,
      newDiagnosisCustomerRate: 0,
      newDiagnosisAmountRate: 0,
      repurchaseAmount: 0,
      repurchaseDealCount: 0,
      repurchaseCustomerCount: 0,
      repurchaseDealCountRate: 0,
      repurchaseCustomerRate: 0,
      repurchaseAmountRate: 0,
      newCustomerCount: 0,
      convertedNewCustomerCount: 0,
      newCustomerConversionRate: 0,
      newCustomerAmountContributionRate: 0,
      historicalRepurchaseCustomerContributionRate: 0,
      historicalRepurchaseAmountContributionRate: 0,
    };

    const currentRows: ReportSummaryRow[] = [
      {
        key: 'consultant:张敏',
        primaryDimensionValue: '张敏',
        reportedAmount: 15000,
        dealCount: 2,
        customerCount: 2,
        averageDealAmount: 7500,
        reportedAmountRate: 1,
        dealCountRate: 1,
        customerCountRate: 1,
        reportedAmountContributionRate: 1,
        dealCountContributionRate: 1,
        customerCountContributionRate: 1,
        ...baseMetrics,
        confirmedAmount: 10000,
        confirmedAmountRate: 0.6875,
        repurchaseCustomerTotalRate: 0.2,
        repurchaseDealCountTotalRate: 0.25,
        repurchaseAmountTotalRate: 0.3,
      },
    ];

    const comparisonRows: ReportSummaryRow[] = [
      {
        key: 'consultant:张敏',
        primaryDimensionValue: '张敏',
        reportedAmount: 12000,
        dealCount: 2,
        customerCount: 0,
        averageDealAmount: 6000,
        reportedAmountRate: 1,
        dealCountRate: 1,
        customerCountRate: null,
        reportedAmountContributionRate: 1,
        dealCountContributionRate: 1,
        customerCountContributionRate: null,
        ...baseMetrics,
        confirmedAmount: 8000,
        confirmedAmountRate: 0.625,
        repurchaseCustomerTotalRate: 0.1,
        repurchaseDealCountTotalRate: 0.5,
        repurchaseAmountTotalRate: 0.2,
      },
    ];

    const rows = attachReportComparison(
      currentRows,
      comparisonRows,
      ['2026-06-01', '2026-06-30'],
      ['2026-05-01', '2026-05-31'],
      'primaryDimensionValue',
    );

    const comparison = rows.find((row) => row.primaryDimensionValue === '张敏')?.comparison;
    expect(comparison).toMatchObject({
      reportedAmount: 0.25,
      confirmedAmount: 0.25,
      confirmedAmountRate: 0.1,
      customerCount: null,
      repurchaseCustomerTotalRate: 1,
      repurchaseDealCountTotalRate: -0.5,
    });
    expect(comparison?.repurchaseAmountTotalRate).toBeCloseTo(0.5);

    expect(
      attachReportComparison(
        [{ ...currentRows[0], repurchaseAmountTotalRate: 0.3 }],
        [{ ...comparisonRows[0], repurchaseAmountTotalRate: 0 }],
        ['2026-06-01', '2026-06-30'],
        ['2026-05-01', '2026-05-31'],
        'primaryDimensionValue',
      )[0].comparison.repurchaseAmountTotalRate,
    ).toBeNull();
  });

  it('calculates repurchase total rates from same-dimension history', () => {
    const filters: SalesDashboardFilters = {
      dateRange: ['2026-06-01', '2026-06-30'],
      comparisonDateRange: null,
      departments: [],
      consultants: ['张敏'],
      dealType: 'repurchase',
      channelCategories: [],
      channels: [],
      projectCategories: [],
      projects: [],
      customerScope: 'existingCustomers',
      customerPools: [],
      cities: [],
      institutions: [],
    };
    const current = filterDealRecords(demoDealRecords, filters);
    const history = filterHistoricalRepurchaseRecords(demoDealRecords, filters);
    const [row] = buildReportSummaryRows(current, mockDeals, history, 'consultant');

    expect(row).toMatchObject({
      repurchaseCustomerTotalRate:
        new Set(current.map((r) => r.customerId)).size /
        new Set(history.map((r) => r.customerId)).size,
      repurchaseDealCountTotalRate: current.length / history.length,
      repurchaseAmountTotalRate:
        current.reduce((sum, r) => sum + r.reportedAmount, 0) /
        history.reduce((sum, r) => sum + r.reportedAmount, 0),
    });
  });

  it('calculates repurchase total rates in breakdown rows from same-dimension history', () => {
    const filters: SalesDashboardFilters = {
      dateRange: ['2026-06-01', '2026-06-30'],
      comparisonDateRange: null,
      departments: [],
      consultants: ['张敏'],
      dealType: 'repurchase',
      channelCategories: [],
      channels: [],
      projectCategories: [],
      projects: [],
      customerScope: 'existingCustomers',
      customerPools: [],
      cities: [],
      institutions: [],
    };
    const current = filterDealRecords(demoDealRecords, filters);
    const history = filterHistoricalRepurchaseRecords(demoDealRecords, filters);
    const rows = buildReportBreakdownRows(current, mockDeals, history, {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });

    const channel = rows[0].breakdownDimensionValue;
    const currentChannel = current.filter((record) => record.channel === channel);
    const historyChannel = history.filter((record) => record.channel === channel);

    expect(rows[0]).toMatchObject({
      repurchaseCustomerTotalRate:
        new Set(currentChannel.map((r) => r.customerId)).size /
        new Set(historyChannel.map((r) => r.customerId)).size,
      repurchaseDealCountTotalRate: currentChannel.length / historyChannel.length,
      repurchaseAmountTotalRate:
        currentChannel.reduce((sum, r) => sum + r.reportedAmount, 0) /
        historyChannel.reduce((sum, r) => sum + r.reportedAmount, 0),
    });
  });

  it('returns null repurchase total rates when historical records are empty', () => {
    const filters: SalesDashboardFilters = {
      dateRange: ['2026-06-01', '2026-06-30'],
      comparisonDateRange: null,
      departments: [],
      consultants: ['张敏'],
      dealType: 'repurchase',
      channelCategories: [],
      channels: [],
      projectCategories: [],
      projects: [],
      customerScope: 'existingCustomers',
      customerPools: [],
      cities: [],
      institutions: [],
    };
    const current = filterDealRecords(demoDealRecords, filters);
    const [row] = buildReportSummaryRows(current, mockDeals, [], 'consultant');

    expect(row).toMatchObject({
      repurchaseCustomerTotalRate: null,
      repurchaseDealCountTotalRate: null,
      repurchaseAmountTotalRate: null,
    });
  });

  it('calculates breakdown contributions against its selected primary row', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportBreakdownRows(currentRecords, mockDeals, [], {
      primaryDimension: 'consultant',
      primaryDimensionValue: '张敏',
      breakdownDimension: 'channel',
    });
    const channel = rows.find((row) => row.breakdownDimensionValue === '信息流')!;

    expect(channel).toMatchObject({
      reportedAmountContributionRate:
        channel.reportedAmount /
        currentRecords.reduce((sum, record) => sum + record.reportedAmount, 0),
      dealCountContributionRate: channel.dealCount / currentRecords.length,
      customerCountContributionRate:
        channel.customerCount /
        new Set(currentRecords.map((record) => record.customerId)).size,
    });
  });

  it('calculates breakdown ratios against the same primary and breakdown dimensions', () => {
    const currentRecords = mockDeals.filter(
      (record) => record.consultant === '张敏' && record.dealType === '新诊',
    );
    const rows = buildReportBreakdownRows(currentRecords, mockDeals, [], {
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
