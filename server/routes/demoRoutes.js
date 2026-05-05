import { createIngestionService } from '../services/ingestionService.js';

export function registerDemoRoutes(app, { repositories, providers, secure }) {
  app.post('/api/demo/process-missed-call', async (_req, res, next) => {
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
      const result = await service.processMissedCall(providers.phone.sampleMissedCall());
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });
}
