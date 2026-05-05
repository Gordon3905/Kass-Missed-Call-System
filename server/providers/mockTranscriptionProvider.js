const transcripts = new Map([
  ['mock://recordings/high-priority-buyer', 'Hi, this is Avery Johnson. We are ready to book a walkthrough this week and need pricing before our board meeting tomorrow. Please call me back today.'],
  ['mock://recordings/reschedule-demo', 'This is Mina Patel. I missed my appointment confirmation and need to move the demo from Thursday morning to Friday afternoon.'],
  ['mock://recordings/vendor-switch', 'Our current vendor missed another emergency request. I need someone to call me back today about switching.'],
]);

export function createMockTranscriptionProvider() {
  return {
    async transcribe({ recordingUrl }) {
      return transcripts.get(recordingUrl) || 'Hi, I missed your call and would like someone to call me back when available.';
    },
  };
}
