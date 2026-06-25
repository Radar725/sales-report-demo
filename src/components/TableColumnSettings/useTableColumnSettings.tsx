import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import { applyColumnSettings, resolveTableScroll } from './applySettings';
import { loadTableColumnSetting } from './storage';
import TableColumnSettingsModal from './TableColumnSettingsModal';
import type { ColumnsSettingInitData, SettingColumn, TableColumnSetting, TableColumnSettingKey } from './types';

type TableColumnSettingsScrollOptions = {
  x?: number | string | true;
  y?: number | string;
};

type UseTableColumnSettingsOptions = {
  tableSize?: SizeType;
  disabledSize?: boolean;
  columnSpan?: number;
  scroll?: TableColumnSettingsScrollOptions;
  /** 弹窗字段目录；未传时与 baseColumns 一致 */
  settingCatalog?: SettingColumn[];
};

function useTableColumnSettingState(tableKey: TableColumnSettingKey) {
  const [setting, setSetting] = useState<TableColumnSetting | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    setInitialized(false);
    void loadTableColumnSetting(tableKey).then((nextSetting) => {
      if (!active) {
        return;
      }
      setSetting(nextSetting);
      setInitialized(true);
    });
    return () => {
      active = false;
    };
  }, [tableKey]);

  return { setting, setSetting, initialized };
}

function resolveAppliedColumns<T>(
  baseColumns: SettingColumn<T>[],
  setting: TableColumnSetting | null,
  options: Pick<UseTableColumnSettingsOptions, 'tableSize' | 'scroll'>,
) {
  const columns = applyColumnSettings(baseColumns, setting);
  const tableSize = setting?.tableSize || options.tableSize;
  const scroll = resolveTableScroll(options.scroll, setting);
  return { columns, tableSize, scroll };
}

/** 仅读取并套用已保存配置，不渲染设置弹窗（用于拆解抽屉等） */
export function useAppliedTableColumnSettings<T>(
  tableKey: TableColumnSettingKey,
  baseColumns: SettingColumn<T>[],
  options: Pick<UseTableColumnSettingsOptions, 'tableSize' | 'scroll'> = {},
) {
  const { setting, initialized } = useTableColumnSettingState(tableKey);

  const applied = useMemo(
    () => resolveAppliedColumns(baseColumns, setting, options),
    [baseColumns, options, setting],
  );

  return {
    ...applied,
    setting,
    initialized,
  };
}

export function useTableColumnSettings<T>(
  tableKey: TableColumnSettingKey,
  baseColumns: SettingColumn<T>[],
  options: UseTableColumnSettingsOptions = {},
) {
  const { setting, setSetting, initialized } = useTableColumnSettingState(tableKey);
  const [modalOpen, setModalOpen] = useState(false);

  const applied = useMemo(
    () => resolveAppliedColumns(baseColumns, setting, options),
    [baseColumns, options, setting],
  );

  const catalogColumns = options.settingCatalog ?? (baseColumns as SettingColumn[]);

  const initData = useMemo<ColumnsSettingInitData>(
    () => ({
      tableKey,
      columns: catalogColumns,
      tableSize: options.tableSize,
      columnSpan: options.columnSpan,
      disabledSize: options.disabledSize,
    }),
    [catalogColumns, options.columnSpan, options.disabledSize, options.tableSize, tableKey],
  );

  const openSettings = useCallback(() => {
    setModalOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSave = useCallback((nextSetting: TableColumnSetting) => {
    setSetting(nextSetting);
  }, [setSetting]);

  const settingsModal = (
    <TableColumnSettingsModal
      open={modalOpen}
      initData={initData}
      onClose={closeSettings}
      onSave={handleSave}
    />
  );

  return {
    columns: applied.columns,
    tableSize: applied.tableSize,
    scroll: applied.scroll,
    setting,
    initialized,
    openSettings,
    closeSettings,
    settingsModal,
  };
}
