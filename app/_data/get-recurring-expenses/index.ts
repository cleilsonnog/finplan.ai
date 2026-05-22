import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

function getBrazilNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
}

export const getRecurringExpenses = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const now = getBrazilNow();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await db.recurringExpense.findMany({
    where: { userId },
    include: {
      customCategory: { select: { name: true } },
      transactions: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true },
      },
    },
    orderBy: { dueDay: "asc" },
  });

  return expenses.map((e) => ({
    id: e.id,
    name: e.name,
    amount: Number(e.amount),
    category: e.category,
    customCategoryId: e.customCategoryId,
    customCategory: e.customCategory,
    dueDay: e.dueDay,
    active: e.active,
    paidThisMonth: e.transactions.length > 0,
  }));
};

export const getUpcomingRecurring = async () => {
  const result = await getEffectiveUserId();
  if (!result) return [];
  const userId = result.effectiveUserId;

  const now = getBrazilNow();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const currentDay = now.getDate();
  const daysInMonth = monthEnd.getDate();

  const expenses = await db.recurringExpense.findMany({
    where: { userId, active: true },
    include: {
      customCategory: { select: { name: true } },
      transactions: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true },
      },
    },
    orderBy: { dueDay: "asc" },
  });

  return expenses
    .filter((e) => e.transactions.length === 0)
    .map((e) => {
      const effectiveDueDay = Math.min(e.dueDay, daysInMonth);
      let daysUntil = effectiveDueDay - currentDay;
      if (daysUntil < 0) {
        const daysInNextMonth = new Date(
          now.getFullYear(),
          now.getMonth() + 2,
          0,
        ).getDate();
        const nextDueDay = Math.min(e.dueDay, daysInNextMonth);
        daysUntil = daysInMonth - currentDay + nextDueDay;
      }
      return {
        id: e.id,
        name: e.name,
        amount: Number(e.amount),
        dueDay: e.dueDay,
        category: e.category,
        customCategoryName: e.customCategory?.name ?? null,
        daysUntil,
      };
    })
    .filter((e) => e.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);
};
