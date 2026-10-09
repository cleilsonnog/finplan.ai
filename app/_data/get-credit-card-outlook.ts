import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { getCreditCardBillsForUser } from "@/app/_data/get-credit-card-bills";
import type { BillStatus } from "@prisma/client";

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
  /** Bill of the selected month (usually closed, waiting payment) */
  currentBill: {
    amount: number;
    status: BillStatus;
    dueDate: string;
  };
  /** Bill of the next month (open, still receiving purchases) */
  openBill: {
    amount: number;
    closingDate: string;
    dueDate: string;
  };
  /** Sum of everything not yet billed or not paid: open bill + future installments (+ current bill if unpaid) */
  usedLimit: number;
}

export interface UpcomingBillMonth {
  key: string;
  label: string;
  total: number;
  byCard: { cardId: string; name: string; amount: number }[];
}

export interface CreditCardOutlook {
  cards: CardOutlook[];
  upcoming: UpcomingBillMonth[];
}

// A purchase dated after the closing day belongs to the next month's bill
const billIndexOf = (date: Date, closingDay: number) => {
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const offset = date.getDate() > Math.min(closingDay, daysInMonth) ? 1 : 0;
  return date.getFullYear() * 12 + date.getMonth() + offset;
};

const dueDateOf = (billIndex: number, closingDay: number, dueDay: number) => {
  const year = Math.floor(billIndex / 12);
  const month = billIndex % 12;
  const dueMonth = dueDay > closingDay ? month : month + 1;
  const daysInMonth = new Date(year, dueMonth + 1, 0).getDate();
  return new Date(year, dueMonth, Math.min(dueDay, daysInMonth));
};

const closingDateOf = (billIndex: number, closingDay: number) => {
  const year = Math.floor(billIndex / 12);
  const month = billIndex % 12;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(closingDay, daysInMonth));
};

export const getCreditCardOutlook = async (
  month: string,
): Promise<CreditCardOutlook> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const year = new Date().getFullYear();
  const currentIndex = year * 12 + Number(month) - 1;
  const openIndex = currentIndex + 1;

  const creditCards = await db.creditCard.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
  if (creditCards.length === 0) return { cards: [], upcoming: [] };

  // Earliest date that can belong to the current bill: day after closing, previous month
  const rangeStart = new Date(year, Number(month) - 2, 1);

  const [transactions, bills] = await Promise.all([
    db.transaction.findMany({
      where: {
        creditCardId: { in: creditCards.map((c) => c.id) },
        date: { gte: rangeStart },
      },
      select: { amount: true, date: true, creditCardId: true },
    }),
    getCreditCardBillsForUser(userId, month, { persist: false }),
  ]);

  // cardId → billIndex → amount
  const perCard = new Map<string, Map<number, number>>();
  const closingDayById = new Map(creditCards.map((c) => [c.id, c.closingDay]));
  for (const tx of transactions) {
    const cardId = tx.creditCardId!;
    const index = billIndexOf(tx.date, closingDayById.get(cardId)!);
    if (index < currentIndex) continue;
    if (!perCard.has(cardId)) perCard.set(cardId, new Map());
    const months = perCard.get(cardId)!;
    months.set(index, (months.get(index) ?? 0) + Number(tx.amount));
  }

  const cards: CardOutlook[] = creditCards.map((cc) => {
    const months = perCard.get(cc.id) ?? new Map<number, number>();
    const bill = bills.find((b) => b.creditCardId === cc.id);
    const currentAmount = bill?.totalAmount ?? months.get(currentIndex) ?? 0;
    const status: BillStatus = bill?.status ?? "OPEN";

    let futureTotal = 0;
    months.forEach((amount, index) => {
      if (index >= openIndex) futureTotal += amount;
    });

    return {
      id: cc.id,
      name: cc.name,
      lastFourDigits: cc.lastFourDigits,
      brand: cc.brand,
      bank: cc.bank,
      limit: Number(cc.limit),
      currentBill: {
        amount: currentAmount,
        status,
        dueDate: (bill ? new Date(bill.dueDate) : dueDateOf(currentIndex, cc.closingDay, cc.dueDay)).toISOString(),
      },
      openBill: {
        amount: months.get(openIndex) ?? 0,
        closingDate: closingDateOf(openIndex, cc.closingDay).toISOString(),
        dueDate: dueDateOf(openIndex, cc.closingDay, cc.dueDay).toISOString(),
      },
      usedLimit: futureTotal + (status === "PAID" ? 0 : currentAmount),
    };
  });

  const upcoming: UpcomingBillMonth[] = [];
  for (let i = 0; i < UPCOMING_BILLS; i++) {
    const index = openIndex + i;
    const byCard = creditCards
      .map((cc) => ({
        cardId: cc.id,
        name: cc.name,
        amount: perCard.get(cc.id)?.get(index) ?? 0,
      }))
      .filter((c) => c.amount > 0);
    const labelYear = String(Math.floor(index / 12)).slice(2);
    upcoming.push({
      key: String(index),
      label: `${MONTH_LABELS[index % 12]}/${labelYear}`,
      total: byCard.reduce((sum, c) => sum + c.amount, 0),
      byCard,
    });
  }

  return { cards, upcoming };
};
