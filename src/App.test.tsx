import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('sales analytics demo', () => {
  it('opens breakdown drawer with legal tabs for consultant', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getAllByRole('button', { name: '查看拆解' })[0]);

    expect(screen.getByText('张敏 · 业绩拆解')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '渠道' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '渠道分类' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '机构' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '城市' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '部门' })).not.toBeInTheDocument();
  });

  it('renders default summary page correctly', () => {
    render(<App />);

    expect(screen.getByText('CRM 业绩统计 Demo')).toBeInTheDocument();
    expect(screen.getByText('咨询师业绩汇总')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '咨询师' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '成交客户数' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: '成交总金额' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: '查看拆解' })).toHaveLength(2);
  });
});
