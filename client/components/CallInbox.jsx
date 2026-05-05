import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatDateTime, humanize } from '../data/formatters.js';

function Urgency({ value }) {
  return <span className={`urgency urgency-${value}`}>{value}</span>;
}

export function CallInbox({ calls, selectedCallId, onSelect }) {
  return (
    <section className="panel call-inbox" id="calls">
      <div className="panel-heading">
        <div>
          <h2>Missed-call inbox</h2>
          <p>Prioritized by urgency, due state, and callback outcome.</p>
        </div>
      </div>
      <div className="call-list" role="list">
        {calls.map((call) => (
          <button
            type="button"
            role="listitem"
            className={`call-row ${call.id === selectedCallId ? 'selected' : ''}`}
            key={call.id}
            onClick={() => onSelect(call.id)}
          >
            <div className="call-main">
              <strong>{call.caller_name}</strong>
              <span>{call.caller_number_display} · {formatDateTime(call.call_time)}</span>
              <p>{call.intent_summary}</p>
            </div>
            <div className="call-meta">
              <Urgency value={call.urgency} />
              <span className="due-line"><Clock size={14} /> {formatDateTime(call.due_at)}</span>
              <span className={`task-state ${call.callback_status || 'open'}`}>
                {call.callback_status === 'completed' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {humanize(call.outcome || call.callback_status)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
