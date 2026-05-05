import { createMockPhoneProvider } from './mockPhoneProvider.js';
import { createMockTranscriptionProvider } from './mockTranscriptionProvider.js';
import { createMockIntentProvider } from './mockIntentProvider.js';
import { createMockSmsProvider, createMockEmailProvider } from './mockNotificationProviders.js';
import { createUnavailableLiveProvider } from './liveProviderStubs.js';

export function createProviders(config) {
  return {
    phone: config.phoneProvider === 'mock' ? createMockPhoneProvider() : createUnavailableLiveProvider('Twilio phone'),
    transcription: config.transcriptionProvider === 'mock' ? createMockTranscriptionProvider() : createUnavailableLiveProvider('Transcription'),
    intent: config.intentProvider === 'mock' ? createMockIntentProvider() : createUnavailableLiveProvider('AI intent'),
    sms: config.smsProvider === 'mock' ? createMockSmsProvider() : createUnavailableLiveProvider('SMS'),
    email: config.emailProvider === 'mock' ? createMockEmailProvider() : createUnavailableLiveProvider('Email'),
  };
}
