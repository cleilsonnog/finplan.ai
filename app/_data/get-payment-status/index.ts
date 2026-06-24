import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

export interface PaymentStatus {
  totalPaid: number;
  totalPending: number;
}

export const getPaymentStatus = async (
  month: string,
): Promise<PaymentStatus> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const monthNum = Number(month);
  const year = new Date().getFullYear();
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

  // Get active recurring expenses only (no credit card bills — those have their own card)
  const recurringExpenses = await db.recurringExpense.findMany({
    where: { userId, active: true },
    select: { id: true, amount: true },
  });

  // Find which recurring expenses have been paid this month (have a linked transaction)
  const paidRecurringIds = new Set(
    (
      await db.transaction.findMany({
        where: {
          userId,
          recurringExpenseId: { in: recurringExpenses.map((r) => r.id) },
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { recurringExpenseId: true },
      })
    )
      .map((t) => t.recurringExpenseId)
      .filter((id): id is string => !!id),
  );

  let totalPaid = 0;
  let totalPending = 0;

  for (const expense of recurringExpenses) {
    const amount = Number(expense.amount);
    if (paidRecurringIds.has(expense.id)) {
      totalPaid += amount;
    } else {
      totalPending += amount;
    }
  }

  return { totalPaid, totalPending };
};
