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
    expect(response.body.call.intent_summary).toContain('same-day');
  });
});
