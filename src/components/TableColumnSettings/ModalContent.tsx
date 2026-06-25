import { Checkbox, Col, Empty, Input, Radio, Row } from 'antd';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import {
  CloseOutlined,
  HolderOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { useColumnsSettingContext } from './context';

function ModalTitle() {
  const { searchVal, changeSearchVal } = useColumnsSettingContext();
  return (
    <div className="modal-title-row">
      <span className="title-text">列表配置</span>
      <Input
        style={{ width: 240 }}
        value={searchVal}
        onChange={(event) => changeSearchVal(event.target.value)}
        allowClear
        placeholder="请输入字段标题"
      />
    </div>
  );
}

function TableSizePicker() {
  const { initData, tableSize, changeTableSize } = useColumnsSettingContext();
  if (initData?.disabledSize) {
    return null;
  }

  return (
    <div className="settings-inline-group">
      <div>
        <div className="settings-label">列表尺寸</div>
        <Radio.Group
          optionType="button"
          buttonStyle="solid"
          value={tableSize}
          onChange={(event) => changeTableSize(event.target.value as SizeType)}
          options={[
            { label: '宽松', value: 'large' },
            { label: '适中', value: 'middle' },
            { label: '紧凑', value: 'small' },
          ]}
        />
      </div>
    </div>
  );
}

function FixedYPicker() {
  const { fixedY, changeFixedY } = useColumnsSettingContext();
  return (
    <div>
      <div className="settings-label">列表高度</div>
      <Radio.Group
        optionType="button"
        buttonStyle="solid"
        value={fixedY}
        onChange={(event) => changeFixedY(event.target.value)}
        options={[
          { label: '不固定', value: false },
          { label: '固定', value: true },
        ]}
      />
    </div>
  );
}

function PickerHeader() {
  const { checkedAll, indeterminate, multipleChoices } = useColumnsSettingContext();
  return (
    <div className="picker-header">
      <span className="picker-header-label">可选字段</span>
      <Checkbox
        checked={checkedAll}
        indeterminate={indeterminate}
        onChange={(event) => multipleChoices(event.target.checked)}
      >
        全选
      </Checkbox>
    </div>
  );
}

function AllKeyPicker() {
  const { initData, columnMap, filteredColumns, changeHidden } = useColumnsSettingContext();
  const columnSpan = initData?.columnSpan ?? 6;

  if (!filteredColumns.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Empty description="没有相关的列表项" />
      </div>
    );
  }

  return (
    <Row gutter={[12, 12]}>
      {filteredColumns.map((column) => {
        const key = String(column.key);
        const record = columnMap.get(key);
        if (!record) {
          return null;
        }
        return (
          <Col span={columnSpan} key={key}>
            <Checkbox checked={!record.hidden} onChange={() => changeHidden(key)}>
              {record.filterTitle || record.title}
            </Checkbox>
          </Col>
        );
      })}
    </Row>
  );
}

function ColumnRowItem({ dataKey }: { dataKey: string }) {
  const { columnMap, changeHidden, cancelFixed, fixedToLeft, fixedToRight } = useColumnsSettingContext();
  const record = columnMap.get(dataKey);
  const { setNodeRef } = useDroppable({ id: dataKey });
  const { attributes, listeners, setNodeRef: setDragNodeRef, transform } = useDraggable({ id: dataKey });

  if (!record) {
    return null;
  }

  const isFixed = record.fixed === 'left' || record.fixed === 'right';
  const style: React.CSSProperties = {};
  if (transform) {
    style.transform = `translate3d(${transform.x}px, ${transform.y}px, 0)`;
    style.opacity = 0.7;
  }

  return (
    <div className="column-row" style={style} ref={setNodeRef} {...attributes}>
      <HolderOutlined className="column-row-action" ref={setDragNodeRef} {...listeners} />
      <span className="column-row-title">{record.filterTitle || record.title}</span>
      <span className="column-row-actions">
        {!isFixed && (
          <VerticalAlignTopOutlined className="column-row-action" onClick={() => fixedToLeft(dataKey)} />
        )}
        {!isFixed && (
          <VerticalAlignBottomOutlined className="column-row-action" onClick={() => fixedToRight(dataKey)} />
        )}
        {isFixed && (
          <VerticalAlignMiddleOutlined className="column-row-action is-visible" onClick={() => cancelFixed(dataKey)} />
        )}
        <CloseOutlined className="column-row-action is-visible" onClick={() => changeHidden(dataKey)} />
      </span>
    </div>
  );
}

function KeyRow({ list, title }: { list: string[]; title: string }) {
  const { onDragEnd } = useColumnsSettingContext();
  const { setNodeRef } = useDroppable({ id: '_tx_' });

  if (!list.length) {
    return null;
  }

  return (
    <div>
      <DndContext onDragEnd={onDragEnd}>
        <div className="settings-section-title" ref={setNodeRef}>
          {title}
        </div>
        {list.map((key) => (
          <ColumnRowItem key={key} dataKey={key} />
        ))}
      </DndContext>
    </div>
  );
}

function ModalBody() {
  const { leftList, renderList, rightList } = useColumnsSettingContext();
  return (
    <div className="settings-layout">
      <div className="settings-left">
        <div className="settings-inline-group">
          <TableSizePicker />
          <FixedYPicker />
        </div>
        <PickerHeader />
        <AllKeyPicker />
      </div>
      <div className="settings-right">
        <KeyRow list={leftList} title="固定在左侧" />
        <KeyRow list={renderList} title="不固定" />
        <KeyRow list={rightList} title="固定在右侧" />
      </div>
    </div>
  );
}

export { ModalTitle, ModalBody };
