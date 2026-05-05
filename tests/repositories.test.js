import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';

function createMemoryDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

describe('repositories', () => {
  let db;

  beforeEach(() => {
    db = createMemoryDb();
  });

  it('stores clients with default 30 minute escalation', () => {
    const clients = createClientRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      retention_days: 365,
    });

    expect(clients.getById('client_1').high_urgency_escalation_minutes).toBe(30);
  });

  it('tracks callback outcomes and booked meetings', () => {
    const clients = createClientRepository(db);
    const calls = createCallRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });

    calls.insertMissedCall({
      id: 'call_1',
      client_id: 'client_1',
      caller_name: 'Jamie Fox',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 1212',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need pricing today.',
      intent_summary: 'Pricing request.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_1',
    });

    calls.insertCallbackTask({
      id: 'task_1',
      missed_call_id: 'call_1',
      client_id: 'client_1',
      urgency: 'high',
      due_at: '2026-05-05T14:00:00.000Z',
      assigned_team: 'Sales Team',
    });

    calls.completeCallback('task_1', {
      outcome: 'booked_meeting',
      outcome_notes: 'Booked Friday demo.',
      completed_at: '2026-05-05T14:20:00.000Z',
    });

    calls.insertBookedMeeting({
      id: 'meeting_1',
      missed_call_id: 'call_1',
      callback_task_id: 'task_1',
      client_id: 'client_1',
      meeting_time: '2026-05-08T15:00:00.000Z',
    });

    const task = calls.getCallbackTask('task_1');
    expect(task.status).toBe('completed');
    expect(task.outcome).toBe('booked_meeting');
    expect(calls.listCalls()[0].outcome).toBe('booked_meeting');
  });

  it('persists sequence templates by client, urgency, and channel', () => {
    const clients = createClientRepository(db);
    const sequences = createSequenceRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });

    sequences.upsertTemplate({
      id: 'template_1',
      client_id: 'client_1',
      urgency: 'high',
      channel: 'sms',
      subject: '',
      body: 'Call {{caller_name}} now.',
    });

    expect(sequences.listTemplates('client_1')[0].body).toBe('Call {{caller_name}} now.');
  });
});
