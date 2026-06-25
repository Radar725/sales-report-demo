import type { TableColumnSetting, TableColumnSettingKey } from './types';

const STORAGE_PREFIX = 'table-column-settings';

function getStorageKey(tableKey: TableColumnSettingKey) {
  return `${STORAGE_PREFIX}:${tableKey}`;
}

export async function loadTableColumnSetting(
  tableKey: TableColumnSettingKey,
): Promise<TableColumnSetting | null> {
  try {
    const raw = localStorage.getItem(getStorageKey(tableKey));
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as TableColumnSetting;
  } catch {
    return null;
  }
}

export async function saveTableColumnSetting(
  tableKey: TableColumnSettingKey,
  setting: TableColumnSetting,
): Promise<void> {
  localStorage.setItem(getStorageKey(tableKey), JSON.stringify(setting));
}
