import { SettingOutlined } from '@ant-design/icons';
import { Button } from 'antd';

type ActionsColumnTitleProps = {
  onCustomizeClick: () => void;
};

export function ActionsColumnTitle({ onCustomizeClick }: ActionsColumnTitleProps) {
  return (
    <span className="actions-column-title">
      <span>操作</span>
      <Button
        type="text"
        size="small"
        className="actions-column-settings"
        icon={<SettingOutlined />}
        aria-label="列表自定义"
        onClick={(event) => {
          event.stopPropagation();
          onCustomizeClick();
        }}
      />
    </span>
  );
}
