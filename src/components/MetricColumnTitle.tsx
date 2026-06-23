import { Tooltip } from 'antd';

type MetricColumnTitleProps = {
  label: string;
  description: string;
};

export function MetricColumnTitle({ label, description }: MetricColumnTitleProps) {
  return (
    <Tooltip title={description}>
      <span className="metric-column-title">{label}</span>
    </Tooltip>
  );
}
