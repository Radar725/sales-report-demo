import { createContext, useContext } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import type { ColumnSettingItem, ColumnsSettingInitData, SettingColumn, TableColumnSetting } from './types';

export type ColumnsSettingContextValue = {
  initData: ColumnsSettingInitData | null;
  columnMap: Map<string, ColumnSettingItem>;
  renderList: string[];
  leftList: string[];
  rightList: string[];
  searchVal: string;
  tableSize: SizeType;
  fixedY: boolean;
  saving: boolean;
  checkedAll: boolean;
  indeterminate: boolean;
  filteredColumns: SettingColumn[];
  changeSearchVal: (value?: string) => void;
  changeTableSize: (value: SizeType) => void;
  changeFixedY: (value: boolean) => void;
  changeHidden: (key: string) => void;
  multipleChoices: (checked: boolean) => void;
  cancelFixed: (key: string) => void;
  fixedToLeft: (key: string) => void;
  fixedToRight: (key: string) => void;
  onDragEnd: (event: DragEndEvent) => void;
  resetAll: () => void;
  submit: () => Promise<TableColumnSetting | null>;
};

export const ColumnsSettingContext = createContext<ColumnsSettingContextValue | null>(null);

export function useColumnsSettingContext() {
  const context = useContext(ColumnsSettingContext);
  if (!context) {
    throw new Error('useColumnsSettingContext must be used within TableColumnSettingsModal');
  }
  return context;
}
