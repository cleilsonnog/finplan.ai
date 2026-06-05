import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

function getBrazilNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
}

export const getRecurringIncomes = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const now = getBrazilNow();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const incomes = await db.recurringIncome.findMany({
    where: { userId },
    include: {
      transactions: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
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
