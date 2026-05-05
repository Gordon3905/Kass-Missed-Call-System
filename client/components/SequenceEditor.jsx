import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { humanize } from '../data/formatters.js';

const urgencyOrder = ['high', 'medium', 'low'];
const channels = ['sms', 'email'];

export function SequenceEditor({ data, busy, onSave }) {
  const [draft, setDraft] = useState(data);

  useEffect(() => setDraft(data), [data]);

  function updateSequence(urgency, patch) {
    setDraft((current) => ({
      ...current,
      sequences: current.sequences.map((sequence) => (sequence.urgency === urgency ? { ...sequence, ...patch } : sequence)),
    }));
  }

  function updateTemplate(urgency, channel, patch) {
    setDraft((current) => ({
      ...current,
      templates: current.templates.map((template) => (
        template.urgency === urgency && template.channel === channel ? { ...template, ...patch } : template
      )),
    }));
  }

  return (
    <section className="panel sequence-panel" id="settings">
      <div className="panel-heading">
        <div>
          <h2>Follow-up sequence editor</h2>
          <p>Per-client timing, escalation, and message templates across urgency tiers.</p>
        </div>
        <button type="button" className="primary-button" disabled={busy} onClick={() => onSave(draft)}>
          <Save size={16} />
          Save
        </button>
      </div>

      <div className="sequence-list">
        {urgencyOrder.map((urgency) => {
          const sequence = draft.sequences.find((item) => item.urgency === urgency);
          return (
            <article className="sequence-card" key={urgency}>
              <div className="sequence-card-head">
                <strong>{humanize(urgency)} urgency</strong>
                <label>
                  Due window
                  <input
                    type="number"
                    value={sequence?.due_window_minutes ?? 0}
                    onChange={(event) => updateSequence(urgency, { due_window_minutes: Number(event.target.value) })}
                  />
                </label>
                <label>
                  Escalation
                  <input
                    type="number"
                    value={sequence?.escalation_minutes ?? 30}
                    onChange={(event) => updateSequence(urgency, { escalation_minutes: Number(event.target.value) })}
                  />
                </label>
              </div>
              <div className="template-grid">
                {channels.map((channel) => {
                  const template = draft.templates.find((item) => item.urgency === urgency && item.channel === channel);
                  if (!template) return null;
                  return (
                    <label key={channel}>
                      {channel.toUpperCase()} template
                      <textarea
                        value={template.body}
                        rows={3}
                        onChange={(event) => updateTemplate(urgency, channel, { body: event.target.value })}
                      />
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
