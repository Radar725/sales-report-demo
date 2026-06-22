import { Button, DatePicker, Form, Select, Space, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import {
  buildFunnelTreeData,
  type FunnelFilters,
  type FunnelTreeDataNode,
} from '../domain/funnel';

type FunnelFilterBarProps = {
  filters: FunnelFilters;
  records: FunnelCustomerRecord[];
  onFiltersChange: (filters: FunnelFilters) => void;
};

const customerScopeOptions: Array<{
  value: FunnelFilters['customerScope'];
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'currentNewCustomers', label: '新客' },
  { value: 'existingCustomers', label: '老客' },
];

const customerTypeOptions: Array<{
  value: FunnelFilters['customerType'];
  label: string;
}> = [
  { value: 'all', label: '全部' },
  { value: 'valid', label: '有效' },
  { value: 'invalid', label: '无效' },
];

const presets: NonNullable<
  React.ComponentProps<typeof DatePicker.RangePicker>['presets']
> = [
  { label: '今日', value: [dayjs(), dayjs()] },
  { label: '昨日', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
  {
    label: '上周',
    value: [
      dayjs().subtract(1, 'week').startOf('week'),
      dayjs().subtract(1, 'week').endOf('week'),
    ],
  },
  { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
  {
    label: '上月',
    value: [
      dayjs().subtract(1, 'month').startOf('month'),
      dayjs().subtract(1, 'month').endOf('month'),
    ],
  },
  { label: '近7天', value: [dayjs().subtract(7, 'day'), dayjs()] },
  { label: '近30天', value: [dayjs().subtract(30, 'day'), dayjs()] },
  { label: '近90天', value: [dayjs().subtract(90, 'day'), dayjs()] },
];

const defaultFunnelFiltersReset: FunnelFilters = {
  dateRange: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
  customerScope: 'currentNewCustomers',
  customerType: 'valid',
  departments: [],
  consultants: [],
  channelCategories: [],
  channels: [],
};

export default function FunnelFilterBar({
  filters,
  records,
  onFiltersChange,
}: FunnelFilterBarProps) {
  const [localFilters, setLocalFilters] = useState<FunnelFilters>(() => ({
    ...defaultFunnelFiltersReset,
    ...filters,
  }));

  const treeData = useMemo(() => buildFunnelTreeData(records), [records]);

  useEffect(() => {
    setLocalFilters({
      ...defaultFunnelFiltersReset,
      ...filters,
    });
  }, [filters]);

  function handleQuery() {
    onFiltersChange(localFilters);
  }

  function handleReset() {
    const reset = { ...defaultFunnelFiltersReset };
    setLocalFilters(reset);
    onFiltersChange(reset);
  }

  function getParentValues(tree: FunnelTreeDataNode[]): Set<string> {
    return new Set(tree.map((node) => node.value as string));
  }

  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item
        label="统计时间"
        required
        rules={[{ required: true, message: '请选择统计时间' }]}
      >
        <DatePicker.RangePicker
          allowClear={false}
          presets={presets}
          value={
            localFilters.dateRange?.map((date) => dayjs(date)) as
              | [dayjs.Dayjs, dayjs.Dayjs]
              | undefined
          }
          onChange={(_, dateStrings) => {
            setLocalFilters((prev) => ({
              ...prev,
              dateRange:
                dateStrings[0] && dateStrings[1]
                  ? [dateStrings[0], dateStrings[1]]
                  : null,
            }));
          }}
        />
      </Form.Item>

      <Form.Item label="客户统计范围">
        <Select
          value={localFilters.customerScope}
          style={{ width: 160 }}
          placeholder="请选择客户统计范围"
          allowClear={false}
          options={customerScopeOptions}
          onChange={(customerScope) =>
            setLocalFilters((prev) => ({ ...prev, customerScope }))
          }
        />
      </Form.Item>

      <Form.Item label="客户类型">
        <Select
          value={localFilters.customerType}
          style={{ width: 140 }}
          placeholder="请选择客户类型"
          allowClear={false}
          options={customerTypeOptions}
          onChange={(customerType) =>
            setLocalFilters((prev) => ({ ...prev, customerType }))
          }
        />
      </Form.Item>

      <Form.Item label="咨询师">
        <TreeSelect
          treeData={treeData.consultantTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择部门/咨询师"
          value={[
            ...localFilters.departments,
            ...localFilters.consultants,
          ]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.consultantTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              departments: parents,
              consultants: children,
            }));
          }}
        />
      </Form.Item>

      <Form.Item label="渠道">
        <TreeSelect
          treeData={treeData.channelTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择渠道分类/渠道"
          value={[
            ...localFilters.channelCategories,
            ...localFilters.channels,
          ]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.channelTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              channelCategories: parents,
              channels: children,
            }));
          }}
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleQuery}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary">导出数据</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
