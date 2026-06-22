import dayjs, { type Dayjs } from 'dayjs';

export function getDefaultComparisonDateRange(today: Dayjs): [string, string] {
  const previousMonth = today.subtract(1, 'month');
  return [
    previousMonth.startOf('month').format('YYYY-MM-DD'),
    previousMonth.date(Math.min(today.date(), previousMonth.daysInMonth())).format('YYYY-MM-DD'),
  ];
}

export function calculateChange(current: number | null, comparison: number | null) {
  if (current === null || comparison === null || comparison === 0) return null;
  return (current - comparison) / comparison;
}

export function getDateComparisonKey(date: string) {
  return dayjs(date).format('DD');
}
