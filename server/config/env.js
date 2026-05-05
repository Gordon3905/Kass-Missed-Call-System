import { PROVIDER_MODES } from '../../shared/constants.js';

function readMode(rawEnv, key, allowed, fallback) {
  const value = rawEnv[key] || fallback;
  if (!allowed.includes(value)) {
    throw new Error(`${key} must be one of: ${allowed.join(', ')}`);
  }
  return value;
}

export function loadEnv(rawEnv = process.env) {
  const env = {
    port: Number(rawEnv.PORT || 5174),
    sqlitePath: rawEnv.SQLITE_PATH || './data/covault.db',
    databaseProvider: readMode(rawEnv, 'DATABASE_PROVIDER', PROVIDER_MODES.DATABASE, 'sqlite'),
    phoneProvider: readMode(rawEnv, 'PHONE_PROVIDER', PROVIDER_MODES.PHONE, 'mock'),
    transcriptionProvider: readMode(rawEnv, 'TRANSCRIPTION_PROVIDER', PROVIDER_MODES.TRANSCRIPTION, 'mock'),
    intentProvider: readMode(rawEnv, 'INTENT_PROVIDER', PROVIDER_MODES.INTENT, 'mock'),
    crmProvider: readMode(rawEnv, 'CRM_PROVIDER', PROVIDER_MODES.CRM, 'local'),
    smsProvider: readMode(rawEnv, 'SMS_PROVIDER', PROVIDER_MODES.SMS, 'mock'),
    emailProvider: readMode(rawEnv, 'EMAIL_PROVIDER', PROVIDER_MODES.EMAIL, 'mock'),
    encryptionKey: rawEnv.ENCRYPTION_KEY || 'dev-only-32-byte-key-change-me!!',
    twilioAuthToken: rawEnv.TWILIO_AUTH_TOKEN || '',
  };

  if ((env.phoneProvider === 'twilio' || env.smsProvider === 'twilio') && !env.twilioAuthToken) {
    throw new Error('TWILIO_AUTH_TOKEN is required when Twilio provider modes are enabled.');
  }

  return env;
}
