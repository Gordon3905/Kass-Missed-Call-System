export function createMockPhoneProvider() {
  return {
    sampleMissedCall() {
      return {
        clientId: 'client_covault_demo',
        from: '+14155550123',
        callerName: 'Avery Johnson',
        callTime: new Date().toISOString(),
        durationSeconds: 52,
        recordingUrl: 'mock://recordings/high-priority-buyer',
        providerCallId: `mock_call_${Date.now()}`,
      };
    },
  };
}
