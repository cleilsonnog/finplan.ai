// Credit card bill math. Purchases are stored with their REAL date; which bill a purchase
// belongs to is derived here from the card's closing day — the only place that rule applies.
//
// A bill is identified by a "bill index" = year * 12 + monthIndex (0-based) of its CLOSING
// month, matching CreditCardBill.month/year. Bill of month M holds purchases from
// (M-1, closingDay+1) to (M, closingDay).

export const toBillIndex = (year: number, month1: number) => year * 12 + month1 - 1;

export const billYear = (index: number) => Math.floor(index / 12);
export const billMonth1 = (index: number) => (index % 12) + 1;

const clampDay = (year: number, monthIndex: number, day: number) =>
  Math.min(day, new Date(year, monthIndex + 1, 0).getDate());

/** Bill a purchase made on `date` falls into */
export const billIndexOf = (date: Date, closingDay: number) => {
  const closing = clampDay(date.getFullYear(), date.getMonth(), closingDay);
  const offset = date.getDate() > closing ? 1 : 0;
  return date.getFullYear() * 12 + date.getMonth() + offset;
};

export const closingDateOf = (index: number, closingDay: number) => {
  const year = billYear(index);
  const month = index % 12;
  return new Date(year, month, clampDay(year, month, closingDay), 23, 59, 59, 999);
};

/** Due day after the closing day → same month; otherwise the month after closing */
export const dueDateOf = (index: number, closingDay: number, dueDay: number) => {
  const dueIndex = dueDay > closingDay ? index : index + 1;
  const year = billYear(dueIndex);
  const month = dueIndex % 12;
  return new Date(year, month, clampDay(year, month, dueDay), 23, 59, 59, 999);
};

/** Bill whose due date falls in the given month (inverse of dueDateOf) */
export const billIndexDueIn = (
  year: number,
  month1: number,
  closingDay: number,
  dueDay: number,
) => {
  const dueIndex = toBillIndex(year, month1);
  return dueDay > closingDay ? dueIndex : dueIndex - 1;
};

/**
 * Dates for N installments starting at the purchase date: one per consecutive bill.
 * Month-end purchases can't simply add months (Jan 31 + 1 month = Feb 28 may land in the
 * same bill as Jan 31) — in that case the installment is pinned to its bill's closing day.
 */
export const installmentDates = (purchase: Date, count: number, closingDay: number) => {
  const firstBill = billIndexOf(purchase, closingDay);
  return Array.from({ length: count }, (_, i) => {
    const monthStart = new Date(purchase.getFullYear(), purchase.getMonth() + i, 1);
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const date = new Date(
      year,
      month,
      clampDay(year, month, purchase.getDate()),
      purchase.getHours(),
      purchase.getMinutes(),
    );
    if (billIndexOf(date, closingDay) === firstBill + i) return date;
    const closing = closingDateOf(firstBill + i, closingDay);
    closing.setHours(12, 0, 0, 0);
    return closing;
  });
};

// ---------------------------------------------------------------------------------------------
// Bill calendar: the closing day can change over time (banks move it). Bills whose dates are
// known for sure — imported from the bank's PDF, or frozen once closed — keep them; the
// card's current closing day only fills in the rest (open and future bills).
// ---------------------------------------------------------------------------------------------

export interface KnownBillDates {
  index: number;
  closingDate: Date;
  dueDate: Date;
}

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

export class BillCalendar {
  private known: Map<number, KnownBillDates>;

  constructor(
    private card: { closingDay: number; dueDay: number },
    known: KnownBillDates[] = [],
  ) {
    this.known = new Map(known.map((k) => [k.index, { ...k, closingDate: endOfDay(k.closingDate) }]));
  }

  /**
   * Effective dates of a bill. Known bills keep theirs. A computed bill that would close or be
   * due no later than the previous one is a "phantom" created by a change of closing day
   * (e.g. closing 29 → 1 flips which month a bill is due in): it gets the previous bill's
   * dates, so its window is empty and purchases flow to the next bill.
   */
  private effective(index: number, depth = 4): { closing: Date; due: Date } {
    const known = this.known.get(index);
    if (known) return { closing: known.closingDate, due: known.dueDate };
    const closing = closingDateOf(index, this.card.closingDay);
    const due = dueDateOf(index, this.card.closingDay, this.card.dueDay);
    // Without a known bill nearby the computed sequence is already consistent
    if (depth === 0) return { closing, due };
    const prev = this.effective(index - 1, depth - 1);
    // Compare calendar days: stored dates and computed ones carry different times of day
    const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (day(closing) <= day(prev.closing) || day(due) <= day(prev.due)) return prev;
    return { closing, due };
  }

  closingDate(index: number): Date {
    return this.effective(index).closing;
  }

  dueDate(index: number): Date {
    return this.effective(index).due;
  }

  /** A phantom bill (see effective) never receives purchases */
  private isEmpty(index: number) {
    return !this.known.has(index) && this.closingDate(index).getTime() === this.closingDate(index - 1).getTime();
  }

  isKnown(index: number) {
    return this.known.has(index);
  }

  /** Same calendar with extra known bill dates (e.g. read from a bill being imported) */
  with(extra: KnownBillDates): BillCalendar {
    return new BillCalendar(this.card, [...this.known.values(), extra]);
  }

  /** Bill a purchase made on `date` falls into */
  billIndexOf(date: Date): number {
    let i = billIndexOf(date, this.card.closingDay);
    for (let step = 0; step < 6 && date <= this.closingDate(i - 1); step++) i--;
    for (let step = 0; step < 6 && date > this.closingDate(i); step++) i++;
    return i;
  }

  /** First moment of a bill's window (just after the previous bill closed) */
  windowStart(index: number): Date {
    return new Date(this.closingDate(index - 1).getTime() + 1);
  }

  /** Bill whose due date falls in the given month */
  billIndexDueIn(year: number, month1: number): number {
    const guess = billIndexDueIn(year, month1, this.card.closingDay, this.card.dueDay);
    for (const i of [guess, guess - 1, guess + 1, guess - 2, guess + 2]) {
      if (this.isEmpty(i)) continue;
      const due = this.dueDate(i);
      if (due.getFullYear() === year && due.getMonth() + 1 === month1) return i;
    }
    return guess;
  }

  /** One installment per consecutive bill, starting with the purchase's own bill */
  installmentDates(purchase: Date, count: number): Date[] {
    const first = this.billIndexOf(purchase);
    return Array.from({ length: count }, (_, k) => {
      const monthStart = new Date(purchase.getFullYear(), purchase.getMonth() + k, 1);
      const year = monthStart.getFullYear();
      const month = monthStart.getMonth();
      const candidate = new Date(year, month, clampDay(year, month, purchase.getDate()), purchase.getHours(), purchase.getMinutes());
      if (this.billIndexOf(candidate) === first + k) return candidate;
      const closing = new Date(this.closingDate(first + k));
      closing.setHours(12, 0, 0, 0);
      return closing;
    });
  }
}
