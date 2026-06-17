import { Button, DatePicker, Form, Modal, Select, Space, TreeSelect } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { DealRecord } from '../data/mockDeals';
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';
import {
  buildTreeData,
  getFilterOptions,
  type CustomerScopeFilter,
  type DealTypeFilter,
  type SalesDashboardFilters,
  type TreeDataNode,
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

const todayRange: [string, string] = [dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')];

const defaultFiltersReset: SalesDashboardFilters = {
  dateRange: todayRange,
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
  primaryDimension,
  onFiltersChange,
  onPrimaryDimensionChange,
}: FilterBarProps) {
  // --- toolbar local state (committed only on "查询") ---
  const [toolbarDateRange, setToolbarDateRange] = useState(filters.dateRange);
  const [toolbarPrimaryDimension, setToolbarPrimaryDimension] = useState(primaryDimension);
  const [toolbarCustomerScope, setToolbarCustomerScope] = useState(filters.customerScope);

  // Sync toolbar state when effective filters change (e.g. from modal query)
  useEffect(() => {
    setToolbarDateRange(filters.dateRange);
    setToolbarCustomerScope(filters.customerScope);
  }, [filters.dateRange, filters.customerScope]);

  useEffect(() => {
    setToolbarPrimaryDimension(primaryDimension);
  }, [primaryDimension]);

  // --- modal state ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFilters, setModalFilters] = useState<SalesDashboardFilters>(filters);
  const [modalPrimaryDimension, setModalPrimaryDimension] = useState<DimensionKey>(primaryDimension);

  const treeData = useMemo(() => buildTreeData(records), [records]);
  const customerPoolOptions = useMemo(
    () => getFilterOptions(records).customerPools,
    [records],
  );

  function handleToolbarQuery() {
    onFiltersChange({
      ...defaultFiltersReset,
      dateRange: toolbarDateRange ?? todayRange,
      customerScope: toolbarCustomerScope,
    });
    onPrimaryDimensionChange(toolbarPrimaryDimension);
  }

  function handleToolbarReset() {
    setToolbarDateRange(todayRange);
    setToolbarCustomerScope('all');
    setToolbarPrimaryDimension('consultant');
    onFiltersChange(defaultFiltersReset);
    onPrimaryDimensionChange('consultant');
  }

  function openModal() {
    setModalFilters(filters);
    setModalPrimaryDimension(primaryDimension);
    setModalOpen(true);
  }

  function handleModalQuery() {
    onFiltersChange(modalFilters);
    onPrimaryDimensionChange(modalPrimaryDimension);
    setModalOpen(false);
  }

  function handleModalReset() {
    setModalFilters(defaultFiltersReset);
    setModalPrimaryDimension('consultant');
  }

  function getParentValues(tree: TreeDataNode[]): Set<string> {
    return new Set(tree.map((node) => node.value as string));
  }

  return (
    <>
      <Form layout="inline" className="filter-bar">
        <Form.Item label="统计时间">
          <DatePicker.RangePicker
            allowClear={false}
            presets={presets}
            value={
              toolbarDateRange?.map((date) => dayjs(date)) as
                | [dayjs.Dayjs, dayjs.Dayjs]
                | undefined
            }
            onChange={(_, dateStrings) => {
              setToolbarDateRange(
                dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
              );
            }}
          />
        </Form.Item>
        <Form.Item label="主维度">
          <Select
            value={toolbarPrimaryDimension}
            style={{ width: 140 }}
            placeholder="请选择主维度"
            aria-label="主维度"
            virtual={false}
            options={dimensions.map((dimension) => ({
              value: dimension.key,
              label: dimension.label,
            }))}
            onChange={setToolbarPrimaryDimension}
          />
        </Form.Item>
        <Form.Item label="客户统计范围">
          <Select
            value={toolbarCustomerScope}
            style={{ width: 160 }}
            placeholder="请选择客户统计范围"
            options={customerScopeOptions}
            onChange={setToolbarCustomerScope}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleToolbarQuery}>
              查询
            </Button>
            <Button onClick={handleToolbarReset}>重置</Button>
            <Button onClick={openModal}>全部筛选</Button>
            <Button>导出汇总</Button>
          </Space>
        </Form.Item>
      </Form>

      <Modal
        title="全部筛选"
        open={modalOpen}
        width={960}
        onCancel={() => setModalOpen(false)}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" onClick={handleModalQuery}>
                查询
              </Button>
              <Button onClick={handleModalReset}>重置</Button>
            </Space>
          </div>
        }
        destroyOnHidden
      >
        <div className="filter-grid">
          {/* Row 1 */}
          <div className="filter-grid-item">
            <div className="filter-grid-label">统计时间</div>
            <DatePicker.RangePicker
              allowClear={false}
              presets={presets}
              style={{ width: '100%' }}
              value={
                modalFilters.dateRange?.map((date) => dayjs(date)) as
                  | [dayjs.Dayjs, dayjs.Dayjs]
                  | undefined
              }
              onChange={(_, dateStrings) => {
                setModalFilters((prev) => ({
                  ...prev,
                  dateRange:
                    dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">主维度</div>
            <Select
              value={modalPrimaryDimension}
              style={{ width: '100%' }}
              placeholder="请选择主维度"
              virtual={false}
              options={dimensions.map((d) => ({ value: d.key, label: d.label }))}
              onChange={setModalPrimaryDimension}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">客户统计范围</div>
            <Select
              value={modalFilters.customerScope}
              style={{ width: '100%' }}
              placeholder="请选择客户统计范围"
              options={customerScopeOptions}
              onChange={(customerScope) =>
                setModalFilters((prev) => ({ ...prev, customerScope }))
              }
            />
          </div>

          {/* Row 2 */}
          <div className="filter-grid-item">
            <div className="filter-grid-label">咨询师</div>
            <TreeSelect
              treeData={treeData.consultantTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择部门/咨询师"
              value={[...modalFilters.departments, ...modalFilters.consultants]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.consultantTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  departments: parents,
                  consultants: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">渠道</div>
            <TreeSelect
              treeData={treeData.channelTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择渠道分类/渠道"
              value={[...modalFilters.channelCategories, ...modalFilters.channels]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.channelTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  channelCategories: parents,
                  channels: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">项目</div>
            <TreeSelect
              treeData={treeData.projectTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择项目分类/项目"
              value={[...modalFilters.projectCategories, ...modalFilters.projects]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.projectTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  projectCategories: parents,
                  projects: children,
                }));
              }}
            />
          </div>

          {/* Row 3 */}
          <div className="filter-grid-item">
            <div className="filter-grid-label">城市&机构</div>
            <TreeSelect
              treeData={treeData.cityTree}
              treeCheckable
              treeCheckStrictly={false}
              showCheckedStrategy={TreeSelect.SHOW_ALL}
              maxTagCount="responsive"
              style={{ width: '100%' }}
              placeholder="请选择城市/机构"
              value={[...modalFilters.cities, ...modalFilters.institutions]}
              onChange={(selected) => {
                const parentValues = getParentValues(treeData.cityTree);
                const parents = selected.filter((v) => parentValues.has(v));
                const children = selected.filter((v) => !parentValues.has(v));
                setModalFilters((prev) => ({
                  ...prev,
                  cities: parents,
                  institutions: children,
                }));
              }}
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">客户池</div>
            <Select
              mode="multiple"
              value={modalFilters.customerPools}
              placeholder="请选择客户池"
              maxTagCount="responsive"
              style={{ width: '100%' }}
              options={toSelectOptions(customerPoolOptions)}
              onChange={(customerPools) =>
                setModalFilters((prev) => ({ ...prev, customerPools }))
              }
            />
          </div>
          <div className="filter-grid-item">
            <div className="filter-grid-label">成交类型</div>
            <Select
              value={modalFilters.dealType}
              placeholder="请选择成交类型"
              style={{ width: '100%' }}
              options={dealTypeOptions}
              onChange={(dealType) =>
                setModalFilters((prev) => ({ ...prev, dealType }))
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
