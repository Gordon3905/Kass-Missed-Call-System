import { Clock3, Phone, ShieldBan, Sparkles } from 'lucide-react';
import { formatDateTime } from '../data/formatters.js';

function truncateSummary(text) {
  const sentence = String(text || '').split(/[.!?]/)[0];
  return sentence ? `${sentence.trim()}.` : 'No intent summary yet.';
}

function scoreConfidence(call) {
  const base = call.urgency === 'high' ? 92 : call.urgency === 'medium' ? 81 : 73;
  if (call.voicemail_transcript) return base;
  return Math.max(base - 12, 55);
}

export function CallsView({ calls, selectedCallId, onSelect, onCallback, onNurture, onSpam }) {
  return (
    <section className="view-stack" id="calls-view">
      <div className="view-intro">
        <h2>Missed-call queue</h2>
        <p>Only the details a rep needs to decide what to do next.</p>
      </div>
      <div className="simple-card-list">
        {calls.map((call) => (
          <article
            key={call.id}
            className={`simple-card ${call.id === selectedCallId ? 'selected' : ''}`}
            onClick={() => onSelect(call.id)}
          >
            <div className="simple-card-head">
              <div>
                <strong>{call.caller_name}</strong>
                <span>{call.caller_number_display}</span>
              </div>
              <time dateTime={call.call_time}>
                <Clock3 size={14} />
                {formatDateTime(call.call_time)}
              </time>
            </div>
            <p className="intent-line">{truncateSummary(call.intent_summary)}</p>
            <div className="simple-meta-row">
              <span className="confidence-pill">
                <Sparkles size={14} />
                {scoreConfidence(call)}% confidence
              </span>
            </div>
            <div className="action-row">
              <button type="button" className="primary-button" onClick={(event) => { event.stopPropagation(); onCallback(call); }}>
                <Phone size={14} />
                Callback
              </button>
              <button type="button" className="ghost-button" onClick={(event) => { event.stopPropagation(); onNurture(call); }}>
                Add to nurture
              </button>
              <button type="button" className="ghost-button danger-button" onClick={(event) => { event.stopPropagation(); onSpam(call); }}>
                <ShieldBan size={14} />
                Mark spam
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
