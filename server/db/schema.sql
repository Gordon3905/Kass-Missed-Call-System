CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  primary_color TEXT NOT NULL DEFAULT '#155EEF',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  business_hours TEXT NOT NULL,
  high_urgency_escalation_minutes INTEGER NOT NULL DEFAULT 30,
  retention_days INTEGER NOT NULL DEFAULT 365,
  settings_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS missed_calls (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  caller_name TEXT NOT NULL,
  caller_number_encrypted TEXT NOT NULL,
  caller_number_display TEXT NOT NULL,
  call_time TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  voicemail_recording_url_encrypted TEXT NOT NULL,
  voicemail_transcript TEXT NOT NULL DEFAULT '',
  intent_summary TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  source_provider TEXT NOT NULL DEFAULT 'mock',
  provider_call_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS callback_tasks (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  due_at TEXT NOT NULL,
  assigned_team TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  outcome TEXT NOT NULL DEFAULT '',
  outcome_notes TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL DEFAULT '',
  escalated_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  due_window_minutes INTEGER NOT NULL,
  channels TEXT NOT NULL,
  escalation_minutes INTEGER NOT NULL DEFAULT 30,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, urgency)
);

CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES clients(id),
  urgency TEXT NOT NULL,
  channel TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(client_id, urgency, channel)
);

CREATE TABLE IF NOT EXISTS follow_up_attempts (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  callback_task_id TEXT NOT NULL REFERENCES callback_tasks(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS booked_meetings (
  id TEXT PRIMARY KEY,
  missed_call_id TEXT NOT NULL REFERENCES missed_calls(id),
  callback_task_id TEXT NOT NULL REFERENCES callback_tasks(id),
  client_id TEXT NOT NULL REFERENCES clients(id),
  meeting_time TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  mode TEXT NOT NULL,
  status TEXT NOT NULL,
  last_checked_at TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
