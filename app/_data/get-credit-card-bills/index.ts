import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { BillStatus } from "@prisma/client";

export interface SerializedBill {
  id: string;
  creditCardId: string;
  creditCardName: string;
  creditCardLastFour: string;
  creditCardBrand: string;
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
  const userId = result.effectiveUserId;

  const monthNum = Number(month);
  const year = new Date().getFullYear();
  const now = new Date();

  const creditCards = await db.creditCard.findMany({
    where: { userId },
  });

  if (creditCards.length === 0) return [];

  const bills: SerializedBill[] = [];

  for (const cc of creditCards) {
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const clampedClosingDay = Math.min(cc.closingDay, daysInMonth);
    const clampedDueDay = Math.min(cc.dueDay, daysInMonth);

    const closingDate = new Date(year, monthNum - 1, clampedClosingDay, 23, 59, 59, 999);

    // Due date: if dueDay > closingDay, same month; otherwise next month
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

    // Calculate billing cycle for transaction sum
    const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
    const prevYear = monthNum === 1 ? year - 1 : year;
    const startDay = cc.closingDay + 1;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();
    const clampedStartDay = Math.min(startDay, daysInPrevMonth);
    const cycleStart = new Date(prevYear, prevMonth - 1, clampedStartDay);
    const cycleEnd = closingDate;

    const aggregate = await db.transaction.aggregate({
      where: {
        creditCardId: cc.id,
        date: { gte: cycleStart, lte: cycleEnd },
      },
      _sum: { amount: true },
    });

    const totalAmount = Number(aggregate._sum.amount ?? 0);

    // Upsert the bill record
    let bill = await db.creditCardBill.findUnique({
      where: {
        creditCardId_month_year: {
          creditCardId: cc.id,
          month: monthNum,
          year,
        },
      },
    });

    if (!bill) {
      bill = await db.creditCardBill.create({
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
    } else {
      // Update totalAmount and auto-compute status
      const newStatus = computeBillStatus(bill.status, closingDate, dueDate, now);
      bill = await db.creditCardBill.update({
        where: { id: bill.id },
        data: {
          totalAmount,
          closingDate,
          dueDate,
          status: newStatus,
        },
      });
    }

    bills.push({
      id: bill.id,
      creditCardId: cc.id,
      creditCardName: cc.name,
      creditCardLastFour: cc.lastFourDigits,
      creditCardBrand: cc.brand,
      month: bill.month,
      year: bill.year,
      closingDate: bill.closingDate.toISOString(),
      dueDate: bill.dueDate.toISOString(),
      totalAmount: Number(bill.totalAmount),
      status: bill.status,
      paidAt: bill.paidAt?.toISOString() ?? null,
    });
  }

  return bills;
};
