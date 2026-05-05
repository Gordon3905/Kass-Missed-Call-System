import { createMetricsService } from '../services/metricsService.js';

export function registerMetricsRoutes(app, { repositories }) {
  app.get('/api/metrics', (_req, res) => {
    res.json(createMetricsService(repositories.calls).getDashboardMetrics());
  });
}
