import { describe, expect, it } from 'vitest';
import { createMetricsService } from '../server/services/metricsService.js';

describe('metricsService', () => {
  it('computes callback and conversion metrics from repository rows', () => {
    const service = createMetricsService({
      getMetricsRows: () => [
        { urgency: 'high', callback_status: 'completed', outcome: 'booked_meeting', completed_at: '2026-05-05T14:20:00.000Z', call_time: '2026-05-05T14:00:00.000Z' },
        { urgency: 'medium', callback_status: 'completed', outcome: 'voicemail_left', completed_at: '2026-05-05T16:00:00.000Z', call_time: '2026-05-05T15:00:00.000Z' },
        { urgency: 'high', callback_status: 'open', outcome: '', completed_at: '', call_time: '2026-05-05T15:30:00.000Z' },
      ],
    });

    const metrics = service.getDashboardMetrics();

    expect(metrics.totalMissedCalls).toBe(3);
    expect(metrics.callbackCompletionRate).toBe(67);
    expect(metrics.bookedMeetings).toBe(1);
    expect(metrics.conversionRate).toBe(33);
    expect(metrics.outcomes.booked_meeting).toBe(1);
  });
});
