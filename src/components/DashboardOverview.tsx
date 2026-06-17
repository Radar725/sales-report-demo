import type { MetricKey, MetricValue } from '../domain/metrics';
import { formatMetricValue, metricGroups } from '../domain/metrics';

type DashboardOverviewProps = {
  summary: MetricValue;
};

const metricDefinitions = metricGroups.flatMap((group) => group.metrics);

function getMetricDefinition(key: MetricKey) {
  const definition = metricDefinitions.find((metric) => metric.key === key);

  if (!definition) {
    throw new Error(`Missing metric definition: ${key}`);
  }

  return definition;
}

function MetricValueBlock({
  metricKey,
  summary,
  emphasis = false,
}: {
  metricKey: MetricKey;
  summary: MetricValue;
  emphasis?: boolean;
}) {
  const metric = getMetricDefinition(metricKey);

  return (
    <div className={emphasis ? 'dashboard-primary-metric' : 'dashboard-metric-block'}>
      <div className="dashboard-metric-label">{metric.label}</div>
      <div className="dashboard-metric-value">
        {formatMetricValue(summary[metricKey], metric.format)}
      </div>
    </div>
  );
}

function DealTypePanel({
  title,
  tone,
  amountKey,
  countKey,
  customerKey,
  summary,
}: {
  title: string;
  tone: 'new-diagnosis' | 'repurchase';
  amountKey: MetricKey;
  countKey: MetricKey;
  customerKey: MetricKey;
  summary: MetricValue;
}) {
  return (
    <section className="dashboard-quadrant dashboard-deal-panel">
      <div className="dashboard-panel-title">
        <span className={`dashboard-panel-marker dashboard-panel-marker-${tone}`} />
        <span>{title}</span>
      </div>
      <MetricValueBlock metricKey={amountKey} summary={summary} />
      <div className="dashboard-inline-metrics">
        <MetricValueBlock metricKey={countKey} summary={summary} />
        <MetricValueBlock metricKey={customerKey} summary={summary} />
      </div>
    </section>
  );
}

export default function DashboardOverview({ summary }: DashboardOverviewProps) {
  return (
    <div className="dashboard-summary-grid">
      <section className="dashboard-quadrant">
        <MetricValueBlock metricKey="reportedAmount" summary={summary} emphasis />
      </section>

      <section className="dashboard-quadrant">
        <h3 className="dashboard-section-title">成交概况</h3>
        <MetricValueBlock metricKey="confirmedAmount" summary={summary} />
        <div className="dashboard-inline-metrics">
          <MetricValueBlock metricKey="dealCount" summary={summary} />
          <MetricValueBlock metricKey="customerCount" summary={summary} />
        </div>
      </section>

      <DealTypePanel
        title="新诊成交"
        tone="new-diagnosis"
        amountKey="newDiagnosisAmount"
        countKey="newDiagnosisDealCount"
        customerKey="newDiagnosisCustomerCount"
        summary={summary}
      />

      <DealTypePanel
        title="复购成交"
        tone="repurchase"
        amountKey="repurchaseAmount"
        countKey="repurchaseDealCount"
        customerKey="repurchaseCustomerCount"
        summary={summary}
      />
    </div>
  );
}
