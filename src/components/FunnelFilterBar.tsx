import { Button, DatePicker, Form, Select, Space, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { FunnelCustomerRecord } from '../data/mockFunnelCustomers';
import { getDefaultComparisonDateRange } from '../domain/comparison';
import {
  buildFunnelTreeData,
  getFunnelFilterOptions,
  type FunnelFilters,
  type FunnelTreeDataNode,
} from '../domain/funnel';

type FunnelFilterBarProps = {
  filters: FunnelFilters;
  records: FunnelCustomerRecord[];
  onFiltersChange: (filters: FunnelFilters) => void;
  onExport: () => void;
};

function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}


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
  comparisonDateRange: getDefaultComparisonDateRange(dayjs()),
  departments: [],
  consultants: [],
  channelCategories: [],
  channels: [],
  customerPools: [],
};

export default function FunnelFilterBar({
  filters,
  records,
  onFiltersChange,
  onExport,
}: FunnelFilterBarProps) {
  const [localFilters, setLocalFilters] = useState<FunnelFilters>(() => ({
    ...defaultFunnelFiltersReset,
    ...filters,
  }));

  const treeData = useMemo(() => buildFunnelTreeData(records), [records]);
  const customerPoolOptions = useMemo(
    () => getFunnelFilterOptions(records).customerPools,
    [records],
  );

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
      <Form.Item label="录单时间">
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

      <Form.Item label="对比时间">
        <DatePicker.RangePicker
          allowClear
          presets={presets}
          value={
            localFilters.comparisonDateRange?.map((date) => dayjs(date)) as
              | [dayjs.Dayjs, dayjs.Dayjs]
              | undefined
          }
          onChange={(_, dateStrings) => {
            setLocalFilters((prev) => ({
              ...prev,
              comparisonDateRange:
                dateStrings[0] && dateStrings[1]
                  ? [dateStrings[0], dateStrings[1]]
                  : null,
            }));
          }}
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

      <Form.Item label="客户池">
        <Select
          mode="multiple"
          value={localFilters.customerPools}
          placeholder="请选择客户池"
          maxTagCount="responsive"
          style={{ width: 180 }}
          options={toSelectOptions(customerPoolOptions)}
          onChange={(customerPools) =>
            setLocalFilters((prev) => ({ ...prev, customerPools }))
          }
        />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleQuery}>
            查询
          </Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={onExport}>
            导出数据
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
