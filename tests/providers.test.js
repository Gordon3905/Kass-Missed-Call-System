import { describe, expect, it } from 'vitest';
import { createProviders } from '../server/providers/index.js';

describe('providers', () => {
  it('creates deterministic mock providers', async () => {
    const providers = createProviders({
      phoneProvider: 'mock',
      transcriptionProvider: 'mock',
      intentProvider: 'mock',
      smsProvider: 'mock',
      emailProvider: 'mock',
    });

    const payload = providers.phone.sampleMissedCall();
    const transcript = await providers.transcription.transcribe({ recordingUrl: payload.recordingUrl, providerCallId: payload.providerCallId });
    const intent = await providers.intent.analyze({ transcript });
    const sms = await providers.sms.send({ to: '+14155550123', message: 'Call back now' });

    expect(payload.from).toMatch(/^\+/);
    expect(transcript).toContain('walkthrough');
    expect(intent.urgency).toBe('high');
    expect(sms.status).toBe('sent');
  });
});
