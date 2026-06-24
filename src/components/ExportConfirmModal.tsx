import { Modal } from 'antd';

type ExportConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ExportConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: ExportConfirmModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认"
      cancelText="取消"
      destroyOnHidden
    >
      <p>{description}</p>
    </Modal>
  );
}
