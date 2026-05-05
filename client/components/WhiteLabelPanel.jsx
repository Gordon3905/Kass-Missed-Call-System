import { Palette } from 'lucide-react';
import { useEffect, useState } from 'react';

export function WhiteLabelPanel({ client, busy, onSave }) {
  const [draft, setDraft] = useState(client || {});

  useEffect(() => setDraft(client || {}), [client]);

  if (!client) return null;

  return (
    <section className="panel compact-panel">
      <div className="panel-heading">
        <div>
          <h2>White-label settings</h2>
          <p>Client brand, timezone, hours, and retention.</p>
        </div>
        <Palette size={18} />
      </div>
      <div className="form-grid">
        <label>
          Brand name
          <input value={draft.brand_name || ''} onChange={(event) => setDraft({ ...draft, brand_name: event.target.value })} />
        </label>
        <label>
          Primary color
          <input type="color" value={draft.primary_color || '#155EEF'} onChange={(event) => setDraft({ ...draft, primary_color: event.target.value })} />
        </label>
        <label>
          Logo URL
          <input value={draft.logo_url || ''} onChange={(event) => setDraft({ ...draft, logo_url: event.target.value })} />
        </label>
        <label>
          Timezone
          <input value={draft.timezone || ''} onChange={(event) => setDraft({ ...draft, timezone: event.target.value })} />
        </label>
        <label>
          Retention days
          <input type="number" value={draft.retention_days || 365} onChange={(event) => setDraft({ ...draft, retention_days: Number(event.target.value) })} />
        </label>
      </div>
      <button type="button" className="ghost-button full-width" disabled={busy} onClick={() => onSave(draft)}>Save brand settings</button>
    </section>
  );
}
