import { db } from "@/app/_lib/prisma";
import { loadBillCalendars } from "@/app/_lib/bill-calendar";
import { BillCalendar, billMonth1, billYear } from "@/app/_utils/credit-card-bill";
import { formatPeriod } from "@/app/_utils/period";

/** Days before the due date a reminder goes out (0 = on the due day) */
export const BILL_REMINDER_DAYS = [3, 0];

interface ReminderCard {
  id: string;
  userId: string;
  name: string;
  lastFourDigits: string;
  closingDay: number;
  dueDay: number;
}

export interface DueBill {
  card: ReminderCard;
  index: number;
  dueDate: Date;
  daysUntil: number;
}

export interface BillReminder {
  userId: string;
  cardName: string;
  lastFourDigits: string;
  amount: number;
  dueDate: Date;
  daysUntil: number;
  /** Closing period "YYYY-MM" — /credit-cards lists bills by closing month */
  closingPeriod: string;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Bills (per the card's calendar, locked dates included) due exactly `days` from today */
export const findDueBills = (
  cards: ReminderCard[],
  calendars: Map<string, BillCalendar>,
  today: Date,
  days = BILL_REMINDER_DAYS,
): DueBill[] => {
  const result: DueBill[] = [];
  for (const daysUntil of days) {
    const target = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysUntil);
    for (const card of cards) {
      const calendar = calendars.get(card.id)!;
      const index = calendar.billIndexDueIn(target.getFullYear(), target.getMonth() + 1);
      const dueDate = calendar.dueDate(index);
      if (sameDay(dueDate, target)) result.push({ card, index, dueDate, daysUntil });
    }
  }
  return result;
};

/** Unpaid bills with something to pay, due today or in a few days, across all users */
export const getBillReminders = async (today: Date): Promise<BillReminder[]> => {
  const cards = await db.creditCard.findMany({
    select: { id: true, userId: true, name: true, lastFourDigits: true, closingDay: true, dueDay: true },
  });
  if (cards.length === 0) return [];

  const calendars = await loadBillCalendars(cards);
  const due = findDueBills(cards, calendars, today);
  if (due.length === 0) return [];

  const [storedBills, transactions] = await Promise.all([
    db.creditCardBill.findMany({
      where: {
        OR: due.map((d) => ({ creditCardId: d.card.id, month: billMonth1(d.index), year: billYear(d.index) })),
      },
      select: { creditCardId: true, month: true, year: true, status: true },
    }),
    db.transaction.findMany({
      where: {
        OR: due.map((d) => {
          const calendar = calendars.get(d.card.id)!;
          return {
            creditCardId: d.card.id,
            date: { gte: calendar.windowStart(d.index), lte: calendar.closingDate(d.index) },
          };
        }),
      },
      select: { creditCardId: true, amount: true, date: true },
    }),
  ]);

  return due.flatMap((d) => {
    const month = billMonth1(d.index);
    const year = billYear(d.index);
    const stored = storedBills.find((b) => b.creditCardId === d.card.id && b.month === month && b.year === year);
    if (stored?.status === "PAID") return [];

    const calendar = calendars.get(d.card.id)!;
    const amount = transactions
      .filter((t) => t.creditCardId === d.card.id && calendar.billIndexOf(t.date) === d.index)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    if (amount <= 0) return [];

    return [
      {
        userId: d.card.userId,
        cardName: d.card.name,
        lastFourDigits: d.card.lastFourDigits,
        amount,
        dueDate: d.dueDate,
        daysUntil: d.daysUntil,
        closingPeriod: formatPeriod({ year, month }),
      },
    ];
  });
};
