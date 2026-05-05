import { Check, Headphones, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { formatDateTime, humanize } from '../data/formatters.js';

const outcomes = ['booked_meeting', 'voicemail_left', 'no_answer', 'not_qualified', 'wrong_number', 'resolved_no_meeting'];

export function CallDetail({ call, busy, onUrgencyChange, onComplete }) {
  const [outcome, setOutcome] = useState('booked_meeting');
  const [notes, setNotes] = useState('');

  if (!call) {
    return <section className="panel detail-panel"><h2>No calls yet</h2></section>;
  }

  return (
    <section className="panel detail-panel">
      <div className="panel-heading">
        <div>
          <h2>{call.caller_name}</h2>
          <p>{call.caller_number_display} · callback due {formatDateTime(call.due_at)}</p>
        </div>
        <select value={call.urgency} disabled={busy} onChange={(event) => onUrgencyChange(event.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="summary-block">
        <MessageSquareText size={18} />
        <div>
          <span>AI intent summary</span>
          <p>{call.intent_summary}</p>
        </div>
      </div>

      <div className="transcript-box">
        <div><Headphones size={16} /> Voicemail transcript</div>
        <p>{call.voicemail_transcript}</p>
      </div>

      <div className="outcome-grid">
        <label>
          Outcome
          <select value={outcome} disabled={busy || call.callback_status === 'completed'} onChange={(event) => setOutcome(event.target.value)}>
            {outcomes.map((item) => <option value={item} key={item}>{humanize(item)}</option>)}
          </select>
        </label>
        <label>
          Notes
          <input value={notes} disabled={busy || call.callback_status === 'completed'} onChange={(event) => setNotes(event.target.value)} placeholder="Callback notes" />
        </label>
      </div>

      <button
        type="button"
        className="primary-button full-width"
        disabled={busy || call.callback_status === 'completed' || !call.callback_task_id}
        onClick={() => onComplete({ outcome, outcome_notes: notes })}
      >
        <Check size={16} />
        Complete callback
      </button>

      <div className="detail-footer">
        <span>Status: {humanize(call.callback_status)}</span>
        <span>Outcome: {humanize(call.outcome)}</span>
        <span>Escalated: {call.escalated_at ? formatDateTime(call.escalated_at) : 'No'}</span>
      </div>
    </section>
  );
}
