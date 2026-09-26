// Shared date helpers.
//
// Every calendar value in this app is stored as a plain "YYYY-MM-DD" string and
// must be parsed as a LOCAL date. `new Date("2026-09-24")` is parsed as UTC
// midnight, which renders as the previous day in negative-offset timezones, so
// always go through the helpers here instead of the Date constructor.

export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

// Epoch ms for local midnight, or null when the value isn't YYYY-MM-DD.
export function parseYmd(value: string): number | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day).getTime();
}

// Whole days from `from` until `value`. Both sides are local midnight, so DST
// transitions cancel out and the result is never fractional.
export function daysUntil(value: string, from: string): number | null {
  const target = parseYmd(value);
  const start = parseYmd(from);
  if (target === null || start === null) return null;
  return Math.round((target - start) / 86400000);
}

// Renders a YYYY-MM-DD value as e.g. "Sep 24, 2026" without shifting the day.
export function formatYmd(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Adds months, clamping to the last day of the target month
// (Jan 31 + 1 month -> Feb 28/29, never Mar 2 or 3).
export function addMonths(startDate: string, months: number): string {
  const date = parseLocalDate(startDate);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return formatLocalDate(date);
}

export function todayYmd(): string {
  return formatLocalDate(new Date());
}
