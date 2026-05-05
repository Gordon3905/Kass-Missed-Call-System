import { CalendarCheck, Clock3, LineChart, PhoneMissed, Target, TimerReset } from 'lucide-react';
import { formatPercent } from '../data/formatters.js';

export function MetricsBar({ metrics }) {
  const items = [
    ['Missed calls', metrics?.totalMissedCalls ?? 0, PhoneMissed],
    ['Completion', formatPercent(metrics?.callbackCompletionRate), CalendarCheck],
    ['Booked meetings', metrics?.bookedMeetings ?? 0, Target],
    ['Conversion', formatPercent(metrics?.conversionRate), LineChart],
    ['Avg response', `${metrics?.averageResponseMinutes ?? 0}m`, Clock3],
    ['High urgency', metrics?.urgency?.high ?? 0, TimerReset],
  ];

  return (
    <section className="metrics-grid" aria-label="Missed call metrics">
      {items.map(([label, value, Icon]) => (
        <article className="metric-card" key={label}>
          <div className="metric-icon"><Icon size={18} /></div>
          <span>{label}</span>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
