import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';
import { createFollowUpService } from '../server/services/followUpService.js';

function setupDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

describe('followUpService', () => {
  let db;
  let clients;
  let calls;
  let sequences;

  beforeEach(() => {
    db = setupDb();
    clients = createClientRepository(db);
    calls = createCallRepository(db);
    sequences = createSequenceRepository(db);
    clients.upsert({
      id: 'client_1',
      name: 'Apex Dental',
      brand_name: 'Apex Dental',
      logo_url: '',
      primary_color: '#155EEF',
      timezone: 'America/New_York',
      business_hours: { monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] },
      high_urgency_escalation_minutes: 30,
      retention_days: 365,
    });
    sequences.upsertSequence({ id: 'seq_high', client_id: 'client_1', urgency: 'high', due_window_minutes: 0, channels: ['sms', 'email'], escalation_minutes: 30, enabled: 1 });
    sequences.upsertTemplate({ id: 'template_high_sms', client_id: 'client_1', urgency: 'high', channel: 'sms', subject: '', body: 'Call {{caller_name}} now: {{intent_summary}}' });
  });

  it('creates immediate high urgency callback task and follow-up attempts', async () => {
    calls.insertMissedCall({
      id: 'call_1',
      client_id: 'client_1',
      caller_name: 'Avery Johnson',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 0123',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need pricing today.',
      intent_summary: 'Needs pricing today.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_1',
    });

    const sent = [];
    const service = createFollowUpService({
      callRepository: calls,
      sequenceRepository: sequences,
      smsProvider: { send: async (message) => sent.push(message) || { status: 'sent' } },
      emailProvider: { send: async (message) => sent.push(message) || { status: 'sent' } },
    });

    const task = await service.createCallbackForCall({
      call: calls.getCallById('call_1'),
      client: clients.getById('client_1'),
    });

    expect(task.due_at).toBe('2026-05-05T14:00:00.000Z');
    expect(sent[0].message).toContain('Avery Johnson');
  });

  it('escalates stale high urgency tasks after 30 minutes', async () => {
    calls.insertMissedCall({
      id: 'call_2',
      client_id: 'client_1',
      caller_name: 'Jordan Lee',
      caller_number_encrypted: 'encrypted',
      caller_number_display: '+1 *** *** 0188',
      call_time: '2026-05-05T14:00:00.000Z',
      duration_seconds: 42,
      voicemail_recording_url_encrypted: 'recording',
      voicemail_transcript: 'Need callback today.',
      intent_summary: 'Needs callback today.',
      urgency: 'high',
      status: 'processed',
      source_provider: 'mock',
      provider_call_id: 'mock_2',
    });
    calls.insertCallbackTask({
      id: 'task_2',
      missed_call_id: 'call_2',
      client_id: 'client_1',
      urgency: 'high',
      due_at: '2026-05-05T14:00:00.000Z',
      assigned_team: 'Sales Team',
    });

    const service = createFollowUpService({
      callRepository: calls,
      sequenceRepository: sequences,
      smsProvider: { send: async () => ({ status: 'sent' }) },
      emailProvider: { send: async () => ({ status: 'sent' }) },
    });

    const result = await service.escalateStaleHighUrgency({
      now: '2026-05-05T14:31:00.000Z',
      clientsById: new Map([['client_1', clients.getById('client_1')]]),
    });

    expect(result.escalated).toHaveLength(1);
    expect(calls.getCallbackTask('task_2').status).toBe('escalated');
  });
});
