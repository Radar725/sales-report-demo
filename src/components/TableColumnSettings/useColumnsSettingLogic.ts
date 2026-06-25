import { useCallback, useMemo, useState } from 'react';
import type { DragEndEvent } from '@dnd-kit/core';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import { loadTableColumnSetting } from './storage';
import type {
  ColumnSettingItem,
  ColumnsSettingInitData,
  SettingColumn,
  TableColumnSetting,
} from './types';

type TempItem = { key: string; index: number };

function getColumnTitle(column: SettingColumn) {
  if (typeof column.title === 'function') {
    return column.title({});
  }
  return column.title;
}

function buildStateFromInit(
  initData: ColumnsSettingInitData,
  history: TableColumnSetting | null,
  isReset = false,
) {
  const columnMap = new Map<string, ColumnSettingItem>();
  const renderList: TempItem[] = [];
  const leftList: TempItem[] = [];
  const rightList: TempItem[] = [];

  let fixedY = true;
  if (!isReset && history?.fixedY !== undefined) {
    fixedY = history.fixedY;
  }

  for (const column of initData.columns) {
    if (column.disabledSetting) {
      continue;
    }

    const key = column.key;
    if (typeof key !== 'string') {
      continue;
    }

    const nextColumn: ColumnSettingItem = {
      key,
      title: getColumnTitle(column),
      filterTitle: column.filterTitle,
      fixed: column.fixed === 'left' || column.fixed === 'right' ? column.fixed : undefined,
      hidden: column.hidden,
      index: -1,
    };

    const oldItem = !isReset ? history?.columns[key] : undefined;
    if (oldItem) {
      nextColumn.hidden = oldItem.hidden;
      nextColumn.fixed = oldItem.fixed;
      nextColumn.index = oldItem.index ?? -1;
    }

    columnMap.set(key, nextColumn);
    if (nextColumn.hidden) {
      continue;
    }

    const item = { key, index: nextColumn.index ?? -1 };
    if (nextColumn.fixed === 'left') {
      leftList.push(item);
      continue;
    }
    if (nextColumn.fixed === 'right') {
      rightList.push(item);
      continue;
    }
    renderList.push(item);
  }

  renderList.sort((a, b) => a.index - b.index);
  leftList.sort((a, b) => a.index - b.index);
  rightList.sort((a, b) => a.index - b.index);

  return {
    columnMap,
    renderList: renderList.map((item) => item.key),
    leftList: leftList.map((item) => item.key),
    rightList: rightList.map((item) => item.key),
    tableSize: (!isReset && history?.tableSize) || initData.tableSize || 'middle',
    fixedY,
  };
}

export function useColumnsSettingLogic(initData: ColumnsSettingInitData | null) {
  const [columnMap, setColumnMap] = useState<Map<string, ColumnSettingItem>>(new Map());
  const [renderList, setRenderList] = useState<string[]>([]);
  const [leftList, setLeftList] = useState<string[]>([]);
  const [rightList, setRightList] = useState<string[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [tableSize, setTableSize] = useState<SizeType>('middle');
  const [fixedY, setFixedY] = useState(true);
  const [saving, setSaving] = useState(false);

  const initialize = useCallback(async (data: ColumnsSettingInitData, isReset = false) => {
    const history = isReset ? null : await loadTableColumnSetting(data.tableKey);
    const nextState = buildStateFromInit(data, history, isReset);
    setColumnMap(nextState.columnMap);
    setRenderList(nextState.renderList);
    setLeftList(nextState.leftList);
    setRightList(nextState.rightList);
    setTableSize(nextState.tableSize);
    setFixedY(nextState.fixedY);
    setSearchVal('');
  }, []);

  const resetState = useCallback(() => {
    setColumnMap(new Map());
    setRenderList([]);
    setLeftList([]);
    setRightList([]);
    setSearchVal('');
    setTableSize('middle');
    setFixedY(true);
  }, []);

  const changeHidden = useCallback((key: string) => {
    setColumnMap((prev) => {
      const record = prev.get(key);
      if (!record) {
        return prev;
      }

      const nextRecord = { ...record, hidden: !record.hidden };
      const nextMap = new Map(prev);
      nextMap.set(key, nextRecord);

      if (nextRecord.hidden) {
        setRenderList((list) => list.filter((item) => item !== key));
        setLeftList((list) => list.filter((item) => item !== key));
        setRightList((list) => list.filter((item) => item !== key));
        return nextMap;
      }

      if (nextRecord.fixed === 'left') {
        setLeftList((list) => (list.includes(key) ? list : [...list, key]));
      } else if (nextRecord.fixed === 'right') {
        setRightList((list) => (list.includes(key) ? list : [...list, key]));
      } else {
        setRenderList((list) => (list.includes(key) ? list : [...list, key]));
      }

      return nextMap;
    });
  }, []);

  const syncVisibleLists = useCallback((nextMap: Map<string, ColumnSettingItem>) => {
    const nextRender: string[] = [];
    const nextLeft: string[] = [];
    const nextRight: string[] = [];

    for (const [key, record] of nextMap) {
      if (record.hidden) {
        continue;
      }
      if (record.fixed === 'left') {
        nextLeft.push(key);
        continue;
      }
      if (record.fixed === 'right') {
        nextRight.push(key);
        continue;
      }
      nextRender.push(key);
    }

    setRenderList(nextRender);
    setLeftList(nextLeft);
    setRightList(nextRight);
  }, []);

  const multipleChoices = useCallback((checked: boolean) => {
    setColumnMap((prev) => {
      const next = new Map(prev);
      for (const [key, record] of next) {
        next.set(key, { ...record, hidden: !checked });
      }
      syncVisibleLists(next);
      return next;
    });
  }, [syncVisibleLists]);

  const cancelFixed = useCallback((key: string) => {
    setColumnMap((prev) => {
      const record = prev.get(key);
      if (!record) {
        return prev;
      }
      const next = new Map(prev);
      next.set(key, { ...record, fixed: undefined });
      return next;
    });
    setLeftList((prev) => prev.filter((item) => item !== key));
    setRightList((prev) => prev.filter((item) => item !== key));
    setRenderList((prev) => [key, ...prev.filter((item) => item !== key)]);
  }, []);

  const fixedToLeft = useCallback((key: string) => {
    setColumnMap((prev) => {
      const record = prev.get(key);
      if (!record) {
        return prev;
      }
      const next = new Map(prev);
      next.set(key, { ...record, fixed: 'left' });
      return next;
    });
    setRenderList((prev) => prev.filter((item) => item !== key));
    setRightList((prev) => prev.filter((item) => item !== key));
    setLeftList((prev) => [...prev.filter((item) => item !== key), key]);
  }, []);

  const fixedToRight = useCallback((key: string) => {
    setColumnMap((prev) => {
      const record = prev.get(key);
      if (!record) {
        return prev;
      }
      const next = new Map(prev);
      next.set(key, { ...record, fixed: 'right' });
      return next;
    });
    setRenderList((prev) => prev.filter((item) => item !== key));
    setLeftList((prev) => prev.filter((item) => item !== key));
    setRightList((prev) => [...prev.filter((item) => item !== key), key]);
  }, []);

  const onDragEnd = useCallback((event: DragEndEvent) => {
    if (!event.active || !event.over || event.active.id === event.over.id) {
      return;
    }

    const key = String(event.active.id);
    const record = columnMap.get(key);
    if (!record) {
      return;
    }

    const listKey =
      record.fixed === 'left' ? 'leftList' : record.fixed === 'right' ? 'rightList' : 'renderList';

    const currentList =
      listKey === 'leftList' ? leftList : listKey === 'rightList' ? rightList : renderList;

    const nextList: string[] = [];
    if (event.over.id === '_tx_') {
      nextList.push(key);
    }

    for (const item of currentList) {
      if (item === event.over.id) {
        nextList.push(String(event.over.id));
        nextList.push(key);
        continue;
      }
      if (item === key) {
        continue;
      }
      nextList.push(item);
    }

    if (listKey === 'leftList') {
      setLeftList(nextList);
    } else if (listKey === 'rightList') {
      setRightList(nextList);
    } else {
      setRenderList(nextList);
    }
  }, [columnMap, leftList, renderList, rightList]);

  const submit = useCallback(async () => {
    if (!initData?.tableKey) {
      return null;
    }

    setSaving(true);
    try {
      const output: TableColumnSetting = {
        columns: {},
        tableSize,
        fixedY,
      };

      const replyMap = new Map(columnMap);

      leftList.forEach((key, index) => {
        const record = columnMap.get(key);
        if (!record) {
          return;
        }
        replyMap.delete(key);
        output.columns[key] = {
          fixed: 'left',
          hidden: !!record.hidden,
          index,
        };
      });

      renderList.forEach((key, index) => {
        const record = columnMap.get(key);
        if (!record) {
          return;
        }
        replyMap.delete(key);
        output.columns[key] = {
          fixed: undefined,
          hidden: !!record.hidden,
          index,
        };
      });

      rightList.forEach((key, index) => {
        const record = columnMap.get(key);
        if (!record) {
          return;
        }
        replyMap.delete(key);
        output.columns[key] = {
          fixed: 'right',
          hidden: !!record.hidden,
          index,
        };
      });

      let hiddenIndex = 0;
      for (const [key, record] of replyMap) {
        output.columns[key] = {
          fixed: record.fixed,
          hidden: true,
          index: hiddenIndex,
        };
        hiddenIndex += 1;
      }

      return output;
    } finally {
      setSaving(false);
    }
  }, [columnMap, fixedY, initData?.tableKey, leftList, renderList, rightList, tableSize]);

  const checkedAll = useMemo(
    () => columnMap.size === renderList.length + leftList.length + rightList.length,
    [columnMap.size, leftList.length, renderList.length, rightList.length],
  );

  const indeterminate = useMemo(() => {
    if (checkedAll) {
      return false;
    }
    return renderList.length > 0 || leftList.length > 0 || rightList.length > 0;
  }, [checkedAll, leftList.length, renderList.length, rightList.length]);

  const filteredColumns = useMemo(() => {
    if (!initData) {
      return [];
    }
    if (!searchVal) {
      return initData.columns.filter((column) => typeof column.key === 'string' && columnMap.has(column.key));
    }
    return initData.columns.filter((column) => {
      if (typeof column.key !== 'string' || !columnMap.has(column.key)) {
        return false;
      }
      if (column.filterTitle) {
        return column.filterTitle.includes(searchVal);
      }
      if (typeof column.title === 'string') {
        return column.title.includes(searchVal);
      }
      return false;
    });
  }, [columnMap, initData, searchVal]);

  return {
    columnMap,
    renderList,
    leftList,
    rightList,
    searchVal,
    tableSize,
    fixedY,
    saving,
    checkedAll,
    indeterminate,
    filteredColumns,
    initialize,
    resetState,
    changeSearchVal: setSearchVal,
    changeTableSize: setTableSize,
    changeFixedY: setFixedY,
    changeHidden,
    multipleChoices,
    cancelFixed,
    fixedToLeft,
    fixedToRight,
    onDragEnd,
    submit,
  };
}
