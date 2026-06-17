import { Button, DatePicker, Form, Select, Space } from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';
import {
  getFilterOptions,
  type CustomerScopeFilter,
  type DealTypeFilter,
  type SalesDashboardFilters,
} from '../domain/filters';

type FilterBarProps = {
  filters: SalesDashboardFilters;
  records: DealRecord[];
  primaryDimension: DimensionKey;
  onFiltersChange: (filters: SalesDashboardFilters) => void;
  onPrimaryDimensionChange: (dimension: DimensionKey) => void;
};

const dealTypeOptions: Array<{ value: DealTypeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'newDiagnosis', label: '新诊' },
  { value: 'repurchase', label: '复购' },
];

const customerScopeOptions: Array<{ value: CustomerScopeFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'currentNewCustomers', label: '当期新客' },
];

function toSelectOptions(values: string[]) {
  return values.map((value) => ({ value, label: value }));
}

export default function FilterBar({
  filters,
  records,
  primaryDimension,
  onFiltersChange,
  onPrimaryDimensionChange,
}: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const options = useMemo(
    () =>
      getFilterOptions(records, {
        departments: filters.departments,
        channelCategories: filters.channelCategories,
        projectCategories: filters.projectCategories,
        cities: filters.cities,
      }),
    [filters.channelCategories, filters.cities, filters.departments, filters.projectCategories, records],
  );

  function updateFilters(nextFilters: Partial<SalesDashboardFilters>) {
    onFiltersChange({ ...filters, ...nextFilters });
  }

  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
        <DatePicker.RangePicker
          value={filters.dateRange?.map((date) => dayjs(date)) as [dayjs.Dayjs, dayjs.Dayjs] | undefined}
          onChange={(_, dateStrings) => {
            updateFilters({
              dateRange:
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
            });
          }}
        />
      </Form.Item>
      <Form.Item label="部门">
        <Select
          mode="multiple"
          value={filters.departments}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.departments)}
          onChange={(departments) => updateFilters({ departments, consultants: [] })}
        />
      </Form.Item>
      <Form.Item label="咨询师">
        <Select
          mode="multiple"
          value={filters.consultants}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.consultants)}
          onChange={(consultants) => updateFilters({ consultants })}
        />
      </Form.Item>
      <Form.Item label="成交类型">
        <Select
          value={filters.dealType}
          style={{ width: 120 }}
          options={dealTypeOptions}
          onChange={(dealType) => updateFilters({ dealType })}
        />
      </Form.Item>
      <Form.Item label="渠道分类">
        <Select
          mode="multiple"
          value={filters.channelCategories}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.channelCategories)}
          onChange={(channelCategories) => updateFilters({ channelCategories, channels: [] })}
        />
      </Form.Item>
      <Form.Item label="项目分类">
        <Select
          mode="multiple"
          value={filters.projectCategories}
          style={{ minWidth: 160 }}
          maxTagCount="responsive"
          options={toSelectOptions(options.projectCategories)}
          onChange={(projectCategories) => updateFilters({ projectCategories, projects: [] })}
        />
      </Form.Item>
      <Form.Item label="客户统计范围">
        <Select
          value={filters.customerScope}
          style={{ width: 140 }}
          options={customerScopeOptions}
          onChange={(customerScope) => updateFilters({ customerScope })}
        />
      </Form.Item>
      <Form.Item label="主维度">
        <Select
          value={primaryDimension}
          style={{ width: 140 }}
          aria-label="主维度"
          virtual={false}
          options={dimensions.map((dimension) => ({
            value: dimension.key,
            label: dimension.label,
          }))}
          onChange={onPrimaryDimensionChange}
        />
      </Form.Item>
      {showMoreFilters ? (
        <div className="filter-bar-more">
          <Form.Item label="渠道">
            <Select
              mode="multiple"
              value={filters.channels}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.channels)}
              onChange={(channels) => updateFilters({ channels })}
            />
          </Form.Item>
          <Form.Item label="项目">
            <Select
              mode="multiple"
              value={filters.projects}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.projects)}
              onChange={(projects) => updateFilters({ projects })}
            />
          </Form.Item>
          <Form.Item label="城市">
            <Select
              mode="multiple"
              value={filters.cities}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.cities)}
              onChange={(cities) => updateFilters({ cities, institutions: [] })}
            />
          </Form.Item>
          <Form.Item label="机构">
            <Select
              mode="multiple"
              value={filters.institutions}
              style={{ minWidth: 160 }}
              maxTagCount="responsive"
              options={toSelectOptions(options.institutions)}
              onChange={(institutions) => updateFilters({ institutions })}
            />
          </Form.Item>
        </div>
      ) : null}
      <Form.Item>
        <Space>
          <Button type="primary">查询</Button>
          <Button
            onClick={() =>
              onFiltersChange({
                dateRange: null,
                departments: [],
                consultants: [],
                dealType: 'all',
                channelCategories: [],
                channels: [],
                projectCategories: [],
                projects: [],
                customerScope: 'all',
                cities: [],
                institutions: [],
              })
            }
          >
            重置
          </Button>
          <Button onClick={() => setShowMoreFilters((current) => !current)}>
            {showMoreFilters ? '收起筛选' : '更多筛选'}
          </Button>
          <Button>导出汇总</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
