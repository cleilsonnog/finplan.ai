import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory } from "./types";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { periodRange, toPeriod } from "@/app/_utils/period";

export const getDashboard = async (month: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  return getDashboardForUser(result.effectiveUserId, month);
};

// Same data for an explicit user (used by token-authenticated integrations, without a Clerk session)
export const getDashboardForUser = async (userId: string, month: string) => {
  const { start, end } = periodRange(toPeriod(month));
  const where = {
    userId,
    date: { gte: start, lt: end },
  };
  const [depositsAgg, investmentsAgg, expensesAgg, creditCardAgg, groupedExpenses, lastTransactionsRaw, paidBillsAgg] =
    await Promise.all([
      db.transaction.aggregate({
        where: { ...where, type: "DEPOSIT" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...where, type: "INVESTMENT" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { ...where, type: "EXPENSE", creditCardId: { not: null } },
        _sum: { amount: true },
      }),
      db.transaction.groupBy({
        by: ["category", "customCategoryId"],
        where: { ...where, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          amount: true,
          category: true,
          paymentMethod: true,
          date: true,
          creditCardId: true,
          customCategoryId: true,
        },
      }),
      // Card bills leave the account only when marked as paid — counted in the month they are due
      db.creditCardBill.aggregate({
        where: { userId, status: "PAID", dueDate: where.date },
        _sum: { totalAmount: true },
      }),
    ]);
  const depositsTotal = Number(depositsAgg._sum?.amount ?? 0);
  const investmentsTotal = Number(investmentsAgg._sum?.amount ?? 0);
  const expensesTotal = Number(expensesAgg._sum?.amount ?? 0);
  const creditCardTotal = Number(creditCardAgg._sum?.amount ?? 0);
  const expensesWithoutCC = expensesTotal - creditCardTotal;
  const paidBillsTotal = Number(paidBillsAgg._sum?.totalAmount ?? 0);
  // Cash view: card purchases (expensesTotal includes them) only hit the balance through paid bills
  const balance = depositsTotal - investmentsTotal - expensesWithoutCC - paidBillsTotal;
  const customCategoryIds = groupedExpenses
    .map((g) => g.customCategoryId)
    .filter((id): id is string => !!id);
  const customCategoriesMap: Record<string, string> = {};
  if (customCategoryIds.length > 0) {
    const customCats = await db.customCategory.findMany({
      where: { id: { in: customCategoryIds } },
      select: { id: true, name: true },
    });
    for (const cc of customCats) {
      customCategoriesMap[cc.id] = cc.name;
    }
  }
  const totalExpensePerCategory: TotalExpensePerCategory[] = groupedExpenses.map(
    (group) => ({
      category: group.category,
      totalAmount: Number(group._sum.amount),
      percentageOfTotal: Math.round(
        (Number(group._sum.amount) / Number(expensesTotal)) * 100,
      ),
      customCategoryId: group.customCategoryId,
      customCategoryName: group.customCategoryId
        ? customCategoriesMap[group.customCategoryId] ?? null
        : null,
    }),
  );
  const lastTransactions = lastTransactionsRaw.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));
  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    creditCardTotal,
    expensesWithoutCC,
    paidBillsTotal,
    totalExpensePerCategory,
    lastTransactions,
  };
};
