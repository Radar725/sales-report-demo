import '../test/spyAntdTable';
import { render } from '@testing-library/react';
import { beforeEach, describe, it } from 'vitest';
import { expectReportTablesUseSorterIconTooltip, tableRenderSpy } from '../test/spyAntdTable';
import BreakdownDrawer from './BreakdownDrawer';

const summaryRow = {
  key: 'consultant:张敏',
  primaryDimensionValue: '张敏',
  reportedAmount: 12000,
  confirmedAmount: 9600,
  confirmedAmountRate: 0.8,
  dealCount: 2,
  customerCount: 2,
  averageDealAmount: 6000,
  reportedAmountRate: 1,
  dealCountRate: 1,
  customerCountRate: 1,
  reportedAmountContributionRate: 0.4,
  dealCountContributionRate: 0.4,
  customerCountContributionRate: 0.4,
  repurchaseCustomerTotalRate: null,
  repurchaseDealCountTotalRate: null,
  repurchaseAmountTotalRate: null,
};

describe('BreakdownDrawer sorter tooltip', () => {
  beforeEach(() => {
    tableRenderSpy.mockClear();
  });

  it('anchors sort instructions to the sorter icon on metric tables only', () => {
    render(
      <BreakdownDrawer
        open
        records={[]}
        baselineRecords={[]}
        historicalRepurchaseRecords={[]}
        dateRange={['2026-06-01', '2026-06-30']}
        comparisonRecords={[]}
        comparisonBaselineRecords={[]}
        comparisonHistoricalRepurchaseRecords={[]}
        comparisonDateRange={null}
        primaryDimension="consultant"
        row={summaryRow}
        filters={{ customerScope: 'all', dealType: 'all' }}
        onClose={() => {}}
      />,
    );

    expectReportTablesUseSorterIconTooltip();

    const detailTables = tableRenderSpy.mock.calls
      .map(([props]) => props)
      .filter((props) => props.rowKey === 'id');
    detailTables.forEach((props) => {
      expect(props.showSorterTooltip).toBeUndefined();
    });
  });
});
