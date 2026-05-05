import { PlugZap } from 'lucide-react';

export function IntegrationStatus({ integrations }) {
  const providers = integrations?.providers || {};
  return (
    <section className="panel compact-panel">
      <div className="panel-heading">
        <div>
          <h2>Integration status</h2>
          <p>Provider modes are visible for demo and live readiness.</p>
        </div>
        <PlugZap size={18} />
      </div>
      <div className="integration-grid">
        {Object.entries(providers).map(([name, provider]) => (
          <div className="integration-row" key={name}>
            <span>{name}</span>
            <strong>{provider.mode}</strong>
            <em>{provider.status}</em>
          </div>
        ))}
      </div>
    </section>
  );
}
