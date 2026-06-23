import '../test/spyAntdTable';
import { render } from '@testing-library/react';
import { beforeEach, describe, it, vi } from 'vitest';
import type { ReportSummaryRow } from '../domain/analytics';
import { getDimension } from '../domain/dimensions';
import { expectReportTablesUseSorterIconTooltip, tableRenderSpy } from '../test/spyAntdTable';
import SummaryTable from './SummaryTable';

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

describe('SummaryTable sorter tooltip', () => {
  beforeEach(() => {
    tableRenderSpy.mockClear();
  });

  it('anchors sort instructions to the sorter icon', () => {
    render(
      <SummaryTable
        primaryDimension={getDimension('consultant')}
        rows={[summaryRow as ReportSummaryRow]}
        filters={{ customerScope: 'all', dealType: 'all' }}
        hasComparison={false}
        onOpenBreakdown={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expectReportTablesUseSorterIconTooltip();
  });
});
