import { nanoid } from 'nanoid';
import { CALLBACK_OUTCOMES } from '../../shared/constants.js';
import { createFollowUpService } from '../services/followUpService.js';

export function registerCallRoutes(app, { repositories, providers }) {
  app.get('/api/calls', (_req, res) => {
    res.json(repositories.calls.listCalls());
  });

  app.get('/api/calls/:id', (req, res) => {
    const call = repositories.calls.getCallById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Call not found' });
    return res.json({ ...call, followUpAttempts: repositories.calls.listFollowUpAttempts(call.id) });
  });

  app.patch('/api/calls/:id/urgency', (req, res) => {
    const call = repositories.calls.updateUrgency(req.params.id, req.body.urgency);
    res.json(call);
  });

  app.patch('/api/callback-tasks/:id/complete', (req, res) => {
    const task = repositories.calls.completeCallback(req.params.id, {
      outcome: req.body.outcome,
      outcome_notes: req.body.outcome_notes || req.body.outcomeNotes || '',
      completed_at: new Date().toISOString(),
    });
    if (req.body.outcome === CALLBACK_OUTCOMES.BOOKED_MEETING) {
      repositories.calls.insertBookedMeeting({
        id: nanoid(),
        missed_call_id: task.missed_call_id,
        callback_task_id: task.id,
        client_id: task.client_id,
        meeting_time: req.body.meeting_time || new Date(Date.now() + 86_400_000).toISOString(),
      });
    }
    res.json(task);
  });

  app.patch('/api/callback-tasks/:id/outcome', (req, res) => {
    const task = repositories.calls.completeCallback(req.params.id, {
      outcome: req.body.outcome,
      outcome_notes: req.body.outcome_notes || '',
      completed_at: req.body.completed_at || new Date().toISOString(),
    });
    res.json(task);
  });

  app.post('/api/callback-tasks/escalate-stale', async (req, res, next) => {
    try {
      const clientsById = new Map(repositories.clients.list().map((client) => [client.id, client]));
      const service = createFollowUpService({
        callRepository: repositories.calls,
        sequenceRepository: repositories.sequences,
        smsProvider: providers.sms,
        emailProvider: providers.email,
      });
      const result = await service.escalateStaleHighUrgency({
        now: req.body.now || new Date().toISOString(),
        clientsById,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  });
}
