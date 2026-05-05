import { describe, expect, it } from 'vitest';
import { createCrypto } from '../server/security/crypto.js';

describe('crypto helpers', () => {
  it('encrypts, decrypts, and masks phone numbers', () => {
    const crypto = createCrypto('dev-only-32-byte-key-change-me!!');
    const encrypted = crypto.encrypt('+14155550123');

    expect(encrypted).not.toBe('+14155550123');
    expect(crypto.decrypt(encrypted)).toBe('+14155550123');
    expect(crypto.maskPhone('+14155550123')).toBe('+1 *** *** 0123');
  });
});
