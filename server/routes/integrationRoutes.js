export function registerIntegrationRoutes(app, { config, repositories }) {
  app.get('/api/integrations/status', (_req, res) => {
    const fromDb = repositories.integrations.getStatusSummary();
    const providers = {
      phone: fromDb.phone || { mode: config.phoneProvider, status: 'ready' },
      transcription: fromDb.transcription || { mode: config.transcriptionProvider, status: 'ready' },
      intent: fromDb.intent || { mode: config.intentProvider, status: 'ready' },
      crm: fromDb.crm || { mode: config.crmProvider, status: 'ready' },
      sms: fromDb.sms || { mode: config.smsProvider, status: 'ready' },
      email: fromDb.email || { mode: config.emailProvider, status: 'ready' },
    };
    res.json({ providers });
  });
}
