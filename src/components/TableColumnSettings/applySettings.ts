import type { ColumnsType } from 'antd/es/table';
import type { SettingColumn, TableColumnSetting } from './types';

function stripSettingMeta<T>(column: SettingColumn<T>): ColumnsType<T>[number] {
  const { filterTitle, disabledSetting, hidden, index, ...rest } = column;
  return rest;
}

function sortByIndex<T>(columns: SettingColumn<T>[]) {
  return [...columns].sort((left, right) => (left.index ?? 0) - (right.index ?? 0));
}

export function applyColumnSettings<T>(
  columns: SettingColumn<T>[],
  setting: TableColumnSetting | null,
): ColumnsType<T> {
  const leading: SettingColumn<T>[] = [];
  const trailing: SettingColumn<T>[] = [];
  const configurable: SettingColumn<T>[] = [];

  for (const column of columns) {
    if (column.disabledSetting) {
      if (column.fixed === 'right') {
        trailing.push(column);
      } else {
        leading.push(column);
      }
      continue;
    }
    configurable.push(column);
  }

  if (!setting || !Object.keys(setting.columns).length) {
    return [...leading, ...configurable, ...trailing].map(stripSettingMeta);
  }

  const left: SettingColumn<T>[] = [];
  const normal: SettingColumn<T>[] = [];
  const right: SettingColumn<T>[] = [];

  for (const column of configurable) {
    const key = column.key;
    if (typeof key !== 'string') {
      normal.push(column);
      continue;
    }

    const history = setting.columns[key];
    if (history?.hidden) {
      continue;
    }

    const nextColumn: SettingColumn<T> = {
      ...column,
      fixed: history?.fixed ?? column.fixed,
      index: history?.index ?? -1,
    };

    if (nextColumn.fixed === 'left') {
      left.push(nextColumn);
      continue;
    }
    if (nextColumn.fixed === 'right') {
      right.push(nextColumn);
      continue;
    }
    normal.push(nextColumn);
  }

  return [
    ...leading.map(stripSettingMeta),
    ...sortByIndex(left).map(stripSettingMeta),
    ...sortByIndex(normal).map(stripSettingMeta),
    ...sortByIndex(right).map(stripSettingMeta),
    ...trailing.map(stripSettingMeta),
  ];
}

export function resolveTableScroll(
  scroll: { x?: number | string | true; y?: number | string } | undefined,
  setting: TableColumnSetting | null,
) {
  if (!scroll?.y) {
    return scroll;
  }

  if (setting?.fixedY === false) {
    return { x: scroll.x };
  }

  return scroll;
}
