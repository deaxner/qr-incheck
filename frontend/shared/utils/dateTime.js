const DISPLAY_TIME_ZONE = 'Europe/Amsterdam';

function toDate(timestamp) {
  const date = new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatClockTime(timestamp) {
  const date = toDate(timestamp);

  if (!date) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

export function formatDate(timestamp) {
  const date = toDate(timestamp);

  if (!date) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

export function formatDateTime(timestamp) {
  const date = toDate(timestamp);

  if (!date) {
    return timestamp;
  }

  return new Intl.DateTimeFormat('nl-NL', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: DISPLAY_TIME_ZONE
  }).format(date);
}

export function formatDuration(minutes) {
  if (!minutes) {
    return '--';
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (0 === hours) {
    return `${remainingMinutes}m`;
  }

  return `${hours}u ${String(remainingMinutes).padStart(2, '0')}m`;
}
