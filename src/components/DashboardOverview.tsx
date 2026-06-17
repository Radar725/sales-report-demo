import { Card } from 'antd';
import type { MetricKey, MetricValue } from '../domain/metrics';
import { formatMetricValue, metricGroups } from '../domain/metrics';

type DashboardOverviewProps = {
  summary: MetricValue;
};

const dashboardMetricKeys: MetricKey[] = [
  'reportedAmount',
  'confirmedAmount',
  'dealCount',
  'customerCount',
  'newDiagnosisAmount',
  'newDiagnosisDealCount',
  'newDiagnosisCustomerCount',
  'repurchaseAmount',
  'repurchaseDealCount',
  'repurchaseCustomerCount',
];

const metricDefinitions = metricGroups.flatMap((group) => group.metrics);

function getMetricDefinition(key: MetricKey) {
  const definition = metricDefinitions.find((metric) => metric.key === key);

  if (!definition) {
    throw new Error(`Missing metric definition: ${key}`);
  }

  return definition;
}

export default function DashboardOverview({ summary }: DashboardOverviewProps) {
  return (
    <div className="dashboard-grid">
      {dashboardMetricKeys.map((key) => {
        const metric = getMetricDefinition(key);

        return (
          <Card key={key} className="dashboard-metric-card">
            <div className="dashboard-metric-label">{metric.label}</div>
            <div className="dashboard-metric-value">
              {formatMetricValue(summary[key], metric.format)}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
