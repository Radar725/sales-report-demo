import { createElement } from 'react';
import { expect, vi } from 'vitest';
import type { TableProps } from 'antd/es/table';

export const tableRenderSpy = vi.fn<(props: TableProps<Record<string, unknown>>) => void>();

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const ActualTable = actual.Table;

  function Table(props: TableProps<Record<string, unknown>>) {
    tableRenderSpy(props);
    return createElement(ActualTable, props as never);
  }

  return { ...actual, Table };
});

export function getReportTableProps() {
  return tableRenderSpy.mock.calls
    .map(([props]) => props)
    .filter((props) => props.className === 'report-table');
}

export function expectReportTablesUseSorterIconTooltip() {
  const reportTables = getReportTableProps();
  expect(reportTables.length).toBeGreaterThan(0);
  reportTables.forEach((props) => {
    expect(props.showSorterTooltip).toEqual({ target: 'sorter-icon' });
  });
}
