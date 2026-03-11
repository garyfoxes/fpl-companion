export function formatDate(isoString) {
  if (!isoString) return 'TBC';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'TBC';
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
