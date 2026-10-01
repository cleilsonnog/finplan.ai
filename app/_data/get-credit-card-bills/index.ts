import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { BillStatus } from "@prisma/client";

export interface SerializedBill {
  id: string;
  creditCardId: string;
  creditCardName: string;
  creditCardLastFour: string;
  creditCardBrand: string;
  creditCardBank: string;
  month: number;
  year: number;
  closingDate: string;
  dueDate: string;
  totalAmount: number;
  status: BillStatus;
  paidAt: string | null;
}

function computeBillStatus(
  currentStatus: BillStatus,
  closingDate: Date,
  dueDate: Date,
  now: Date,
): BillStatus {
  if (currentStatus === "PAID") return "PAID";
  if (now <= closingDate) return "OPEN";
  if (now > dueDate) return "OVERDUE";
  return "CLOSED";
}

export const getCreditCardBills = async (
  month: string,
): Promise<SerializedBill[]> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  return getCreditCardBillsForUser(result.effectiveUserId, month);
};

// Same data for an explicit user. With persist: false the bills are computed in memory only
// (no create/update), for read-only integrations.
export const getCreditCardBillsForUser = async (
  userId: string,
  month: string,
  { persist = true }: { persist?: boolean } = {},
): Promise<SerializedBill[]> => {

  const monthNum = Number(month);
  const year = new Date().getFullYear();
  const now = new Date();

  const creditCards = await db.creditCard.findMany({
    where: { userId },
  });

  if (creditCards.length === 0) return [];

  // Pre-compute cycle dates for all cards
  const cardCycles = creditCards.map((cc) => {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const clampedClosingDay = Math.min(cc.closingDay, daysInMonth);
    const clampedDueDay = Math.min(cc.dueDay, daysInMonth);

    const closingDate = new Date(year, monthNum - 1, clampedClosingDay, 23, 59, 59, 999);

    let dueDate: Date;
    if (cc.dueDay > cc.closingDay) {
      dueDate = new Date(year, monthNum - 1, clampedDueDay, 23, 59, 59, 999);
    } else {
      const nextMonth = monthNum === 12 ? 1 : monthNum + 1;
      const nextYear = monthNum === 12 ? year + 1 : year;
      const daysInNextMonth = new Date(nextYear, nextMonth, 0).getDate();
      const clampedNextDueDay = Math.min(cc.dueDay, daysInNextMonth);
      dueDate = new Date(nextYear, nextMonth - 1, clampedNextDueDay, 23, 59, 59, 999);
    }

    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const startDay = cc.closingDay + 1;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const clampedStartDay = Math.min(startDay, daysInPrevMonth);
    const cycleStart = new Date(prevYear, prevMonth - 1, clampedStartDay);

    return { cc, closingDate, dueDate, cycleStart };
  });

  // Batch: all aggregates + all existing bills in parallel
  const [aggregateResults, existingBills] = await Promise.all([
    Promise.all(
      cardCycles.map(({ cc, cycleStart, closingDate }) =>
        db.transaction.aggregate({
          where: {
            creditCardId: cc.id,
            date: { gte: cycleStart, lte: closingDate },
          },
          _sum: { amount: true },
        }),
      ),
    ),
    db.creditCardBill.findMany({
      where: {
        creditCardId: { in: creditCards.map((cc) => cc.id) },
        month: monthNum,
        year,
      },
    }),
  ]);

  const existingBillMap = new Map(
    existingBills.map((b) => [b.creditCardId, b]),
  );

  // Batch upserts in parallel
  const billResults = await Promise.all(
    cardCycles.map(async ({ cc, closingDate, dueDate }, i) => {
      const totalAmount = Number(aggregateResults[i]._sum.amount ?? 0);
      const existing = existingBillMap.get(cc.id);

      if (!persist) {
        return {
          id: existing?.id ?? `preview-${cc.id}-${year}-${monthNum}`,
          month: monthNum,
          year,
          closingDate,
          dueDate,
          totalAmount,
          status: computeBillStatus(existing?.status ?? "OPEN", closingDate, dueDate, now),
          paidAt: existing?.paidAt ?? null,
        };
      }

      if (!existing) {
        return db.creditCardBill.create({
          data: {
            creditCardId: cc.id,
            userId,
            month: monthNum,
            year,
            closingDate,
            dueDate,
            totalAmount,
            status: "OPEN",
          },
        });
      }

      const newStatus = computeBillStatus(existing.status, closingDate, dueDate, now);
      return db.creditCardBill.update({
        where: { id: existing.id },
        data: { totalAmount, closingDate, dueDate, status: newStatus },
      });
    }),
  );

  return cardCycles.map(({ cc }, i) => {
    const bill = billResults[i];
    return {
      id: bill.id,
      creditCardId: cc.id,
      creditCardName: cc.name,
      creditCardLastFour: cc.lastFourDigits,
      creditCardBrand: cc.brand,
      creditCardBank: cc.bank,
      month: bill.month,
      year: bill.year,
      closingDate: bill.closingDate.toISOString(),
      dueDate: bill.dueDate.toISOString(),
      totalAmount: Number(bill.totalAmount),
      status: bill.status,
      paidAt: bill.paidAt?.toISOString() ?? null,
    };
  });
};
