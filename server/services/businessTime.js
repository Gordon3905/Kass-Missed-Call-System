import { addDays, format } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function nextBusinessStart(date, timezone, businessHours) {
  for (let offset = 0; offset < 10; offset += 1) {
    const candidate = addDays(date, offset);
    const zoned = toZonedTime(candidate, timezone);
    const dayName = dayNames[zoned.getDay()];
    const hours = businessHours[dayName];
    if (hours) {
      const localDate = format(zoned, 'yyyy-MM-dd');
      return fromZonedTime(`${localDate}T${hours[0]}:00`, timezone).toISOString();
    }
  }
  return date.toISOString();
}

export function calculateDueAt({ callTime, urgency, timezone, businessHours }) {
  const callDate = new Date(callTime);
  if (urgency === 'high') return callDate.toISOString();
  if (urgency === 'low') return nextBusinessStart(addDays(callDate, 3), timezone, businessHours);
  return nextBusinessStart(addDays(callDate, 1), timezone, businessHours);
}
