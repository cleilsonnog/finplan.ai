import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

export interface MonthlyOverviewItem {
  month: string;
  monthLabel: string;
  deposits: number;
  expenses: number;
  creditCard: number;
  investments: number;
  recurring: number;
  expectedIncome: number;
}

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export const getMonthlyOverview = async (
  currentMonth: string,
): Promise<MonthlyOverviewItem[]> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const year = new Date().getFullYear();
  const current = Number(currentMonth);

  const months: number[] = [];
  for (let i = 5; i >= 0; i--) {
    let m = current - i;
    if (m <= 0) m += 12;
    months.push(m);
  }

  // Sum of all active recurring expenses (projected monthly cost)
  const [activeRecurringAgg, activeIncomeAgg] = await Promise.all([
    db.recurringExpense.aggregate({
      where: { userId, active: true },
      _sum: { amount: true },
    }),
    db.recurringIncome.aggregate({
      where: { userId, active: true },
      _sum: { amount: true },
    }),
  ]);
  const activeRecurringTotal = Number(activeRecurringAgg._sum?.amount ?? 0);
  const activeIncomeTotal = Number(activeIncomeAgg._sum?.amount ?? 0);

  const overview: MonthlyOverviewItem[] = await Promise.all(
    months.map(async (m) => {
      const monthStr = String(m).padStart(2, "0");
      const start = new Date(`${year}-${monthStr}-01`);
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? year + 1 : year;
      const end = new Date(
        `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`,
      );

      const where = { userId, date: { gte: start, lt: end } };

      const [depositsAgg, expensesAgg, creditCardAgg, investmentsAgg, recurringAgg] =
        await Promise.all([
          db.transaction.aggregate({
            where: { ...where, type: "DEPOSIT" },
            _sum: { amount: true },
          }),
          db.transaction.aggregate({
            where: { ...where, type: "EXPENSE", recurringExpenseId: null },
            _sum: { amount: true },
          }),
          db.transaction.aggregate({
            where: { ...where, type: "EXPENSE", creditCardId: { not: null } },
            _sum: { amount: true },
          }),
          db.transaction.aggregate({
            where: { ...where, type: "INVESTMENT" },
            _sum: { amount: true },
          }),
          db.transaction.aggregate({
            where: { ...where, type: "EXPENSE", recurringExpenseId: { not: null } },
            _sum: { amount: true },
          }),
        ]);

      // Show the greater of: paid recurring or projected active recurring
      const paidRecurring = Number(recurringAgg._sum.amount ?? 0);
      const recurring = Math.max(paidRecurring, activeRecurringTotal);

      return {
        month: monthStr,
        monthLabel: MONTH_LABELS[m - 1],
        deposits: Number(depositsAgg._sum.amount ?? 0),
        expenses: Number(expensesAgg._sum.amount ?? 0),
        creditCard: Number(creditCardAgg._sum.amount ?? 0),
        investments: Number(investmentsAgg._sum.amount ?? 0),
        recurring,
        expectedIncome: activeIncomeTotal,
      };
    }),
  );

  return overview;
};
