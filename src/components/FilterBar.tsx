import { Button, DatePicker, Form, Select, Space } from 'antd';
import type { DimensionKey } from '../domain/dimensions';
import { dimensions } from '../domain/dimensions';

type FilterBarProps = {
  primaryDimension: DimensionKey;
  onPrimaryDimensionChange: (dimension: DimensionKey) => void;
};

export default function FilterBar({ primaryDimension, onPrimaryDimensionChange }: FilterBarProps) {
  return (
    <Form layout="inline" className="filter-bar">
      <Form.Item label="统计时间">
        <DatePicker.RangePicker />
      </Form.Item>
      <Form.Item label="业绩状态">
        <Select
          value="已成交"
          style={{ width: 120 }}
          options={[{ value: '已成交', label: '已成交' }]}
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
      <Form.Item>
        <Space>
          <Button type="primary">查询</Button>
          <Button>重置</Button>
          <Button>导出汇总</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
