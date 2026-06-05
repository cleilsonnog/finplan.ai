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
  const cycleEnds: { cardId: string; cycleEnd: Date }[] = [];

  for (const cc of creditCards) {
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;

    const startDay = cc.closingDay + 1;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const clampedStartDay = Math.min(startDay, daysInPrevMonth);

    const daysInCurrentMonth = new Date(year, monthNum, 0).getDate();
    const clampedClosingDay = Math.min(cc.closingDay, daysInCurrentMonth);

    const cycleStart = new Date(prevYear, prevMonth - 1, clampedStartDay);
    const cycleEnd = new Date(
      year,
      monthNum - 1,
      clampedClosingDay,
      23,
      59,
      59,
      999,
    );

    cycleEnds.push({ cardId: cc.id, cycleEnd });

    const currentAgg = await db.transaction.aggregate({
      where: {
        creditCardId: cc.id,
        date: { gte: cycleStart, lte: cycleEnd },
      },
      _sum: { amount: true },
    });

    currentMonthBill += Number(currentAgg._sum?.amount ?? 0);
  }

  const earliestCycleEnd = cycleEnds.reduce(
    (min, c) => (c.cycleEnd < min ? c.cycleEnd : min),
    cycleEnds[0].cycleEnd,
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
    const cardCycleEnd = cycleEnds.find(
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
