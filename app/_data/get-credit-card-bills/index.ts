import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { BillStatus } from "@prisma/client";
import { toPeriod } from "@/app/_utils/period";
import { toBillIndex } from "@/app/_utils/credit-card-bill";
import { loadBillCalendars } from "@/app/_lib/bill-calendar";

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

  const { year, month: monthNum } = toPeriod(month);
  const now = new Date();

  const creditCards = await db.creditCard.findMany({
    where: { userId },
  });

  if (creditCards.length === 0) return [];

  // Window of this month's bill per card: locked dates when known, else the closing day
  const calendars = await loadBillCalendars(creditCards);
  const index = toBillIndex(year, monthNum);
  const cardCycles = creditCards.map((cc) => {
    const calendar = calendars.get(cc.id)!;
    return {
      cc,
      closingDate: calendar.closingDate(index),
      dueDate: calendar.dueDate(index),
      cycleStart: calendar.windowStart(index),
    };
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
            status: computeBillStatus("OPEN", closingDate, dueDate, now),
            datesLocked: now > closingDate,
          },
        });
      }

      const newStatus = computeBillStatus(existing.status, closingDate, dueDate, now);
      return db.creditCardBill.update({
        where: { id: existing.id },
        data: {
          totalAmount,
          status: newStatus,
          // Locked bills keep their dates; an open bill is locked the first time it's seen closed,
          // so a later change of the card's closing day doesn't move past purchases around
          ...(existing.datesLocked ? {} : { closingDate, dueDate, datesLocked: now > closingDate }),
        },
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
