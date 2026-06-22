import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FunnelTable } from './FunnelTable';

const departmentRow = {
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

const totalRow = { ...departmentRow, key: 'total', primaryDimensionValue: '汇总' };

it('opens a funnel breakdown drawer with only allowed dimensions', async () => {
  const user = userEvent.setup();
  const openDrawer = vi.fn();
  render(
    <FunnelTable
      primaryDimension={{ key: 'department', label: '部门' }}
      rows={[departmentRow]}
      hasComparison={false}
      onOpenBreakdown={openDrawer}
    />,
  );
  await user.click(screen.getByRole('button', { name: '维度拆解' }));
  expect(openDrawer).toHaveBeenCalledWith(departmentRow);
});

it('disables breakdown for total rows', () => {
  render(
    <FunnelTable
      primaryDimension={{ key: 'total', label: '汇总' }}
      rows={[totalRow]}
      hasComparison={false}
      onOpenBreakdown={vi.fn()}
    />,
  );
  expect(screen.getByRole('button', { name: '维度拆解' })).toBeDisabled();
});
