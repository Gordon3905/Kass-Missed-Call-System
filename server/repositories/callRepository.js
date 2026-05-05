import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();

export function createCallRepository(db) {
  return {
    insertMissedCall(input) {
      const timestamp = now();
      const record = {
        id: input.id || nanoid(),
        client_id: input.client_id,
        caller_name: input.caller_name,
        caller_number_encrypted: input.caller_number_encrypted,
        caller_number_display: input.caller_number_display,
        call_time: input.call_time,
        duration_seconds: input.duration_seconds || 0,
        voicemail_recording_url_encrypted: input.voicemail_recording_url_encrypted,
        voicemail_transcript: input.voicemail_transcript || '',
        intent_summary: input.intent_summary || '',
        urgency: input.urgency || 'medium',
        status: input.status || 'processed',
        source_provider: input.source_provider || 'mock',
        provider_call_id: input.provider_call_id,
        created_at: input.created_at || timestamp,
        updated_at: input.updated_at || timestamp,
      };
      db.prepare(`
        INSERT INTO missed_calls
        (id, client_id, caller_name, caller_number_encrypted, caller_number_display, call_time, duration_seconds, voicemail_recording_url_encrypted, voicemail_transcript, intent_summary, urgency, status, source_provider, provider_call_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.id,
        record.client_id,
        record.caller_name,
        record.caller_number_encrypted,
        record.caller_number_display,
        record.call_time,
        record.duration_seconds,
        record.voicemail_recording_url_encrypted,
        record.voicemail_transcript,
        record.intent_summary,
        record.urgency,
        record.status,
        record.source_provider,
        record.provider_call_id,
        record.created_at,
        record.updated_at,
      );
      return this.getCallById(record.id);
    },

    getCallById(id) {
      return db.prepare('SELECT * FROM missed_calls WHERE id = ?').get(id);
    },

    listCalls() {
      return db.prepare(`
        SELECT
          c.*,
          t.id AS callback_task_id,
          t.due_at,
          t.status AS callback_status,
          t.outcome,
          t.outcome_notes,
          t.completed_at,
          t.escalated_at
        FROM missed_calls c
        LEFT JOIN callback_tasks t ON t.missed_call_id = c.id
        ORDER BY c.call_time DESC
      `).all();
    },

    updateUrgency(callId, urgency) {
      db.prepare('UPDATE missed_calls SET urgency = ?, updated_at = ? WHERE id = ?').run(urgency, now(), callId);
      db.prepare('UPDATE callback_tasks SET urgency = ?, updated_at = ? WHERE missed_call_id = ? AND status != ?').run(urgency, now(), callId, 'completed');
      return this.getCallById(callId);
    },

    insertCallbackTask(input) {
      const timestamp = now();
      const record = {
        id: input.id || nanoid(),
        missed_call_id: input.missed_call_id,
        client_id: input.client_id,
        urgency: input.urgency,
        due_at: input.due_at,
        assigned_team: input.assigned_team || 'Sales Team',
        status: input.status || 'open',
        outcome: input.outcome || '',
        outcome_notes: input.outcome_notes || '',
        completed_at: input.completed_at || '',
        escalated_at: input.escalated_at || '',
        created_at: input.created_at || timestamp,
        updated_at: input.updated_at || timestamp,
      };
      db.prepare(`
        INSERT INTO callback_tasks
        (id, missed_call_id, client_id, urgency, due_at, assigned_team, status, outcome, outcome_notes, completed_at, escalated_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.id,
        record.missed_call_id,
        record.client_id,
        record.urgency,
        record.due_at,
        record.assigned_team,
        record.status,
        record.outcome,
        record.outcome_notes,
        record.completed_at,
        record.escalated_at,
        record.created_at,
        record.updated_at,
      );
      return this.getCallbackTask(record.id);
    },

    getCallbackTask(id) {
      return db.prepare('SELECT * FROM callback_tasks WHERE id = ?').get(id);
    },

    completeCallback(id, { outcome, outcome_notes = '', completed_at = now() }) {
      db.prepare(`
        UPDATE callback_tasks
        SET status = 'completed', outcome = ?, outcome_notes = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
      `).run(outcome, outcome_notes, completed_at, now(), id);
      return this.getCallbackTask(id);
    },

    markEscalated(id, escalatedAt = now()) {
      db.prepare(`
        UPDATE callback_tasks
        SET status = 'escalated', escalated_at = ?, updated_at = ?
        WHERE id = ? AND status = 'open'
      `).run(escalatedAt, now(), id);
      return this.getCallbackTask(id);
    },

    listOpenHighUrgencyTasks() {
      return db.prepare(`
        SELECT t.*, c.caller_name, c.intent_summary, c.caller_number_display
        FROM callback_tasks t
        JOIN missed_calls c ON c.id = t.missed_call_id
        WHERE t.urgency = 'high' AND t.status = 'open'
        ORDER BY t.due_at ASC
      `).all();
    },

    insertFollowUpAttempt(input) {
      const record = {
        id: input.id || nanoid(),
        missed_call_id: input.missed_call_id,
        callback_task_id: input.callback_task_id,
        client_id: input.client_id,
        channel: input.channel,
        recipient: input.recipient,
        message: input.message,
        status: input.status || 'sent',
        sent_at: input.sent_at || now(),
        created_at: input.created_at || now(),
      };
      db.prepare(`
        INSERT INTO follow_up_attempts
        (id, missed_call_id, callback_task_id, client_id, channel, recipient, message, status, sent_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(record.id, record.missed_call_id, record.callback_task_id, record.client_id, record.channel, record.recipient, record.message, record.status, record.sent_at, record.created_at);
      return record;
    },

    listFollowUpAttempts(missedCallId) {
      return db.prepare('SELECT * FROM follow_up_attempts WHERE missed_call_id = ? ORDER BY sent_at DESC').all(missedCallId);
    },

    insertBookedMeeting(input) {
      const record = {
        id: input.id || nanoid(),
        missed_call_id: input.missed_call_id,
        callback_task_id: input.callback_task_id,
        client_id: input.client_id,
        meeting_time: input.meeting_time,
        created_at: input.created_at || now(),
      };
      db.prepare(`
        INSERT INTO booked_meetings
        (id, missed_call_id, callback_task_id, client_id, meeting_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(record.id, record.missed_call_id, record.callback_task_id, record.client_id, record.meeting_time, record.created_at);
      return record;
    },

    getMetricsRows() {
      return db.prepare(`
        SELECT
          c.urgency,
          c.call_time,
          t.status AS callback_status,
          t.outcome,
          t.completed_at
        FROM missed_calls c
        LEFT JOIN callback_tasks t ON t.missed_call_id = c.id
      `).all();
    },
  };
}
