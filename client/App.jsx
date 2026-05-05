import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { AppShell } from './components/AppShell.jsx';
import { MetricsBar } from './components/MetricsBar.jsx';
import { CallInbox } from './components/CallInbox.jsx';
import { CallDetail } from './components/CallDetail.jsx';
import { SequenceEditor } from './components/SequenceEditor.jsx';
import { WhiteLabelPanel } from './components/WhiteLabelPanel.jsx';
import { IntegrationStatus } from './components/IntegrationStatus.jsx';

const CLIENT_ID = 'client_covault_demo';

export function App() {
  const [metrics, setMetrics] = useState(null);
  const [calls, setCalls] = useState([]);
  const [client, setClient] = useState(null);
  const [sequences, setSequences] = useState({ sequences: [], templates: [] });
  const [integrations, setIntegrations] = useState(null);
  const [selectedCallId, setSelectedCallId] = useState('');
  const [status, setStatus] = useState('Loading dashboard...');
  const [busy, setBusy] = useState(false);

  const selectedCall = useMemo(
    () => calls.find((call) => call.id === selectedCallId) || calls[0] || null,
    [calls, selectedCallId],
  );

  async function refresh(nextStatus = 'Dashboard refreshed') {
    const [nextMetrics, nextCalls, nextClient, nextSequences, nextIntegrations] = await Promise.all([
      api.getMetrics(),
      api.getCalls(),
      api.getClient(CLIENT_ID),
      api.getSequences(CLIENT_ID),
      api.getIntegrations(),
    ]);
    setMetrics(nextMetrics);
    setCalls(nextCalls);
    setClient(nextClient);
    setSequences(nextSequences);
    setIntegrations(nextIntegrations);
    setSelectedCallId((current) => current || nextCalls[0]?.id || '');
    setStatus(nextStatus);
  }

  async function withBusy(label, action) {
    setBusy(true);
    setStatus(label);
    try {
      await action();
      await refresh('Saved');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refresh().catch((error) => setStatus(error.message));
  }, []);

  const brandStyle = client ? { '--brand': client.primary_color } : undefined;

  return (
    <AppShell
      client={client}
      status={status}
      busy={busy}
      style={brandStyle}
      onProcessDemo={() => withBusy('Processing sample missed call...', () => api.processDemoCall())}
      onEscalate={() => withBusy('Checking stale high-priority callbacks...', () => api.escalateStale())}
    >
      <MetricsBar metrics={metrics} />
      <section className="workspace-grid">
        <CallInbox
          calls={calls}
          selectedCallId={selectedCall?.id}
          onSelect={setSelectedCallId}
        />
        <CallDetail
          call={selectedCall}
          busy={busy}
          onUrgencyChange={(urgency) => withBusy('Updating urgency...', () => api.updateUrgency(selectedCall.id, urgency))}
          onComplete={(payload) => withBusy('Completing callback...', () => api.completeCallback(selectedCall.callback_task_id, payload))}
        />
      </section>
      <section className="settings-grid">
        <SequenceEditor
          data={sequences}
          busy={busy}
          onSave={(payload) => withBusy('Saving follow-up sequences...', () => api.updateSequences(CLIENT_ID, payload))}
        />
        <div className="side-stack">
          <WhiteLabelPanel
            client={client}
            busy={busy}
            onSave={(payload) => withBusy('Saving client settings...', () => api.updateClient(CLIENT_ID, payload))}
          />
          <IntegrationStatus integrations={integrations} />
        </div>
      </section>
    </AppShell>
  );
}
