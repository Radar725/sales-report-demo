import { useEffect, useMemo } from 'react';
import { Button, Modal } from 'antd';
import { ColumnsSettingContext } from './context';
import { ModalBody, ModalTitle } from './ModalContent';
import { saveTableColumnSetting } from './storage';
import type { ColumnsSettingInitData, TableColumnSetting } from './types';
import { useColumnsSettingLogic } from './useColumnsSettingLogic';
import './modal.css';

type TableColumnSettingsModalProps = {
  open: boolean;
  initData: ColumnsSettingInitData | null;
  onClose: () => void;
  onSave?: (setting: TableColumnSetting) => void;
};

export default function TableColumnSettingsModal({
  open,
  initData,
  onClose,
  onSave,
}: TableColumnSettingsModalProps) {
  const logic = useColumnsSettingLogic(initData);

  useEffect(() => {
    if (open && initData) {
      void logic.initialize(initData);
      return;
    }
    if (!open) {
      logic.resetState();
    }
  }, [open, initData, logic.initialize, logic.resetState]);

  const contextValue = useMemo(
    () => ({
      initData,
      columnMap: logic.columnMap,
      renderList: logic.renderList,
      leftList: logic.leftList,
      rightList: logic.rightList,
      searchVal: logic.searchVal,
      tableSize: logic.tableSize,
      fixedY: logic.fixedY,
      saving: logic.saving,
      checkedAll: logic.checkedAll,
      indeterminate: logic.indeterminate,
      filteredColumns: logic.filteredColumns,
      changeSearchVal: (value?: string) => logic.changeSearchVal(value ?? ''),
      changeTableSize: logic.changeTableSize,
      changeFixedY: logic.changeFixedY,
      changeHidden: logic.changeHidden,
      multipleChoices: logic.multipleChoices,
      cancelFixed: logic.cancelFixed,
      fixedToLeft: logic.fixedToLeft,
      fixedToRight: logic.fixedToRight,
      onDragEnd: logic.onDragEnd,
      resetAll: () => {
        if (initData) {
          void logic.initialize(initData, true);
        }
      },
      submit: logic.submit,
    }),
    [initData, logic],
  );

  const handleOk = async () => {
    const output = await logic.submit();
    if (!output || !initData?.tableKey) {
      return;
    }
    await saveTableColumnSetting(initData.tableKey, output);
    onSave?.(output);
    onClose();
  };

  return (
    <ColumnsSettingContext.Provider value={contextValue}>
      <Modal
        className="table-column-settings-modal"
        open={open}
        width={1000}
        title={<ModalTitle />}
        destroyOnClose
        onCancel={onClose}
        confirmLoading={logic.saving}
        onOk={() => {
          void handleOk();
        }}
        styles={{
          body: {
            height: '60vh',
            overflowX: 'hidden',
          },
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <CancelBtn />
            <Button
              onClick={() => {
                if (initData) {
                  void logic.initialize(initData, true);
                }
              }}
            >
              重置
            </Button>
            <OkBtn />
          </>
        )}
      >
        <ModalBody />
      </Modal>
    </ColumnsSettingContext.Provider>
  );
}
