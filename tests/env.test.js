import { describe, expect, it } from 'vitest';
import { loadEnv } from '../server/config/env.js';

describe('loadEnv', () => {
  it('defaults to local mock provider modes', () => {
    const env = loadEnv({});

    expect(env.databaseProvider).toBe('sqlite');
    expect(env.phoneProvider).toBe('mock');
    expect(env.transcriptionProvider).toBe('mock');
    expect(env.intentProvider).toBe('mock');
    expect(env.crmProvider).toBe('local');
    expect(env.smsProvider).toBe('mock');
    expect(env.emailProvider).toBe('mock');
    expect(env.port).toBe(5174);
  });

  it('rejects live provider mode without credentials', () => {
    expect(() =>
      loadEnv({
        PHONE_PROVIDER: 'twilio',
        TWILIO_AUTH_TOKEN: '',
      }),
    ).toThrow(/TWILIO_AUTH_TOKEN/);
  });
});
