import { Button, DatePicker, Form, Modal, Select, Space } from 'antd';
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
];

export default function FilterBar({
  filters,
  records,
  primaryDimension,
  onFiltersChange,
  onPrimaryDimensionChange,
}: FilterBarProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilters, setModalFilters] = useState<SalesDashboardFilters>(filters);

  const options = useMemo(
    () =>
      getFilterOptions(records, {
        departments: modalFilters.departments,
        channelCategories: modalFilters.channelCategories,
        projectCategories: modalFilters.projectCategories,
        cities: modalFilters.cities,
      }),
    [
      modalFilters.channelCategories,
      modalFilters.cities,
      modalFilters.departments,
      modalFilters.projectCategories,
      records,
    ],
  );

  function updateFilters(nextFilters: Partial<SalesDashboardFilters>) {
    onFiltersChange({ ...filters, ...nextFilters });
  }

  function updateModalFilters(nextFilters: Partial<SalesDashboardFilters>) {
    setModalFilters((prev) => ({ ...prev, ...nextFilters }));
  }

  function openModal() {
    setModalFilters(filters);
    setModalOpen(true);
  }

  function applyModal() {
    onFiltersChange(modalFilters);
    setModalOpen(false);
  }

  function cancelModal() {
    setModalOpen(false);
  }

  return (
    <>
      <Form layout="inline" className="filter-bar">
        <Form.Item label="统计时间">
          <DatePicker.RangePicker
            presets={presets}
            value={
              filters.dateRange?.map((date) => dayjs(date)) as
                | [dayjs.Dayjs, dayjs.Dayjs]
                | undefined
            }
            onChange={(_, dateStrings) => {
              updateFilters({
                dateRange:
                  dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
              });
            }}
          />
        </Form.Item>
        <Form.Item label="主维度">
          <Select
            value={primaryDimension}
            style={{ width: 140 }}
            placeholder="请选择主维度"
            aria-label="主维度"
            virtual={false}
            options={dimensions.map((dimension) => ({
              value: dimension.key,
              label: dimension.label,
            }))}
            onChange={onPrimaryDimensionChange}
          />
        </Form.Item>
        <Form.Item label="客户统计范围">
          <Select
            value={filters.customerScope}
            style={{ width: 160 }}
            placeholder="请选择客户统计范围"
            options={customerScopeOptions}
            onChange={(customerScope) => updateFilters({ customerScope })}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary">查询</Button>
            <Button
              onClick={() =>
                onFiltersChange({
                  dateRange: [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
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
            <Button onClick={openModal}>更多筛选</Button>
            <Button>导出汇总</Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        title="更多筛选"
        open={modalOpen}
        width={720}
        onOk={applyModal}
        onCancel={cancelModal}
        okText="确定"
        cancelText="取消"
        destroyOnHidden
      >
        <Form layout="vertical">
          <Form.Item label="部门">
            <Select
              mode="multiple"
              value={modalFilters.departments}
              placeholder="请选择部门"
              maxTagCount="responsive"
              options={toSelectOptions(options.departments)}
              onChange={(departments) => updateModalFilters({ departments, consultants: [] })}
            />
          </Form.Item>
          <Form.Item label="咨询师">
            <Select
              mode="multiple"
              value={modalFilters.consultants}
              placeholder="请选择咨询师"
              maxTagCount="responsive"
              options={toSelectOptions(options.consultants)}
              onChange={(consultants) => updateModalFilters({ consultants })}
            />
          </Form.Item>
          <Form.Item label="成交类型">
            <Select
              value={modalFilters.dealType}
              placeholder="请选择成交类型"
              options={dealTypeOptions}
              onChange={(dealType) => updateModalFilters({ dealType })}
            />
          </Form.Item>
          <Form.Item label="渠道分类">
            <Select
              mode="multiple"
              value={modalFilters.channelCategories}
              placeholder="请选择渠道分类"
              maxTagCount="responsive"
              options={toSelectOptions(options.channelCategories)}
              onChange={(channelCategories) =>
                updateModalFilters({ channelCategories, channels: [] })
              }
            />
          </Form.Item>
          <Form.Item label="渠道">
            <Select
              mode="multiple"
              value={modalFilters.channels}
              placeholder="请选择渠道"
              maxTagCount="responsive"
              options={toSelectOptions(options.channels)}
              onChange={(channels) => updateModalFilters({ channels })}
            />
          </Form.Item>
          <Form.Item label="项目分类">
            <Select
              mode="multiple"
              value={modalFilters.projectCategories}
              placeholder="请选择项目分类"
              maxTagCount="responsive"
              options={toSelectOptions(options.projectCategories)}
              onChange={(projectCategories) =>
                updateModalFilters({ projectCategories, projects: [] })
              }
            />
          </Form.Item>
          <Form.Item label="项目">
            <Select
              mode="multiple"
              value={modalFilters.projects}
              placeholder="请选择项目"
              maxTagCount="responsive"
              options={toSelectOptions(options.projects)}
              onChange={(projects) => updateModalFilters({ projects })}
            />
          </Form.Item>
          <Form.Item label="城市">
            <Select
              mode="multiple"
              value={modalFilters.cities}
              placeholder="请选择城市"
              maxTagCount="responsive"
              options={toSelectOptions(options.cities)}
              onChange={(cities) => updateModalFilters({ cities, institutions: [] })}
            />
          </Form.Item>
          <Form.Item label="机构">
            <Select
              mode="multiple"
              value={modalFilters.institutions}
              placeholder="请选择机构"
              maxTagCount="responsive"
              options={toSelectOptions(options.institutions)}
              onChange={(institutions) => updateModalFilters({ institutions })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
