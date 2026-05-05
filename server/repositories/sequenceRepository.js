import { nanoid } from 'nanoid';

const now = () => new Date().toISOString();

function parseSequence(row) {
  if (!row) return null;
  return { ...row, channels: JSON.parse(row.channels), enabled: Boolean(row.enabled) };
}

export function createSequenceRepository(db) {
  return {
    upsertSequence(input) {
      const id = input.id || `seq_${input.client_id}_${input.urgency}`;
      const timestamp = now();
      const enabled = input.enabled === false || input.enabled === 0 ? 0 : 1;
      db.prepare(`
        INSERT INTO follow_up_sequences
        (id, client_id, urgency, due_window_minutes, channels, escalation_minutes, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(client_id, urgency) DO UPDATE SET
          due_window_minutes=excluded.due_window_minutes,
          channels=excluded.channels,
          escalation_minutes=excluded.escalation_minutes,
          enabled=excluded.enabled,
          updated_at=excluded.updated_at
      `).run(id, input.client_id, input.urgency, input.due_window_minutes, JSON.stringify(input.channels || []), input.escalation_minutes ?? 30, enabled, input.created_at || timestamp, timestamp);
      return parseSequence(db.prepare('SELECT * FROM follow_up_sequences WHERE client_id = ? AND urgency = ?').get(input.client_id, input.urgency));
    },

    listSequences(clientId) {
      return db.prepare('SELECT * FROM follow_up_sequences WHERE client_id = ? ORDER BY urgency').all(clientId).map(parseSequence);
    },

    upsertTemplate(input) {
      const id = input.id || nanoid();
      const timestamp = now();
      db.prepare(`
        INSERT INTO message_templates
        (id, client_id, urgency, channel, subject, body, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(client_id, urgency, channel) DO UPDATE SET
          subject=excluded.subject,
          body=excluded.body,
          updated_at=excluded.updated_at
      `).run(id, input.client_id, input.urgency, input.channel, input.subject || '', input.body, input.created_at || timestamp, timestamp);
      return db.prepare('SELECT * FROM message_templates WHERE client_id = ? AND urgency = ? AND channel = ?').get(input.client_id, input.urgency, input.channel);
    },

    listTemplates(clientId) {
      return db.prepare('SELECT * FROM message_templates WHERE client_id = ? ORDER BY urgency, channel').all(clientId);
    },

    saveClientSequenceBundle(clientId, payload) {
      for (const sequence of payload.sequences || []) {
        this.upsertSequence({ ...sequence, client_id: clientId });
      }
      for (const template of payload.templates || []) {
        this.upsertTemplate({ ...template, client_id: clientId });
      }
      return { sequences: this.listSequences(clientId), templates: this.listTemplates(clientId) };
    },
  };
}
