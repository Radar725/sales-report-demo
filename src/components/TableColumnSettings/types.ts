import type { ColumnType } from 'antd/es/table';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { ReactNode } from 'react';

export type TableColumnSettingKey = string;

export type LocalColumnSetting = {
  fixed?: 'left' | 'right';
  hidden: boolean;
  index: number;
};

export type TableColumnSetting = {
  columns: Record<string, LocalColumnSetting>;
  tableSize: SizeType;
  fixedY?: boolean;
};

export type SettingColumn<T = any> = ColumnType<T> & {
  /** 用于配置弹窗搜索/展示，title 为 ReactNode 时建议传入 */
  filterTitle?: string;
  /** 禁止在配置弹窗中修改，列始终展示 */
  disabledSetting?: boolean;
  hidden?: boolean;
  index?: number;
};

export type ColumnSettingItem = {
  key: string;
  title: ReactNode;
  filterTitle?: string;
  fixed?: 'left' | 'right';
  hidden?: boolean;
  index?: number;
  disabledSetting?: boolean;
};

export type ColumnsSettingInitData = {
  tableKey: TableColumnSettingKey;
  columns: SettingColumn[];
  tableSize?: SizeType;
  columnSpan?: number;
  disabledSize?: boolean;
};
