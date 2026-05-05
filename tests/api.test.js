import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../server/app.js';

describe('api', () => {
  it('returns integration status and metrics', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });

    const integrations = await request(app).get('/api/integrations/status');
    expect(integrations.status).toBe(200);
    expect(integrations.body.providers.phone.mode).toBe('mock');

    const metrics = await request(app).get('/api/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.body.totalMissedCalls).toBeGreaterThan(0);
  });

  it('processes a demo missed call', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });
    const response = await request(app).post('/api/demo/process-missed-call').send({});

    expect(response.status).toBe(201);
    expect(response.body.call.voicemail_transcript).toContain('walkthrough');
    expect(response.body.call.intent_summary).toContain('same-day');
    expect(response.body.call.urgency).toBe('high');
    expect(response.body.callbackTask.due_at).toBe(response.body.call.call_time);
  });

  it('returns calls joined with callback task fields', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });
    const response = await request(app).get('/api/calls');

    expect(response.status).toBe(200);
    expect(response.body[0]).toHaveProperty('due_at');
    expect(response.body[0]).toHaveProperty('callback_status');
    expect(response.body[0]).toHaveProperty('task_status');
    expect(response.body[0]).toHaveProperty('outcome');
    expect(response.body[0]).toHaveProperty('escalated_at');
  });

  it('returns the full dashboard metric contract', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });
    const response = await request(app).get('/api/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        totalMissedCalls: expect.any(Number),
        urgency: expect.objectContaining({ high: expect.any(Number), medium: expect.any(Number), low: expect.any(Number) }),
        callbackCompletionRate: expect.any(Number),
        bookedMeetings: expect.any(Number),
        conversionRate: expect.any(Number),
        averageResponseMinutes: expect.any(Number),
        outcomes: expect.any(Object),
      }),
    );
  });

  it('returns escalated tasks from stale escalation', async () => {
    const app = createApp({ useMemoryDb: true, seed: true });
    await request(app).post('/api/demo/process-missed-call').send({});
    const response = await request(app)
      .post('/api/callback-tasks/escalate-stale')
      .send({ now: '2026-05-05T17:00:00.000Z' });

    expect(response.status).toBe(200);
    expect(response.body.escalated).toBeInstanceOf(Array);
    expect(response.body.escalated[0]).toHaveProperty('id');
    expect(response.body.escalated[0].status).toBe('escalated');
  });
});
