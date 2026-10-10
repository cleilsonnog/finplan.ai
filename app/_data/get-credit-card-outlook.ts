import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import type { BillStatus } from "@prisma/client";
import {
  billIndexDueIn,
  billIndexOf,
  billMonth1,
  billYear,
  closingDateOf,
  dueDateOf,
} from "@/app/_utils/credit-card-bill";

const UPCOMING_BILLS = 6;

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export interface CardOutlook {
  id: string;
  name: string;
  lastFourDigits: string;
  brand: string;
  bank: string;
  limit: number;
  /** Bill due in the selected month — the one that hits this month's balance once paid */
  dueBill: {
    amount: number;
    status: BillStatus;
    closingDate: string;
    dueDate: string;
    /** Closing month (1-12) — /credit-cards lists bills by closing month */
    closingMonth: number;
  };
  /** The following bill (usually still open, receiving purchases) */
  nextBill: {
    amount: number;
    closingDate: string;
    dueDate: string;
  };
  /** Everything charged and not paid yet: due bill (if unpaid) + all later bills */
  usedLimit: number;
}

export interface UpcomingBillMonth {
  key: string;
  /** Due month, e.g. "Nov/26" */
  label: string;
  total: number;
  byCard: { cardId: string; name: string; amount: number }[];
}

export interface CreditCardOutlook {
  cards: CardOutlook[];
  upcoming: UpcomingBillMonth[];
}

const statusOf = (stored: BillStatus | undefined, closing: Date, due: Date, now: Date): BillStatus => {
  if (stored === "PAID") return "PAID";
  if (now <= closing) return "OPEN";
  if (now > due) return "OVERDUE";
  return "CLOSED";
};

export const getCreditCardOutlook = async (month: string): Promise<CreditCardOutlook> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const now = new Date();
  const year = now.getFullYear();
  const month1 = Number(month);

  const creditCards = await db.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (creditCards.length === 0) return { cards: [], upcoming: [] };

  const dueIndexById = new Map(
    creditCards.map((cc) => [cc.id, billIndexDueIn(year, month1, cc.closingDay, cc.dueDay)]),
  );
  // Earliest purchase that can belong to any card's due bill: start of the month before it closes
  const earliestIndex = Math.min(...dueIndexById.values()) - 1;
  const rangeStart = new Date(billYear(earliestIndex), earliestIndex % 12, 1);

  const [transactions, storedBills] = await Promise.all([
    db.transaction.findMany({
      where: {
        creditCardId: { in: creditCards.map((c) => c.id) },
        date: { gte: rangeStart },
      },
      select: { amount: true, date: true, creditCardId: true },
    }),
    db.creditCardBill.findMany({
      where: {
        OR: creditCards.map((cc) => {
          const index = dueIndexById.get(cc.id)!;
          return { creditCardId: cc.id, month: billMonth1(index), year: billYear(index) };
        }),
      },
      select: { creditCardId: true, status: true },
    }),
  ]);

  // cardId → billIndex → amount
  const perCard = new Map<string, Map<number, number>>();
  const closingDayById = new Map(creditCards.map((c) => [c.id, c.closingDay]));
  for (const tx of transactions) {
    const cardId = tx.creditCardId!;
    const index = billIndexOf(tx.date, closingDayById.get(cardId)!);
    if (index < dueIndexById.get(cardId)!) continue;
    if (!perCard.has(cardId)) perCard.set(cardId, new Map());
    const bills = perCard.get(cardId)!;
    bills.set(index, (bills.get(index) ?? 0) + Number(tx.amount));
  }

  const cards: CardOutlook[] = creditCards.map((cc) => {
    const bills = perCard.get(cc.id) ?? new Map<number, number>();
    const dueIndex = dueIndexById.get(cc.id)!;
    const closing = closingDateOf(dueIndex, cc.closingDay);
    const due = dueDateOf(dueIndex, cc.closingDay, cc.dueDay);
    const stored = storedBills.find((b) => b.creditCardId === cc.id)?.status;
    const status = statusOf(stored, closing, due, now);
    const dueAmount = bills.get(dueIndex) ?? 0;

    let laterTotal = 0;
    bills.forEach((amount, index) => {
      if (index > dueIndex) laterTotal += amount;
    });

    return {
      id: cc.id,
      name: cc.name,
      lastFourDigits: cc.lastFourDigits,
      brand: cc.brand,
      bank: cc.bank,
      limit: Number(cc.limit),
      dueBill: {
        amount: dueAmount,
        status,
        closingDate: closing.toISOString(),
        dueDate: due.toISOString(),
        closingMonth: billMonth1(dueIndex),
      },
      nextBill: {
        amount: bills.get(dueIndex + 1) ?? 0,
        closingDate: closingDateOf(dueIndex + 1, cc.closingDay).toISOString(),
        dueDate: dueDateOf(dueIndex + 1, cc.closingDay, cc.dueDay).toISOString(),
      },
      usedLimit: laterTotal + (status === "PAID" ? 0 : dueAmount),
    };
  });

  // Upcoming bills grouped by DUE month, starting the month after the selected one
  const upcoming: UpcomingBillMonth[] = [];
  for (let i = 1; i <= UPCOMING_BILLS; i++) {
    const dueMonthIndex = year * 12 + month1 - 1 + i;
    const byCard = creditCards
      .map((cc) => ({
        cardId: cc.id,
        name: cc.name,
        amount: perCard.get(cc.id)?.get(dueIndexById.get(cc.id)! + i) ?? 0,
      }))
      .filter((c) => c.amount > 0);
    upcoming.push({
      key: String(dueMonthIndex),
      label: `${MONTH_LABELS[dueMonthIndex % 12]}/${String(billYear(dueMonthIndex)).slice(2)}`,
      total: byCard.reduce((sum, c) => sum + c.amount, 0),
      byCard,
    });
  }

  return { cards, upcoming };
};
