function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatDateTimeLocalValue(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '';

  return [
    date.getFullYear(),
    '-',
    padDatePart(date.getMonth() + 1),
    '-',
    padDatePart(date.getDate()),
    'T',
    padDatePart(date.getHours()),
    ':',
    padDatePart(date.getMinutes()),
  ].join('');
}

export function parseDateTimeLocalValue(value: string): Date | undefined {
  if (!value) return undefined;

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
}
