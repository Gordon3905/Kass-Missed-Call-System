import { nanoid } from 'nanoid';
import { CALLBACK_STATUS } from '../../shared/constants.js';
import { calculateDueAt } from './businessTime.js';

function renderTemplate(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] ?? '');
}

export function createFollowUpService({ callRepository, sequenceRepository, smsProvider, emailProvider }) {
  return {
    async createCallbackForCall({ call, client }) {
      const dueAt = calculateDueAt({
        callTime: call.call_time,
        urgency: call.urgency,
        timezone: client.timezone,
        businessHours: client.business_hours,
      });
      const task = callRepository.insertCallbackTask({
        id: nanoid(),
        missed_call_id: call.id,
        client_id: client.id,
        urgency: call.urgency,
        due_at: dueAt,
        assigned_team: 'Sales Team',
      });
      const templates = sequenceRepository
        .listTemplates(client.id)
        .filter((template) => template.urgency === call.urgency);

      const values = {
        caller_name: call.caller_name,
        caller_number: call.caller_number_display,
        intent_summary: call.intent_summary,
        client_brand_name: client.brand_name,
        callback_due: dueAt,
      };

      for (const template of templates) {
        const message = renderTemplate(template.body, values);
        const provider = template.channel === 'sms' ? smsProvider : emailProvider;
        const response = await provider.send({
          to: template.channel === 'sms' ? '+15555550100' : 'sales@example.com',
          subject: renderTemplate(template.subject || `Missed call for ${client.brand_name}`, values),
          message,
        });
        callRepository.insertFollowUpAttempt({
          id: nanoid(),
          missed_call_id: call.id,
          callback_task_id: task.id,
          client_id: client.id,
          channel: template.channel,
          recipient: template.channel === 'sms' ? '+15555550100' : 'sales@example.com',
          message,
          status: response.status,
          sent_at: new Date().toISOString(),
        });
      }

      return task;
    },

    completeCallback(taskId, outcome, outcomeNotes = '') {
      return callRepository.completeCallback(taskId, {
        outcome,
        outcome_notes: outcomeNotes,
        completed_at: new Date().toISOString(),
      });
    },

    async escalateStaleHighUrgency({ now = new Date().toISOString(), clientsById }) {
      const stale = callRepository.listOpenHighUrgencyTasks().filter((task) => {
        const client = clientsById.get(task.client_id);
        const threshold = client?.high_urgency_escalation_minutes ?? 30;
        const ageMinutes = (new Date(now).getTime() - new Date(task.due_at).getTime()) / 60_000;
        return ageMinutes >= threshold;
      });

      for (const task of stale) {
        callRepository.markEscalated(task.id, now);
        await smsProvider.send({
          to: '+15555550100',
          message: `Escalation: high urgency missed call for ${task.caller_name} is still open.`,
        });
      }

      return { escalated: stale.map((task) => ({ ...task, status: CALLBACK_STATUS.ESCALATED })) };
    },
  };
}
