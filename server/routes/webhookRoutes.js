import { createIngestionService } from '../services/ingestionService.js';

function normalizeTwilioPayload(body) {
  return {
    clientId: body.clientId || body.ClientId || 'client_covault_demo',
    from: body.From,
    callerName: body.CallerName || '',
    callTime: body.CallTime || new Date().toISOString(),
    durationSeconds: Number(body.CallDuration || 0),
    recordingUrl: body.RecordingUrl || '',
    providerCallId: body.CallSid || `twilio_${Date.now()}`,
  };
}

export function registerWebhookRoutes(app, { repositories, providers, secure }) {
  app.post('/api/webhooks/twilio/missed-call', async (req, res, next) => {
    try {
      const service = createIngestionService({
        clientRepository: repositories.clients,
        callRepository: repositories.calls,
        sequenceRepository: repositories.sequences,
        crypto: secure,
        transcriptionProvider: providers.transcription,
        intentProvider: providers.intent,
        smsProvider: providers.sms,
        emailProvider: providers.email,
      });
      const result = await service.processMissedCall(normalizeTwilioPayload(req.body));
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
}
