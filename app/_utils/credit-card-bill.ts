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
