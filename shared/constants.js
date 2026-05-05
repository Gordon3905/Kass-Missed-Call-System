export const URGENCY = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const CALLBACK_STATUS = {
  OPEN: 'open',
  COMPLETED: 'completed',
  ESCALATED: 'escalated',
};

export const CALLBACK_OUTCOMES = {
  BOOKED_MEETING: 'booked_meeting',
  VOICEMAIL_LEFT: 'voicemail_left',
  NO_ANSWER: 'no_answer',
  NOT_QUALIFIED: 'not_qualified',
  WRONG_NUMBER: 'wrong_number',
  RESOLVED_NO_MEETING: 'resolved_no_meeting',
};

export const TEMPLATE_VARIABLES = [
  'caller_name',
  'caller_number',
  'intent_summary',
  'client_brand_name',
  'callback_due',
];

export const PROVIDER_MODES = {
  DATABASE: ['sqlite'],
  PHONE: ['mock', 'twilio'],
  TRANSCRIPTION: ['mock', 'live'],
  INTENT: ['mock', 'live'],
  CRM: ['local', 'external'],
  SMS: ['mock', 'twilio'],
  EMAIL: ['mock', 'smtp'],
};
