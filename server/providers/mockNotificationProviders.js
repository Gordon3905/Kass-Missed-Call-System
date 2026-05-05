export function createMockSmsProvider() {
  return {
    async send({ to, message }) {
      return { id: `mock_sms_${Date.now()}`, to, message, status: 'sent' };
    },
  };
}

export function createMockEmailProvider() {
  return {
    async send({ to, subject, message }) {
      return { id: `mock_email_${Date.now()}`, to, subject, message, status: 'sent' };
    },
  };
}
