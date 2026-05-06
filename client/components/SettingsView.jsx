import { ChevronDown, ChevronUp, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SequenceEditor } from './SequenceEditor.jsx';
import { WhiteLabelPanel } from './WhiteLabelPanel.jsx';
import { IntegrationStatus } from './IntegrationStatus.jsx';

export function SettingsView({ client, draft, sequences, integrations, busy, onSaveSimple, onSaveBrand, onSaveAdvanced }) {
  const [localDraft, setLocalDraft] = useState(draft);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalDraft(draft);
  }, [draft]);

  if (!client) return null;

  return (
    <section className="view-stack" id="settings-view">
      <div className="view-intro">
        <h2>Workspace settings</h2>
        <p>Keep scoring rules, teams, and reps easy to update without flooding the screen.</p>
      </div>

      <section className="panel settings-panel-simple">
        <div className="panel-heading">
          <div>
            <h2>Routing basics</h2>
            <p>Simple rules for how the team triages calls and leads.</p>
          </div>
          <button type="button" className="primary-button" disabled={busy} onClick={() => onSaveSimple(localDraft)}>
            <Save size={16} />
            Save settings
          </button>
        </div>
        <div className="form-grid simple-settings-grid">
          <label>
            Confidence threshold
            <input
              type="number"
              min="0"
              max="100"
              value={localDraft.scoring.confidenceThreshold}
              onChange={(event) => setLocalDraft((current) => ({
                ...current,
                scoring: { ...current.scoring, confidenceThreshold: Number(event.target.value) },
              }))}
            />
          </label>
          <label>
            Same-day callback window
            <input
              type="number"
              min="0"
              value={localDraft.scoring.sameDayCallbackMinutes}
              onChange={(event) => setLocalDraft((current) => ({
                ...current,
                scoring: { ...current.scoring, sameDayCallbackMinutes: Number(event.target.value) },
              }))}
            />
          </label>
          <label className="span-two">
            Teams
            <input
              value={localDraft.teamsText}
              onChange={(event) => setLocalDraft((current) => ({ ...current, teamsText: event.target.value }))}
              placeholder="Sales Team, Nurture Team"
            />
          </label>
          <label className="span-two">
            Reps
            <input
              value={localDraft.repsText}
              onChange={(event) => setLocalDraft((current) => ({ ...current, repsText: event.target.value }))}
              placeholder="Avery Johnson, Mina Patel, Jordan Lee"
            />
          </label>
          <label className="span-two">
            Spam keywords
            <input
              value={localDraft.scoring.spamKeywords}
              onChange={(event) => setLocalDraft((current) => ({
                ...current,
                scoring: { ...current.scoring, spamKeywords: event.target.value },
              }))}
              placeholder="wrong number, unsubscribe"
            />
          </label>
        </div>
      </section>

      <section className="panel advanced-panel">
        <button type="button" className="advanced-toggle" onClick={() => setShowAdvanced((current) => !current)}>
          <span>Advanced</span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {showAdvanced ? (
          <div className="advanced-content">
            <WhiteLabelPanel client={client} busy={busy} onSave={onSaveBrand} />
            <SequenceEditor data={sequences} busy={busy} onSave={onSaveAdvanced} />
            <IntegrationStatus integrations={integrations} />
          </div>
        ) : null}
      </section>
    </section>
  );
}
