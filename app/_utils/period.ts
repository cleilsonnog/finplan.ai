// A "period" is the year + month the app is filtered by, carried in the URL as ?month=YYYY-MM.
// Older links used ?month=MM (current year implied) and are still accepted.
//
// Server dates run in America/Sao_Paulo (see instrumentation.ts), so local Date constructors
// below produce Brasília month boundaries. Never build these with ISO strings like
// "2026-10-01" — those parse as UTC midnight (21h of the previous day in Brasília).

export interface Period {
  year: number;
  /** 1-12 */
  month: number;
}

const PERIOD_RE = /^(\d{4})-(\d{1,2})$/;
const LEGACY_RE = /^\d{1,2}$/;

export const currentPeriod = (now = new Date()): Period => ({
  year: now.getFullYear(),
  month: now.getMonth() + 1,
});

/** Parses "YYYY-MM" (or legacy "MM", assumed current year). Returns null when invalid. */
export const parsePeriod = (value?: string | null): Period | null => {
  if (!value) return null;
  const full = PERIOD_RE.exec(value);
  const year = full ? Number(full[1]) : LEGACY_RE.test(value) ? currentPeriod().year : NaN;
  const month = full ? Number(full[2]) : Number(value);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return { year, month };
};

/** Like parsePeriod, but throws — for data functions that receive an already-validated value */
export const toPeriod = (value: string): Period => {
  const period = parsePeriod(value);
  if (!period) throw new Error(`Invalid period: ${value}`);
  return period;
};

export const formatPeriod = ({ year, month }: Period) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const isCanonicalPeriod = (value?: string | null) =>
  !!value && /^\d{4}-\d{2}$/.test(value) && parsePeriod(value) !== null;

export const shiftPeriod = ({ year, month }: Period, months: number): Period => {
  const d = new Date(year, month - 1 + months, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

/** [start, end) of the period's month, in Brasília time */
export const periodRange = ({ year, month }: Period) => ({
  start: new Date(year, month - 1, 1),
  end: new Date(year, month, 1),
});

const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export const periodLabel = ({ year, month }: Period, withYear = true) =>
  withYear ? `${MONTH_NAMES[month - 1]} de ${year}` : MONTH_NAMES[month - 1];
