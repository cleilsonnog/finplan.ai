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
  recurringPaid: number;
  /** Card bills marked as paid, by due month — what the card actually took from the account */
  paidBills: number;
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

  // Month index may go negative (Jan–May looks back into last year) — Date handles the rollover
  const startDate = new Date(year, current - 6, 1);
  const endDate = new Date(year, current, 1);

  // Single query: fetch all transactions for the 6-month range
  const [transactions, activeRecurringAgg, activeIncomeAgg, paidBills] = await Promise.all([
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
    db.creditCardBill.findMany({
      where: { userId, status: "PAID", dueDate: { gte: startDate, lt: endDate } },
      select: { dueDate: true, totalAmount: true },
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

  const paidBillsByMonth = new Map<number, number>();
  for (const bill of paidBills) {
    const m = bill.dueDate.getMonth() + 1;
    paidBillsByMonth.set(m, (paidBillsByMonth.get(m) ?? 0) + Number(bill.totalAmount));
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
      recurringPaid: paidRecurring,
      paidBills: paidBillsByMonth.get(m) ?? 0,
      expectedIncome: activeIncomeTotal,
    };
  });
};
