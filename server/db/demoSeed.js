import { nanoid } from 'nanoid';
import { createCrypto } from '../security/crypto.js';

const seedNow = new Date('2026-05-05T16:00:00.000Z');

function iso(minutesAgo) {
  return new Date(seedNow.getTime() - minutesAgo * 60_000).toISOString();
}

export function seedDemoData(db, config) {
  const secure = createCrypto(config.encryptionKey);
  const client = {
    id: 'client_covault_demo',
    name: 'CoVault Demo Client',
    brand_name: 'CoVault Response',
    logo_url: '',
    primary_color: '#155EEF',
    timezone: 'America/New_York',
    business_hours: JSON.stringify({
      monday: ['09:00', '17:00'],
      tuesday: ['09:00', '17:00'],
      wednesday: ['09:00', '17:00'],
      thursday: ['09:00', '17:00'],
      friday: ['09:00', '17:00'],
    }),
    high_urgency_escalation_minutes: 30,
    retention_days: 365,
    created_at: iso(1200),
    updated_at: iso(1200),
  };

  db.prepare(`
    INSERT OR REPLACE INTO clients
    (id, name, brand_name, logo_url, primary_color, timezone, business_hours, high_urgency_escalation_minutes, retention_days, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client.id, client.name, client.brand_name, client.logo_url, client.primary_color, client.timezone, client.business_hours, client.high_urgency_escalation_minutes, client.retention_days, client.created_at, client.updated_at);

  const calls = [
    ['Avery Johnson', '+14155550123', 18, 'We are ready to book a walkthrough this week and need pricing before our board meeting tomorrow.', 'Buyer ready to book a walkthrough and asking for pricing before a deadline.', 'high', 'open', ''],
    ['Mina Patel', '+16465550144', 74, 'I missed my appointment confirmation and need to move the demo from Thursday morning to Friday afternoon.', 'Existing prospect needs to reschedule a demo.', 'medium', 'completed', 'voicemail_left'],
    ['Jordan Lee', '+13105550188', 138, 'Our current vendor missed another emergency request. I need someone to call me back today about switching.', 'Urgent vendor replacement conversation with same-day callback expectation.', 'high', 'escalated', 'no_answer'],
    ['Taylor Brooks', '+15125550191', 260, 'I saw your ad but I am not sure if this is for residential or commercial service. Please send details.', 'New inquiry asking if the service fits their use case.', 'medium', 'open', ''],
    ['Sam Rivera', '+12065550165', 410, 'Sorry, I think I called the wrong company. Please disregard this message.', 'Caller says this was a wrong number.', 'low', 'completed', 'wrong_number'],
    ['Priya Shah', '+17205550177', 530, 'We have three locations and need missed-call coverage before the holiday weekend. Can sales call me today?', 'Multi-location prospect requests sales callback before holiday weekend.', 'high', 'completed', 'booked_meeting'],
  ];

  for (const [callerName, number, minutesAgo, transcript, summary, urgency, taskStatus, outcome] of calls) {
    const missedCallId = nanoid();
    const callbackTaskId = nanoid();
    const createdAt = iso(minutesAgo);
    db.prepare(`
      INSERT OR REPLACE INTO missed_calls
      (id, client_id, caller_name, caller_number_encrypted, caller_number_display, call_time, duration_seconds, voicemail_recording_url_encrypted, voicemail_transcript, intent_summary, urgency, status, source_provider, provider_call_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(missedCallId, client.id, callerName, secure.encrypt(number), secure.maskPhone(number), createdAt, 48, secure.encrypt(`https://recordings.example.com/${missedCallId}.mp3`), transcript, summary, urgency, 'processed', 'mock', `mock_${missedCallId}`, createdAt, createdAt);

    db.prepare(`
      INSERT OR REPLACE INTO callback_tasks
      (id, missed_call_id, client_id, urgency, due_at, assigned_team, status, outcome, outcome_notes, completed_at, escalated_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(callbackTaskId, missedCallId, client.id, urgency, iso(Math.max(minutesAgo - 30, 0)), 'Sales Team', taskStatus, outcome, outcome ? `Demo seed outcome: ${outcome}` : '', taskStatus === 'completed' ? iso(Math.max(minutesAgo - 20, 0)) : '', taskStatus === 'escalated' ? iso(Math.max(minutesAgo - 100, 0)) : '', createdAt, createdAt);

    if (outcome === 'booked_meeting') {
      db.prepare(`
        INSERT OR REPLACE INTO booked_meetings
        (id, missed_call_id, callback_task_id, client_id, meeting_time, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(nanoid(), missedCallId, callbackTaskId, client.id, new Date(seedNow.getTime() + 86_400_000).toISOString(), iso(20));
    }
  }

  const sequences = [
    ['high', 0, ['sms', 'email'], 30],
    ['medium', 1440, ['email'], 30],
    ['low', 4320, ['email'], 30],
  ];

  for (const [urgency, dueWindow, channels, escalation] of sequences) {
    db.prepare(`
      INSERT OR REPLACE INTO follow_up_sequences
      (id, client_id, urgency, due_window_minutes, channels, escalation_minutes, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(`seq_${urgency}`, client.id, urgency, dueWindow, JSON.stringify(channels), escalation, iso(1200), iso(1200));
  }

  const templates = [
    ['high', 'sms', '', 'Urgent missed call from {{caller_name}}: {{intent_summary}}. Call back now at {{caller_number}}.'],
    ['high', 'email', 'High urgency missed call for {{client_brand_name}}', '{{caller_name}} needs immediate follow-up: {{intent_summary}}'],
    ['medium', 'email', 'Callback queued for {{client_brand_name}}', '{{caller_name}} should be called during the next business day. Context: {{intent_summary}}'],
    ['low', 'email', 'Low urgency missed call logged', '{{caller_name}} left a low-priority message: {{intent_summary}}'],
  ];

  for (const [urgency, channel, subject, body] of templates) {
    db.prepare(`
      INSERT OR REPLACE INTO message_templates
      (id, client_id, urgency, channel, subject, body, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(`template_${urgency}_${channel}`, client.id, urgency, channel, subject, body, iso(1200), iso(1200));
  }

  const integrations = [
    ['phone', config.phoneProvider],
    ['transcription', config.transcriptionProvider],
    ['intent', config.intentProvider],
    ['crm', config.crmProvider],
    ['sms', config.smsProvider],
    ['email', config.emailProvider],
  ];

  for (const [provider, mode] of integrations) {
    db.prepare(`
      INSERT OR REPLACE INTO integrations
      (id, provider, mode, status, last_checked_at, metadata)
      VALUES (?, ?, ?, 'ready', ?, '{}')
    `).run(`integration_${provider}`, provider, mode, iso(5));
  }
}
