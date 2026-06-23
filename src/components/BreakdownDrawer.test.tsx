import '../test/spyAntdTable';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockDeals } from '../data/mockDeals';
import { expectReportTablesUseSorterIconTooltip, tableRenderSpy } from '../test/spyAntdTable';
import { detailColumns } from './detailColumns';
import BreakdownDrawer from './BreakdownDrawer';

const consultantRecords = mockDeals.filter((record) => record.consultant === '张敏');

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

  it('anchors sort instructions to the sorter icon on metric tables only', async () => {
    const user = userEvent.setup();
    render(
      <BreakdownDrawer
        open
        records={consultantRecords}
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

    const detailButtons = screen.getAllByRole('button', { name: '业绩明细' });
    expect(detailButtons.length).toBeGreaterThan(0);

    tableRenderSpy.mockClear();
    await user.click(detailButtons[0]!);

    const detailTables = tableRenderSpy.mock.calls
      .map(([props]) => props)
      .filter((props) => props.rowKey === 'id');
    expect(detailTables.length).toBeGreaterThan(0);
    detailTables.forEach((props) => {
      expect(props.showSorterTooltip).toBeUndefined();
      expect(props.columns).toBe(detailColumns);
    });
  });
});
