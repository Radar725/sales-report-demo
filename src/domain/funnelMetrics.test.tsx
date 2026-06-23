import { isValidElement, type ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MetricColumnTitle } from '../components/MetricColumnTitle';
import { buildFunnelMetricColumns } from './funnelMetrics';

const funnelMetricDescriptions: Record<string, string> = {
  录单客户数: '录单时间落在统计期内的去重客户数，包含有效和无效客户。',
  有效客户数: '录单客户中被标记为有效的去重客户数。',
  已加微客户数: '有效客户中，当前已完成加微及后续阶段的客户数。',
  已派单客户数: '有效客户中，当前已完成派单及后续阶段的客户数。',
  已邀约客户数: '有效客户中，当前已完成邀约及后续阶段的客户数。',
  已到院客户数: '有效客户中，当前已到院及后续阶段的客户数。',
  已成交客户数: '有效客户中，当前已成交及后续阶段的客户数。',
  已复购客户数: '有效客户中，当前已进入持续复购的客户数。',
  有效客户率: '有效客户数占录单客户数的比例，反映录单质量。',
  加微率: '已加微客户数占有效客户数的比例。',
  派单率: '已派单客户数占有效客户数的比例。',
  邀约率: '已邀约客户数占有效客户数的比例。',
  到院率: '已到院客户数占有效客户数的比例。',
  成交率: '已成交客户数占有效客户数的比例。',
  复购率: '已复购客户数占有效客户数的比例。',
};

function getMetricColumnTitleProps(title: unknown) {
  expect(isValidElement(title)).toBe(true);
  const element = title as ReactElement<{ label: string; description: string }>;
  expect(element.type).toBe(MetricColumnTitle);
  return element.props;
}

describe('funnel metric columns', () => {
  it('renders MetricColumnTitle with approved labels and descriptions for every column', () => {
    const columns = buildFunnelMetricColumns();

    expect(columns.map((column) => getMetricColumnTitleProps(column.title).label)).toEqual([
      '录单客户数',
      '有效客户数',
      '已加微客户数',
      '已派单客户数',
      '已邀约客户数',
      '已到院客户数',
      '已成交客户数',
      '已复购客户数',
      '有效客户率',
      '加微率',
      '派单率',
      '邀约率',
      '到院率',
      '成交率',
      '复购率',
    ]);
    columns.forEach((column) => {
      const { label, description } = getMetricColumnTitleProps(column.title);
      expect(description).toBe(funnelMetricDescriptions[label]);
    });
  });

  it('shows the approved explanation when a funnel metric label is hovered', async () => {
    const user = userEvent.setup();
    const column = buildFunnelMetricColumns()[0];

    render(<>{column.title}</>);
    await user.hover(screen.getByText('录单客户数'));

    expect(await screen.findByText(funnelMetricDescriptions['录单客户数'])).toBeInTheDocument();
  });

  it('renders comparison deltas when hasComparison is true', () => {
    const columns = buildFunnelMetricColumns(true);
    const record = {
      recordedCustomerCount: 3,
      validCustomerCount: 3,
      addedWechatCustomerCount: 0,
      dispatchedCustomerCount: 0,
      invitedCustomerCount: 0,
      visitedCustomerCount: 0,
      convertedCustomerCount: 0,
      repurchasedCustomerCount: 0,
      validCustomerRate: 1,
      addedWechatRate: null,
      dispatchRate: null,
      invitationRate: null,
      visitRate: null,
      conversionRate: null,
      repurchaseRate: null,
      comparison: {
        recordedCustomerCount: 0.5,
      },
    };

    render(<>{columns[0].render?.(3, record, 0)}</>);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('↑ 50.0%')).toBeInTheDocument();
  });
});
