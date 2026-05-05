import { URGENCY } from '../../shared/constants.js';

export function createMockIntentProvider() {
  return {
    async analyze({ transcript }) {
      const text = transcript.toLowerCase();
      if (text.includes('today') || text.includes('tomorrow') || text.includes('ready to book')) {
        return {
          callerName: transcript.match(/this is ([A-Z][a-z]+ [A-Z][a-z]+)/)?.[1] || '',
          intentSummary: 'Caller is ready to move forward and needs same-day sales follow-up.',
          urgency: URGENCY.HIGH,
          rationale: 'Detected deadline language and booking intent.',
        };
      }
      if (text.includes('wrong company') || text.includes('disregard')) {
        return {
          callerName: '',
          intentSummary: 'Caller indicated the call was not a qualified opportunity.',
          urgency: URGENCY.LOW,
          rationale: 'Detected wrong-number language.',
        };
      }
      return {
        callerName: '',
        intentSummary: 'Caller needs routine follow-up during business hours.',
        urgency: URGENCY.MEDIUM,
        rationale: 'No immediate deadline detected.',
      };
    },
  };
}
