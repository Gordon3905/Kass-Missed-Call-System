import { describe, expect, it } from 'vitest';
import { calculateDueAt } from '../server/services/businessTime.js';

const businessHours = {
  monday: ['09:00', '17:00'],
  tuesday: ['09:00', '17:00'],
  wednesday: ['09:00', '17:00'],
  thursday: ['09:00', '17:00'],
  friday: ['09:00', '17:00'],
};

describe('calculateDueAt', () => {
  it('sets high urgency due immediately', () => {
    const dueAt = calculateDueAt({
      callTime: '2026-05-05T14:00:00.000Z',
      urgency: 'high',
      timezone: 'America/New_York',
      businessHours,
    });

    expect(dueAt).toBe('2026-05-05T14:00:00.000Z');
  });

  it('queues medium urgency for next business day inside client hours', () => {
    const dueAt = calculateDueAt({
      callTime: '2026-05-08T22:30:00.000Z',
      urgency: 'medium',
      timezone: 'America/New_York',
      businessHours,
    });

    expect(dueAt).toBe('2026-05-11T13:00:00.000Z');
  });
});
