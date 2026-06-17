import { describe, expect, it } from 'vitest';
import { buildBreakdownRows, buildSummaryRows } from './analytics';
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
});
