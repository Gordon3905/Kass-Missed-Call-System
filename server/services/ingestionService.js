import { nanoid } from 'nanoid';
import { createFollowUpService } from './followUpService.js';

export function createIngestionService({
  clientRepository,
  callRepository,
  sequenceRepository,
  crypto,
  transcriptionProvider,
  intentProvider,
  smsProvider,
  emailProvider,
}) {
  return {
    async processMissedCall(payload) {
      const client = clientRepository.getById(payload.clientId);
      if (!client) throw new Error(`Client not found: ${payload.clientId}`);

      const transcript = await transcriptionProvider.transcribe({
        recordingUrl: payload.recordingUrl,
        providerCallId: payload.providerCallId,
      });
      const intent = await intentProvider.analyze({ transcript });
      const callerName = payload.callerName || intent.callerName || 'Unknown Caller';
      const timestamp = new Date().toISOString();

      const call = callRepository.insertMissedCall({
        id: nanoid(),
        client_id: client.id,
        caller_name: callerName,
        caller_number_encrypted: crypto.encrypt(payload.from),
        caller_number_display: crypto.maskPhone(payload.from),
        call_time: payload.callTime,
        duration_seconds: payload.durationSeconds || 0,
        voicemail_recording_url_encrypted: crypto.encrypt(payload.recordingUrl),
        voicemail_transcript: transcript,
        intent_summary: intent.intentSummary,
        urgency: intent.urgency,
        status: 'processed',
        source_provider: 'mock',
        provider_call_id: payload.providerCallId,
        created_at: timestamp,
        updated_at: timestamp,
      });

      const followUp = createFollowUpService({
        callRepository,
        sequenceRepository,
        smsProvider,
        emailProvider,
      });
      const callbackTask = await followUp.createCallbackForCall({ call, client });

      return { call, callbackTask, intent };
    },
  };
}
