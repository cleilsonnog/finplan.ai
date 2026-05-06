import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";

export interface CreditCardSummaryItem {
  card: {
    id: string;
    name: string;
    lastFourDigits: string;
    brand: string;
    limit: number;
    closingDay: number;
    dueDay: number;
  };
  invoiceTotal: number;
  availableLimit: number;
  usagePercent: number;
}

export interface CreditCardSummary {
  cards: CreditCardSummaryItem[];
  totalInvoice: number;
  totalLimit: number;
  totalAvailable: number;
  totalUsagePercent: number;
}

export const getCreditCardSummary = async (
  month: string,
): Promise<CreditCardSummary> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const creditCards = await db.creditCard.findMany({
    where: { userId },
  });

  if (creditCards.length === 0) {
    return {
      cards: [],
      totalInvoice: 0,
      totalLimit: 0,
      totalAvailable: 0,
      totalUsagePercent: 0,
    };
  }

  const year = new Date().getFullYear();
  const monthNum = Number(month);

  const cards: CreditCardSummaryItem[] = await Promise.all(
    creditCards.map(async (cc) => {
      const closingDay = cc.closingDay;

      // Cycle: from (closingDay + 1) of previous month to closingDay of current month
      const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
      const prevYear = monthNum === 1 ? year - 1 : year;

      const startDay = closingDay + 1;
      const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
      const clampedStartDay = Math.min(startDay, daysInPrevMonth);

      const daysInCurrentMonth = new Date(year, monthNum, 0).getDate();
      const clampedClosingDay = Math.min(closingDay, daysInCurrentMonth);

      const cycleStart = new Date(prevYear, prevMonth - 1, clampedStartDay);
      const cycleEnd = new Date(year, monthNum - 1, clampedClosingDay, 23, 59, 59, 999);

      const result = await db.transaction.aggregate({
        where: {
          creditCardId: cc.id,
          date: {
            gte: cycleStart,
            lte: cycleEnd,
          },
        },
        _sum: { amount: true },
      });

      const invoiceTotal = Number(result._sum.amount ?? 0);
      const limit = Number(cc.limit);

      return {
        card: {
          id: cc.id,
          name: cc.name,
          lastFourDigits: cc.lastFourDigits,
          brand: cc.brand,
          limit,
          closingDay: cc.closingDay,
          dueDay: cc.dueDay,
        },
        invoiceTotal,
        availableLimit: limit - invoiceTotal,
        usagePercent: limit > 0 ? Math.round((invoiceTotal / limit) * 100) : 0,
      };
    }),
  );

  const totalInvoice = cards.reduce((sum, c) => sum + c.invoiceTotal, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.card.limit, 0);
  const totalAvailable = totalLimit - totalInvoice;
  const totalUsagePercent =
    totalLimit > 0 ? Math.round((totalInvoice / totalLimit) * 100) : 0;

  return {
    cards,
    totalInvoice,
    totalLimit,
    totalAvailable,
    totalUsagePercent,
  };
};
