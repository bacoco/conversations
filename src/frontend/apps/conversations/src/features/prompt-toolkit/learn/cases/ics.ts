/** Thursday at 10 a.m.: a quiet moment of the week, changeable in the diary. */
const WEEKDAY = 4;
const HOUR = 10;
const MINUTES = 20;

const two = (value: number) => String(value).padStart(2, '0');

/** Local time, with no zone: the diary shows it at that hour wherever it is. */
const stamp = (date: Date) =>
  `${date.getFullYear()}${two(date.getMonth() + 1)}${two(date.getDate())}T${two(
    date.getHours(),
  )}${two(date.getMinutes())}00`;

/** Commas, semicolons and backslashes are escaped in diary texts. */
const text = (value: string) =>
  value
    .split('\\')
    .join('\\\\')
    .split(';')
    .join('\;')
    .split(',')
    .join('\\,')
    .split('\n')
    .join('\\n');

/**
 * "Réserver 20 minutes par semaine": a weekly event to open in Outlook or
 * any diary. Made in the browser: nothing is sent anywhere.
 */
export const weeklySlotIcs = (
  now: Date,
  { title, description }: { title: string; description: string },
) => {
  const start = new Date(now);
  start.setHours(HOUR, 0, 0, 0);
  const ahead = (WEEKDAY - start.getDay() + 7) % 7 || 7;
  start.setDate(start.getDate() + ahead);
  const end = new Date(start.getTime() + MINUTES * 60 * 1000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nestor//Assistant IA//FR',
    'BEGIN:VEVENT',
    `UID:nestor-${start.getTime()}@assistant-ia`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    'RRULE:FREQ=WEEKLY',
    `SUMMARY:${text(title)}`,
    `DESCRIPTION:${text(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.join('\r\n')}\r\n`;
};

/** Saves the diary file: the browser downloads it, nothing is sent. */
export const downloadIcs = (ics: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
