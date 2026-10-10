import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { toPeriod } from "@/app/_utils/period";
import { toBillIndex } from "@/app/_utils/credit-card-bill";
import { loadBillCalendars } from "@/app/_lib/bill-calendar";

export interface CreditCardSummaryItem {
  card: {
    id: string;
    name: string;
    lastFourDigits: string;
    brand: string;
    bank: string;
    color: string;
    limit: number;
    closingDay: number;
    dueDay: number;
  };
  invoiceTotal: number;
  cashTotal: number;
  installmentTotal: number;
  availableLimit: number;
  usagePercent: number;
}

export interface CreditCardSummary {
  cards: CreditCardSummaryItem[];
  totalInvoice: number;
  totalCash: number;
  totalInstallment: number;
  totalLimit: number;
  totalAvailable: number;
  totalUsagePercent: number;
}

export const getCreditCardSummary = async (
  month: string,
): Promise<CreditCardSummary> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  return getCreditCardSummaryForUser(result.effectiveUserId, month);
};

// Same data for an explicit user (used by token-authenticated integrations, without a Clerk session)
export const getCreditCardSummaryForUser = async (
  userId: string,
  month: string,
): Promise<CreditCardSummary> => {

  const creditCards = await db.creditCard.findMany({
    where: { userId },
  });

  if (creditCards.length === 0) {
    return {
      cards: [],
      totalInvoice: 0,
      totalCash: 0,
      totalInstallment: 0,
      totalLimit: 0,
      totalAvailable: 0,
      totalUsagePercent: 0,
    };
  }

  const { year, month: monthNum } = toPeriod(month);

  // Bill window per card from its calendar (locked dates when known)
  const calendars = await loadBillCalendars(creditCards);
  const index = toBillIndex(year, monthNum);
  const cardCycles = creditCards.map((cc) => {
    const calendar = calendars.get(cc.id)!;
    return { cc, cycleStart: calendar.windowStart(index), cycleEnd: calendar.closingDate(index) };
  });

  // Find global min/max dates across all cards for a single query
  const globalStart = cardCycles.reduce(
    (min, c) => (c.cycleStart < min ? c.cycleStart : min),
    cardCycles[0].cycleStart,
  );
  const globalEnd = cardCycles.reduce(
    (max, c) => (c.cycleEnd > max ? c.cycleEnd : max),
    cardCycles[0].cycleEnd,
  );

  // Single query: fetch all CC transactions in the global date range
  const allTransactions = await db.transaction.findMany({
    where: {
      creditCardId: { in: creditCards.map((cc) => cc.id) },
      date: { gte: globalStart, lte: globalEnd },
    },
    select: { creditCardId: true, amount: true, installments: true, date: true },
  });

  // Aggregate in memory per card (filtering by each card's specific cycle)
  const cards: CreditCardSummaryItem[] = cardCycles.map(({ cc, cycleStart, cycleEnd }) => {
    let cashTotal = 0;
    let installmentTotal = 0;

    for (const tx of allTransactions) {
      if (tx.creditCardId !== cc.id) continue;
      if (tx.date < cycleStart || tx.date > cycleEnd) continue;
      const amount = Number(tx.amount);
      if (tx.installments > 1) {
        installmentTotal += amount;
      } else {
        cashTotal += amount;
      }
    }

    const invoiceTotal = cashTotal + installmentTotal;
    const limit = Number(cc.limit);

    return {
      card: {
        id: cc.id,
        name: cc.name,
        lastFourDigits: cc.lastFourDigits,
        brand: cc.brand,
        bank: cc.bank,
        color: cc.color,
        limit,
        closingDay: cc.closingDay,
        dueDay: cc.dueDay,
      },
      invoiceTotal,
      cashTotal,
      installmentTotal,
      availableLimit: limit - invoiceTotal,
      usagePercent: limit > 0 ? Math.round((invoiceTotal / limit) * 100) : 0,
    };
  });

  const totalInvoice = cards.reduce((sum, c) => sum + c.invoiceTotal, 0);
  const totalCash = cards.reduce((sum, c) => sum + c.cashTotal, 0);
  const totalInstallment = cards.reduce((sum, c) => sum + c.installmentTotal, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.card.limit, 0);
  const totalAvailable = totalLimit - totalInvoice;
  const totalUsagePercent =
    totalLimit > 0 ? Math.round((totalInvoice / totalLimit) * 100) : 0;

  return {
    cards,
    totalInvoice,
    totalCash,
    totalInstallment,
    totalLimit,
    totalAvailable,
    totalUsagePercent,
  };
};
