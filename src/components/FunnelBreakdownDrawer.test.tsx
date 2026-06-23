import '../test/spyAntdTable';
import { render } from '@testing-library/react';
import { beforeEach, describe, it } from 'vitest';
import { expectReportTablesUseSorterIconTooltip, tableRenderSpy } from '../test/spyAntdTable';
import FunnelBreakdownDrawer from './FunnelBreakdownDrawer';

const funnelRow = {
  key: 'department:华东一部',
  primaryDimensionValue: '华东一部',
  recordedCustomerCount: 2,
  validCustomerCount: 2,
  addedWechatCustomerCount: 2,
  dispatchedCustomerCount: 1,
  invitedCustomerCount: 1,
  visitedCustomerCount: 0,
  convertedCustomerCount: 0,
  repurchasedCustomerCount: 0,
  validCustomerRate: 1,
  addedWechatRate: 1,
  dispatchRate: 0.5,
  invitationRate: 0.5,
  visitRate: 0,
  conversionRate: 0,
  repurchaseRate: 0,
};

describe('FunnelBreakdownDrawer sorter tooltip', () => {
  beforeEach(() => {
    tableRenderSpy.mockClear();
  });

  it('anchors sort instructions to the sorter icon', () => {
    render(
      <FunnelBreakdownDrawer
        open
        records={[]}
        comparisonRecords={[]}
        hasComparison={false}
        primaryDimension={{ key: 'department', label: '部门' }}
        row={funnelRow}
        onClose={() => {}}
      />,
    );

    expectReportTablesUseSorterIconTooltip();
  });
});
