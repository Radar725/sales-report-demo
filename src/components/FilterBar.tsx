import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Select, Space, Tooltip, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { DealRecord } from '../data/mockDeals';
import { getDefaultComparisonDateRange } from '../domain/comparison';
import {
  buildTreeData,
  getFilterOptions,
  type CustomerScopeFilter,
  type SalesDashboardFilters,
  type TreeDataNode,
} from '../domain/filters';

type FilterBarProps = {
  filters: SalesDashboardFilters;
  records: DealRecord[];
  onFiltersChange: (filters: SalesDashboardFilters) => void;
  onExportDimension: () => void;
  onExportDetail: () => void;
};

const customerScopeOptions: Array<{ value: CustomerScopeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'currentNewCustomers', label: '新客' },
  { value: 'existingCustomers', label: '老客' },
];

const dealTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'newDiagnosis', label: '新诊' },
  { value: 'repurchase', label: '复购' },
];

function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

const customerScopeTooltip =
  '按客户创建时间划分统计范围：新客为统计期内创建，老客为统计期开始前创建，全部不限制。该筛选不等同于首次成交，可与新诊、复购组合使用。';

const dealTypeTooltip =
  '按成交记录类型筛选：新诊为新诊成交，复购为复购成交，全部会同时统计两类成交。可与客户统计范围组合使用。';

function FilterLabelWithInfo({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <span className="filter-label-with-info">
      {label}{' '}
      <Tooltip title={tooltip}>
        <InfoCircleOutlined
          className="filter-label-info-icon"
          tabIndex={0}
          role="img"
          aria-label={`${label}说明`}
        />
      </Tooltip>
    </span>
  );
}

const presets: NonNullable<
  React.ComponentProps<typeof DatePicker.RangePicker>['presets']
> = [
  { label: '今日', value: [dayjs(), dayjs()] },
  { label: '昨日', value: [dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')] },
  { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
  {
    label: '上周',
    value: [dayjs().subtract(1, 'week').startOf('week'), dayjs().subtract(1, 'week').endOf('week')],
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

const todayRange: [string, string] = [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')];

const defaultFiltersReset: SalesDashboardFilters = {
  dateRange: todayRange,
  comparisonDateRange: getDefaultComparisonDateRange(dayjs()),
  departments: [],
  consultants: [],
  dealType: 'all',
  channelCategories: [],
  channels: [],
  projectCategories: [],
  projects: [],
  customerScope: 'all',
  customerPools: [],
  cities: [],
  institutions: [],
};

export default function FilterBar({
  filters,
  records,
  onFiltersChange,
  onExportDimension,
  onExportDetail,
}: FilterBarProps) {
  // --- local filter state (committed to parent on "查询") ---
  const [localFilters, setLocalFilters] = useState<SalesDashboardFilters>(() => ({
    ...defaultFiltersReset,
    ...filters,
  }));
  const [expanded, setExpanded] = useState(false);

  // Sync from parent when effective filters change externally
  useEffect(() => {
    setLocalFilters({
      ...defaultFiltersReset,
      ...filters,
    });
  }, [filters]);

  const treeData = useMemo(() => buildTreeData(records), [records]);
  const customerPoolOptions = useMemo(
    () => getFilterOptions(records).customerPools,
    [records],
  );

  function handleQuery() {
    onFiltersChange(localFilters);
  }

  function handleReset() {
    const reset = { ...defaultFiltersReset };
    setLocalFilters(reset);
    onFiltersChange(reset);
  }

  function getParentValues(tree: TreeDataNode[]): Set<string> {
    return new Set(tree.map((node) => node.value as string));
  }

  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
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
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
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
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
            }));
          }}
        />
      </Form.Item>
      <Form.Item label={<FilterLabelWithInfo label="客户统计范围" tooltip={customerScopeTooltip} />}>
        <Select
          value={localFilters.customerScope}
          style={{ width: 160 }}
          placeholder="请选择客户统计范围"
          options={customerScopeOptions}
          onChange={(customerScope) =>
            setLocalFilters((prev) => ({ ...prev, customerScope }))
          }
        />
      </Form.Item>
      <Form.Item label={<FilterLabelWithInfo label="成交类型" tooltip={dealTypeTooltip} />}>
        <Select
          value={localFilters.dealType}
          style={{ width: 140 }}
          placeholder="请选择成交类型"
          options={dealTypeOptions}
          onChange={(dealType) =>
            setLocalFilters((prev) => ({ ...prev, dealType: dealType as SalesDashboardFilters['dealType'] }))
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
          value={[...localFilters.departments, ...localFilters.consultants]}
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
          value={[...localFilters.channelCategories, ...localFilters.channels]}
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
      <Form.Item label="项目">
        <TreeSelect
          treeData={treeData.projectTree}
          treeCheckable
          treeCheckStrictly={false}
          showCheckedStrategy={TreeSelect.SHOW_ALL}
          maxTagCount="responsive"
          style={{ width: 180 }}
          placeholder="请选择项目分类/项目"
          value={[...localFilters.projectCategories, ...localFilters.projects]}
          onChange={(selected) => {
            const parentValues = getParentValues(treeData.projectTree);
            const parents = selected.filter((v) => parentValues.has(v));
            const children = selected.filter((v) => !parentValues.has(v));
            setLocalFilters((prev) => ({
              ...prev,
              projectCategories: parents,
              projects: children,
            }));
          }}
        />
      </Form.Item>

      {expanded && (
        <>
          <Form.Item label="机构">
            <TreeSelect
              treeData={treeData.cityTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: 180 }}
              placeholder="请选择城市/机构"
              value={[...localFilters.cities, ...localFilters.institutions]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.cityTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setLocalFilters((prev) => ({
                  ...prev,
                  cities: parents,
                  institutions: children,
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
        </>
      )}

      {expanded ? (
        <div style={{ width: '100%', marginTop: 8 }}>
          <Space>
            <Button type="primary" onClick={handleQuery}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={onExportDimension}>
              导出维度数据
            </Button>
            <Button type="primary" onClick={onExportDetail}>
              导出明细数据
            </Button>
          </Space>
          <Button
            type="link"
            style={{ padding: 0, marginLeft: 8 }}
            onClick={() => setExpanded(false)}
          >
            收起 &#x25B2;
          </Button>
        </div>
      ) : (
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleQuery}>
              查询
            </Button>
            <Button onClick={handleReset}>重置</Button>
            <Button type="primary" onClick={onExportDimension}>
              导出维度数据
            </Button>
            <Button type="primary" onClick={onExportDetail}>
              导出明细数据
            </Button>
          </Space>
          <Button
            type="link"
            style={{ padding: 0, marginLeft: 8 }}
            onClick={() => setExpanded(true)}
          >
            展开 &#x25BC;
          </Button>
        </Form.Item>
      )}
    </Form>
  );
}
