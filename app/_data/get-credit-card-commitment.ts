import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

export interface MonthlyCommitment {
  month: number;
  year: number;
  label: string;
  amount: number;
}

export interface CardCommitment {
  cardId: string;
  cardName: string;
  lastFourDigits: string;
  color: string;
  months: MonthlyCommitment[];
  total: number;
}

export interface CreditCardCommitment {
  currentMonthBill: number;
  futureByCard: CardCommitment[];
  futureTotal: number;
}

export const getCreditCardCommitment = async (
  month: string,
): Promise<CreditCardCommitment> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const year = new Date().getFullYear();
  const monthNum = Number(month);

  const creditCards = await db.creditCard.findMany({
    where: { userId },
    select: { id: true, name: true, lastFourDigits: true, color: true, closingDay: true },
  });

  if (creditCards.length === 0) {
    return { currentMonthBill: 0, futureByCard: [], futureTotal: 0 };
  }

  let currentMonthBill = 0;

  // Two separate cycle calculations:
  // 1. Bill cycle (month+1) for "Cartão no mês" (current spending → next bill)
  // 2. Current cycle (month) for future commitment cutoff
  const billMonth = monthNum === 12 ? 1 : monthNum + 1;
  const billYear = monthNum === 12 ? year + 1 : year;

  const currentCycleEnds: { cardId: string; cycleEnd: Date }[] = [];

  for (const cc of creditCards) {
    // Bill cycle (month+1): what I'm spending now
    const billStartDay = cc.closingDay + 1;
    const daysInCurrentMonth = new Date(year, monthNum, 0).getDate();
    const clampedBillStartDay = Math.min(billStartDay, daysInCurrentMonth);
    const daysInBillMonth = new Date(billYear, billMonth, 0).getDate();
    const clampedBillClosingDay = Math.min(cc.closingDay, daysInBillMonth);

    const billCycleStart = new Date(year, monthNum - 1, clampedBillStartDay);
    const billCycleEnd = new Date(billYear, billMonth - 1, clampedBillClosingDay, 23, 59, 59, 999);

    const currentAgg = await db.transaction.aggregate({
      where: {
        creditCardId: cc.id,
        date: { gte: billCycleStart, lte: billCycleEnd },
      },
      _sum: { amount: true },
    });
    currentMonthBill += Number(currentAgg._sum?.amount ?? 0);

    // Current cycle (month): cutoff for future commitment
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const startDay = cc.closingDay + 1;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const clampedStartDay = Math.min(startDay, daysInPrevMonth);
    const clampedClosingDay = Math.min(cc.closingDay, daysInCurrentMonth);

    const currentCycleEnd = new Date(year, monthNum - 1, clampedClosingDay, 23, 59, 59, 999);
    currentCycleEnds.push({ cardId: cc.id, cycleEnd: currentCycleEnd });
  }

  const earliestCycleEnd = currentCycleEnds.reduce(
    (min, c) => (c.cycleEnd < min ? c.cycleEnd : min),
    currentCycleEnds[0].cycleEnd,
  );

  const futureTransactions = await db.transaction.findMany({
    where: {
      creditCardId: {
        in: creditCards.map((cc) => cc.id),
      },
      installments: { gt: 1 },
      date: { gt: earliestCycleEnd },
    },
    select: {
      amount: true,
      date: true,
      creditCardId: true,
    },
  });

  // Group by card → month
  const cardMap = new Map<string, Map<string, MonthlyCommitment>>();

  for (const tx of futureTransactions) {
    const cardCycleEnd = currentCycleEnds.find(
      (c) => c.cardId === tx.creditCardId,
    )?.cycleEnd;
    if (cardCycleEnd && tx.date <= cardCycleEnd) continue;

    const cardId = tx.creditCardId!;
    const txMonth = tx.date.getMonth() + 1;
    const txYear = tx.date.getFullYear();
    const key = `${txYear}-${txMonth}`;

    if (!cardMap.has(cardId)) {
      cardMap.set(cardId, new Map());
    }
    const monthMap = cardMap.get(cardId)!;

    const existing = monthMap.get(key);
    if (existing) {
      existing.amount += Number(tx.amount);
    } else {
      const label = new Intl.DateTimeFormat("pt-BR", {
        month: "short",
        year: "2-digit",
      }).format(tx.date);

      monthMap.set(key, {
        month: txMonth,
        year: txYear,
        label: label.replace(".", "").replace(" de ", "/"),
        amount: Number(tx.amount),
      });
    }
  }

  const futureByCard: CardCommitment[] = [];

  for (const cc of creditCards) {
    const monthMap = cardMap.get(cc.id);
    if (!monthMap || monthMap.size === 0) continue;

    const months = Array.from(monthMap.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );
    const total = months.reduce((sum, m) => sum + m.amount, 0);

    futureByCard.push({
      cardId: cc.id,
      cardName: cc.name,
      lastFourDigits: cc.lastFourDigits,
      color: cc.color,
      months,
      total,
    });
  }

  const futureTotal = futureByCard.reduce((sum, c) => sum + c.total, 0);

  return { currentMonthBill, futureByCard, futureTotal };
};
