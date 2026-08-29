/** Team calendar is US Central — training rooms run on a local week, not UTC. */
export const TEAM_TZ = "America/Chicago";

export function chicagoDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEAM_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Monday (YYYY-MM-DD) of the current team week. */
export function weekStartMonday(d = new Date()): string {
  const ymd = chicagoDate(d);
  const [y, m, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, day, 12));
  const dow = utc.getUTCDay();
  const shift = dow === 0 ? -6 : 1 - dow;
  utc.setUTCDate(utc.getUTCDate() + shift);
  return utc.toISOString().slice(0, 10);
}

export function weekEndSunday(start: string): string {
  const [y, m, d] = start.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, 12));
  utc.setUTCDate(utc.getUTCDate() + 6);
  return utc.toISOString().slice(0, 10);
}

export function formatWeekRange(start: string): string {
  const [y, m, d] = start.split("-").map(Number);
  const from = new Date(y, m - 1, d);
  const to = new Date(y, m - 1, d + 6);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${fmt.format(from)} – ${fmt.format(to)}`;
}

export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TEAM_TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
