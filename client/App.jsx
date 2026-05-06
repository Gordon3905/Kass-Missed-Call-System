import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { AppShell } from './components/AppShell.jsx';
import { CallsView } from './components/CallsView.jsx';
import { LeadsView } from './components/LeadsView.jsx';
import { SettingsView } from './components/SettingsView.jsx';

const CLIENT_ID = 'client_kavor_demo';

function buildLeadCards(calls, client) {
  const reps = client?.settings?.reps?.length ? client.settings.reps : ['Unassigned'];
  return calls.map((call, index) => ({
    id: `lead-${call.id}`,
    name: call.caller_name,
    source: call.source_provider === 'mock' ? 'Missed call' : call.source_provider,
    status: call.outcome || call.callback_status || 'new',
    assignedRep: reps[index % reps.length],
    lastActivity: call.completed_at || call.escalated_at || call.updated_at || call.call_time,
    summary: call.intent_summary,
  }));
}

function defaultSettings(client) {
  return {
    scoring: {
      confidenceThreshold: client?.settings?.scoring?.confidenceThreshold ?? 80,
      sameDayCallbackMinutes: client?.settings?.scoring?.sameDayCallbackMinutes ?? 30,
      spamKeywords: client?.settings?.scoring?.spamKeywords ?? 'wrong number, unsubscribe',
    },
    teamsText: (client?.settings?.teams || ['Sales Team', 'Nurture Team']).join(', '),
    repsText: (client?.settings?.reps || ['Avery Johnson', 'Mina Patel', 'Jordan Lee']).join(', '),
  };
}

export function App() {
  const [calls, setCalls] = useState([]);
  const [client, setClient] = useState(null);
  const [sequences, setSequences] = useState({ sequences: [], templates: [] });
  const [integrations, setIntegrations] = useState(null);
  const [selectedCallId, setSelectedCallId] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [activeTab, setActiveTab] = useState('calls');
  const [status, setStatus] = useState('Loading dashboard...');
  const [busy, setBusy] = useState(false);

  const selectedCall = useMemo(
    () => calls.find((call) => call.id === selectedCallId) || calls[0] || null,
    [calls, selectedCallId],
  );
  const leads = useMemo(() => buildLeadCards(calls, client), [calls, client]);
  const selectedLead = useMemo(
    () => leads.find((lead) => lead.id === selectedLeadId) || leads[0] || null,
    [leads, selectedLeadId],
  );

  async function refresh(nextStatus = 'Dashboard refreshed') {
    const [nextCalls, nextClient, nextSequences, nextIntegrations] = await Promise.all([
      api.getCalls(),
      api.getClient(CLIENT_ID),
      api.getSequences(CLIENT_ID),
      api.getIntegrations(),
    ]);
    setCalls(nextCalls);
    setClient(nextClient);
    setSequences(nextSequences);
    setIntegrations(nextIntegrations);
    setSelectedCallId((current) => current || nextCalls[0]?.id || '');
    setSelectedLeadId((current) => current || `lead-${nextCalls[0]?.id || ''}`);
    setStatus(nextStatus);
  }

  async function withBusy(label, action, successLabel = 'Saved') {
    setBusy(true);
    setStatus(label);
    try {
      await action();
      await refresh(successLabel);
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
  const settingsDraft = defaultSettings(client);

  const tabViews = {
    calls: (
      <CallsView
        calls={calls}
        selectedCallId={selectedCall?.id}
        onSelect={setSelectedCallId}
        onCallback={(call) => window.open(`tel:${call.caller_number_display.replace(/\s+/g, '')}`, '_self')}
        onNurture={(call) => withBusy('Adding caller to nurture...', () => api.completeCallback(call.callback_task_id, {
          outcome: 'voicemail_left',
          outcome_notes: 'Added to nurture from simplified dashboard.',
        }))}
        onSpam={(call) => withBusy('Marking caller as spam...', () => api.completeCallback(call.callback_task_id, {
          outcome: 'wrong_number',
          outcome_notes: 'Marked as spam from simplified dashboard.',
        }))}
      />
    ),
    leads: (
      <LeadsView
        leads={leads}
        selectedLeadId={selectedLead?.id}
        onSelect={setSelectedLeadId}
      />
    ),
    settings: (
      <SettingsView
        client={client}
        draft={settingsDraft}
        sequences={sequences}
        integrations={integrations}
        busy={busy}
        onSaveSimple={(draft) => withBusy('Saving workspace settings...', () => api.updateClient(CLIENT_ID, {
          ...client,
          settings: {
            scoring: draft.scoring,
            teams: draft.teamsText.split(',').map((item) => item.trim()).filter(Boolean),
            reps: draft.repsText.split(',').map((item) => item.trim()).filter(Boolean),
          },
        }))}
        onSaveBrand={(payload) => withBusy('Saving client settings...', () => api.updateClient(CLIENT_ID, payload))}
        onSaveAdvanced={(payload) => withBusy('Saving advanced follow-up settings...', () => api.updateSequences(CLIENT_ID, payload))}
      />
    ),
  };

  return (
    <AppShell
      client={client}
      status={status}
      busy={busy}
      style={brandStyle}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onProcessDemo={() => withBusy('Processing sample missed call...', () => api.processDemoCall(), 'Sample processed')}
      onEscalate={() => withBusy('Checking stale callbacks...', () => api.escalateStale(), 'Escalation check complete')}
    >
      {tabViews[activeTab]}
    </AppShell>
  );
}
