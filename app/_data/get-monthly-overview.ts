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

  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  const startDate = new Date(year, firstMonth - 1, 1);
  const endDate = new Date(year, lastMonth, 1);

  // Single query: fetch all transactions for the 6-month range
  const [transactions, activeRecurringAgg, activeIncomeAgg] = await Promise.all([
    db.transaction.findMany({
      where: { userId, date: { gte: startDate, lt: endDate } },
      select: {
        type: true,
        amount: true,
        date: true,
        creditCardId: true,
        recurringExpenseId: true,
      },
    }),
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

  // Aggregate in memory
  const monthData = new Map<number, {
    deposits: number;
    expenses: number;
    creditCard: number;
    investments: number;
    recurring: number;
  }>();

  for (const m of months) {
    monthData.set(m, {
      deposits: 0,
      expenses: 0,
      creditCard: 0,
      investments: 0,
      recurring: 0,
    });
  }

  for (const tx of transactions) {
    const m = tx.date.getMonth() + 1;
    const entry = monthData.get(m);
    if (!entry) continue;
    const amount = Number(tx.amount);

    if (tx.type === "DEPOSIT") {
      entry.deposits += amount;
    } else if (tx.type === "INVESTMENT") {
      entry.investments += amount;
    } else if (tx.type === "EXPENSE") {
      if (tx.creditCardId) entry.creditCard += amount;
      if (tx.recurringExpenseId) {
        entry.recurring += amount;
      } else {
        entry.expenses += amount;
      }
    }
  }

  return months.map((m) => {
    const data = monthData.get(m)!;
    const monthStr = String(m).padStart(2, "0");
    const paidRecurring = data.recurring;
    return {
      month: monthStr,
      monthLabel: MONTH_LABELS[m - 1],
      deposits: data.deposits,
      expenses: data.expenses,
      creditCard: data.creditCard,
      investments: data.investments,
      recurring: Math.max(paidRecurring, activeRecurringTotal),
      expectedIncome: activeIncomeTotal,
    };
  });
};
