import { formatDateTime, humanize } from '../data/formatters.js';

export function LeadsView({ leads, selectedLeadId, onSelect }) {
  return (
    <section className="view-stack" id="leads-view">
      <div className="view-intro">
        <h2>Lead handoff</h2>
        <p>Clean lead cards for fast assignment and follow-through.</p>
      </div>
      <div className="simple-card-list">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className={`simple-card lead-card ${lead.id === selectedLeadId ? 'selected' : ''}`}
            onClick={() => onSelect(lead.id)}
          >
            <div className="simple-card-head">
              <div>
                <strong>{lead.name}</strong>
                <span>{lead.source}</span>
              </div>
              <span className="status-pill">{humanize(lead.status)}</span>
            </div>
            <div className="lead-grid">
              <div>
                <label>Status</label>
                <span>{humanize(lead.status)}</span>
              </div>
              <div>
                <label>Assigned rep</label>
                <span>{lead.assignedRep}</span>
              </div>
              <div>
                <label>Last activity</label>
                <span>{formatDateTime(lead.lastActivity)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
