export function createMetricsService(callRepository) {
  return {
    getDashboardMetrics() {
      const rows = callRepository.getMetricsRows();
      const total = rows.length;
      const completed = rows.filter((row) => row.callback_status === 'completed').length;
      const booked = rows.filter((row) => row.outcome === 'booked_meeting').length;
      const urgency = { high: 0, medium: 0, low: 0 };
      const outcomes = {};
      let responseTotal = 0;
      let responseCount = 0;

      for (const row of rows) {
        urgency[row.urgency] = (urgency[row.urgency] || 0) + 1;
        if (row.outcome) outcomes[row.outcome] = (outcomes[row.outcome] || 0) + 1;
        if (row.completed_at) {
          responseTotal += (new Date(row.completed_at).getTime() - new Date(row.call_time).getTime()) / 60_000;
          responseCount += 1;
        }
      }

      return {
        totalMissedCalls: total,
        urgency,
        callbackCompletionRate: total ? Math.round((completed / total) * 100) : 0,
        bookedMeetings: booked,
        conversionRate: total ? Math.round((booked / total) * 100) : 0,
        averageResponseMinutes: responseCount ? Math.round(responseTotal / responseCount) : 0,
        outcomes,
      };
    },
  };
}
