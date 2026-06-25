import { SettingOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import './settingBtn.css';

type SettingBtnProps = {
  onClick: () => void;
  title?: string;
};

export function SettingBtn({ onClick, title = '列表项配置' }: SettingBtnProps) {
  return (
    <Tooltip title={title}>
      <button type="button" className="table-column-setting-btn" onClick={onClick} aria-label={title}>
        <SettingOutlined />
      </button>
    </Tooltip>
  );
}
