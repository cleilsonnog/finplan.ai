import Navbar from "../_components/navbar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../_lib/prisma";
import { TransactionCategory } from "@prisma/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import BudgetForm from "./_components/budget-form";
import BudgetProgress from "./_components/budget-progress";
import { getCategoryKey, getCategoryLabel } from "../_utils/category";

export const dynamic = "force-dynamic";

const BudgetPage = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/login");
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [customCategories] = await Promise.all([
    db.customCategory.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  let budgets = await db.budget.findMany({
    where: { userId, month, year },
    include: { customCategory: { select: { id: true, name: true } } },
  });

  // Se não há orçamento no mês atual, copiar do mês anterior
  if (budgets.length === 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const previousBudgets = await db.budget.findMany({
      where: { userId, month: prevMonth, year: prevYear },
    });
    if (previousBudgets.length > 0) {
      await db.budget.createMany({
        data: previousBudgets.map((b) => ({
          userId,
          category: b.category,
          customCategoryId: b.customCategoryId,
          amount: b.amount,
          month,
          year,
        })),
      });
      budgets = await db.budget.findMany({
        where: { userId, month, year },
        include: { customCategory: { select: { id: true, name: true } } },
      });
    }
  }

  const expenses = await db.transaction.groupBy({
    by: ["category", "customCategoryId"],
    where: {
      userId,
      type: "EXPENSE",
      date: {
        gte: new Date(year, month - 1, 1),
        lt: new Date(year, month, 1),
      },
    },
    _sum: { amount: true },
  });

  const existingBudgets: Record<string, number> = {};
  for (const b of budgets) {
    const key = getCategoryKey(b.category, b.customCategoryId);
    existingBudgets[key] = Number(b.amount);
  }

  const spentByCategory: Record<string, number> = {};
  for (const e of expenses) {
    const key = getCategoryKey(e.category, e.customCategoryId);
    spentByCategory[key] = Number(e._sum.amount ?? 0);
  }

  const categories = budgets
    .filter((b) => Number(b.amount) > 0)
    .map((b) => {
      const key = getCategoryKey(b.category, b.customCategoryId);
      return {
        category: b.category as TransactionCategory,
        customCategoryId: b.customCategoryId,
        label: getCategoryLabel(b.category, b.customCategory),
        budgeted: Number(b.amount),
        spent: spentByCategory[key] ?? 0,
      };
    })
    .sort((a, b) => {
      const aOver = a.spent > a.budgeted ? 1 : 0;
      const bOver = b.spent > b.budgeted ? 1 : 0;
      return bOver - aOver;
    });

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);
  const hasBudgets = budgets.length > 0;
  const monthName = format(now, "MMMM", { locale: ptBR });
  const capitalizedMonth =
    monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <>
      <Navbar />
      <div className="space-y-6 overflow-auto p-4 md:p-6">
        <h1 className="text-2xl font-bold">
          Orçamento Mensal — {capitalizedMonth}
        </h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BudgetForm
            month={month}
            year={year}
            existingBudgets={existingBudgets}
            initialEditing={!hasBudgets}
            customCategories={customCategories}
          />
          <BudgetProgress
            categories={categories}
            totalBudgeted={totalBudgeted}
            totalSpent={totalSpent}
          />
        </div>
      </div>
    </>
  );
};

export default BudgetPage;
