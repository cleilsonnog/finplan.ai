import { db } from "@/app/_lib/prisma";
import { TransactionType } from "@prisma/client";
import { TotalExpensePerCategory, TransactionPercentagePerType } from "./types";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { getCreditCardSummary } from "../get-credit-card-summary";

export const getDashboard = async (month: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const year = new Date().getFullYear();
  const where = {
    userId,
    date: {
      gte: new Date(`${year}-${month}-01`),
      lt: new Date(`${year}-${Number(month) + 1}-01`),
    },
  };
  const depositsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "DEPOSIT" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );
  const investmentsTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "INVESTMENT" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );
  const expensesTotal = Number(
    (
      await db.transaction.aggregate({
        where: { ...where, type: "EXPENSE" },
        _sum: { amount: true },
      })
    )?._sum?.amount,
  );
  const balance = depositsTotal - investmentsTotal - expensesTotal;
  const transactionsTotal = Number(
    (
      await db.transaction.aggregate({
        where,
        _sum: { amount: true },
      })
    )._sum.amount,
  );
  const typesPercentage: TransactionPercentagePerType = {
    [TransactionType.DEPOSIT]: Math.round(
      (Number(depositsTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.EXPENSE]: Math.round(
      (Number(expensesTotal || 0) / Number(transactionsTotal)) * 100,
    ),
    [TransactionType.INVESTMENT]: Math.round(
      (Number(investmentsTotal || 0) / Number(transactionsTotal)) * 100,
    ),
  };
  const groupedExpenses = await db.transaction.groupBy({
    by: ["category", "customCategoryId"],
    where: {
      ...where,
      type: TransactionType.EXPENSE,
    },
    _sum: {
      amount: true,
    },
  });
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
  const lastTransactionsRaw = await db.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    take: 15,
  });
  const lastTransactions = lastTransactionsRaw.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));
  const creditCardSummary = await getCreditCardSummary(month);
  return {
    balance,
    depositsTotal,
    investmentsTotal,
    expensesTotal,
    typesPercentage,
    totalExpensePerCategory,
    lastTransactions,
    creditCardSummary,
  };
};
