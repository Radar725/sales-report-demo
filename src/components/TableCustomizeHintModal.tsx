import { Modal } from 'antd';

type TableCustomizeHintModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function TableCustomizeHintModal({ open, onClose }: TableCustomizeHintModalProps) {
  return (
    <Modal title="列表自定义" open={open} onCancel={onClose} onOk={onClose} okText="知道了" cancelButtonProps={{ style: { display: 'none' } }}>
      <p>支持用户自定义列表</p>
    </Modal>
  );
}
