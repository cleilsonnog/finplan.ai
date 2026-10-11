import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { periodRange, toPeriod } from "@/app/_utils/period";

export const getRecurringIncomes = async (month: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const { start, end } = periodRange(toPeriod(month));

  const incomes = await db.recurringIncome.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: { gte: start, lt: end },
        },
        select: { id: true },
      },
    },
    orderBy: { receiveDay: "asc" },
  });

  return incomes.map((i) => ({
    id: i.id,
    name: i.name,
    amount: Number(i.amount),
    receiveDay: i.receiveDay,
    active: i.active,
    receivedThisMonth: i.transactions.length > 0,
  }));
};

/** Income of the month not tied to a recurring income: PIX received, imports, one-off entries */
export const getOtherIncomes = async (month: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const { start, end } = periodRange(toPeriod(month));

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "DEPOSIT",
      recurringIncomeId: null,
      date: { gte: start, lt: end },
    },
    select: {
      id: true,
      name: true,
      amount: true,
      date: true,
      paymentMethod: true,
      source: true,
    },
    orderBy: [{ date: "desc" }, { amount: "desc" }],
    take: 200,
  });

  return transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
  }));
};
