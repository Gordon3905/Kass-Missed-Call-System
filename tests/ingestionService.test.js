import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createClientRepository } from '../server/repositories/clientRepository.js';
import { createCallRepository } from '../server/repositories/callRepository.js';
import { createSequenceRepository } from '../server/repositories/sequenceRepository.js';
import { createCrypto } from '../server/security/crypto.js';
import { createIngestionService } from '../server/services/ingestionService.js';

function setup() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(fs.readFileSync(new URL('../server/db/schema.sql', import.meta.url), 'utf8'));
  const clients = createClientRepository(db);
  clients.upsert({
    id: 'client_kavor_demo',
    name: 'Kavor Automation System Demo Client',
    brand_name: 'Kavor Calls',
    logo_url: '',
    primary_color: '#155EEF',
    timezone: 'America/New_York',
    business_hours: { monday: ['09:00', '17:00'], tuesday: ['09:00', '17:00'], wednesday: ['09:00', '17:00'], thursday: ['09:00', '17:00'], friday: ['09:00', '17:00'] },
    high_urgency_escalation_minutes: 30,
    retention_days: 365,
  });
  return { db, clients };
}

describe('ingestionService', () => {
  it('processes a missed call into a stored call and callback task', async () => {
    const { db, clients } = setup();
    const calls = createCallRepository(db);
    const sequences = createSequenceRepository(db);
    sequences.upsertTemplate({ id: 't1', client_id: 'client_kavor_demo', urgency: 'high', channel: 'sms', subject: '', body: 'Call {{caller_name}} now.' });
    const service = createIngestionService({
      clientRepository: clients,
      callRepository: calls,
      sequenceRepository: sequences,
      crypto: createCrypto('dev-only-32-byte-key-change-me!!'),
      transcriptionProvider: { transcribe: async () => 'This is Avery Johnson. We are ready to book and need pricing today.' },
      intentProvider: { analyze: async () => ({ callerName: 'Avery Johnson', intentSummary: 'Ready to book and needs pricing today.', urgency: 'high', rationale: 'Booking and deadline language.' }) },
      smsProvider: { send: async () => ({ status: 'sent' }) },
      emailProvider: { send: async () => ({ status: 'sent' }) },
    });

    const result = await service.processMissedCall({
      clientId: 'client_kavor_demo',
      from: '+14155550123',
      callerName: '',
      callTime: '2026-05-05T14:00:00.000Z',
      durationSeconds: 52,
      recordingUrl: 'mock://recordings/high-priority-buyer',
      providerCallId: 'mock_1',
    });

    expect(result.call.caller_name).toBe('Avery Johnson');
    expect(result.call.urgency).toBe('high');
    expect(result.callbackTask.due_at).toBe('2026-05-05T14:00:00.000Z');
    expect(calls.listCalls()).toHaveLength(1);
  });
});
