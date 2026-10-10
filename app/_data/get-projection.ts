import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { billIndexDueIn, billIndexOf } from "@/app/_utils/credit-card-bill";
import { formatPeriod, shiftPeriod, toPeriod } from "@/app/_utils/period";

// "Will next months close in the red?" — a cash projection per month:
//   expected income − fixed bills − card bills already committed − estimated variable spending.
// Card bills only hold what is already recorded (installments, purchases made); new day-to-day
// spending is covered by the variable estimate (average of the last 3 full months).

export const PROJECTION_MONTHS = 6;
/** Common guideline: card bills above this share of income signal trouble */
export const CARD_COMMITMENT_LIMIT = 0.3;

const MONTH_LABELS = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export interface ProjectionMonth {
  period: string; // YYYY-MM
  label: string; // "Nov/26"
  income: number;
  fixed: number;
  cardBills: number;
  variable: number;
  balance: number;
  /** cardBills / income (null without expected income) */
  cardShare: number | null;
}

export interface Projection {
  months: ProjectionMonth[];
  hasIncome: boolean;
  /** Months averaged for the variable estimate (fewer when the account is new) */
  variableBasisMonths: number;
  cards: { id: string; name: string; closingDay: number; dueDay: number }[];
}

export const getProjection = async (month: string): Promise<Projection> => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const base = toPeriod(month);
  const periods = Array.from({ length: PROJECTION_MONTHS }, (_, i) => shiftPeriod(base, i + 1));
  const historyStart = shiftPeriod(base, -3);

  const [incomeAgg, fixedAgg, cards, history] = await Promise.all([
    db.recurringIncome.aggregate({ where: { userId, active: true }, _sum: { amount: true } }),
    db.recurringExpense.aggregate({ where: { userId, active: true }, _sum: { amount: true } }),
    db.creditCard.findMany({
      where: { userId },
      select: { id: true, name: true, closingDay: true, dueDay: true },
    }),
    // Variable spending: cash expenses and one-off card purchases, excluding fixed bills
    db.transaction.findMany({
      where: {
        userId,
        type: "EXPENSE",
        recurringExpenseId: null,
        installments: 1,
        date: {
          gte: new Date(historyStart.year, historyStart.month - 1, 1),
          lt: new Date(base.year, base.month - 1, 1),
        },
      },
      select: { amount: true, date: true, creditCardId: true },
    }),
  ]);

  const income = Number(incomeAgg._sum.amount ?? 0);
  const fixed = Number(fixedAgg._sum.amount ?? 0);

  // Average only over months that actually have data (a new account shouldn't average zeros).
  // Split cash vs card one-offs: card spending already recorded on a bill must not be
  // counted again by the estimate.
  const months_ = new Set<string>();
  let cashTotal = 0;
  let cardTotal = 0;
  for (const t of history) {
    months_.add(`${t.date.getFullYear()}-${t.date.getMonth()}`);
    if (t.creditCardId) cardTotal += Number(t.amount);
    else cashTotal += Number(t.amount);
  }
  const basisMonths = months_.size;
  const avgCash = basisMonths > 0 ? cashTotal / basisMonths : 0;
  const avgCardOneOff = basisMonths > 0 ? cardTotal / basisMonths : 0;

  // Card bills by due month: what is already recorded on each bill
  const billTotals = new Map<string, number>(); // period → total
  const billOneOffs = new Map<string, number>(); // period → one-off purchases already on it
  if (cards.length > 0) {
    const firstDue = periods[0];
    const earliestBill = Math.min(
      ...cards.map((c) => billIndexDueIn(firstDue.year, firstDue.month, c.closingDay, c.dueDay)),
    );
    const from = new Date(Math.floor((earliestBill - 1) / 12), (earliestBill - 1) % 12, 1);
    const cardTx = await db.transaction.findMany({
      where: {
        userId,
        creditCardId: { in: cards.map((c) => c.id) },
        recurringExpenseId: null, // fixed bills paid by card are already in "fixed"
        date: { gte: from },
      },
      select: { amount: true, date: true, creditCardId: true, installments: true },
    });
    for (const period of periods) {
      let total = 0;
      let oneOffs = 0;
      for (const card of cards) {
        const bill = billIndexDueIn(period.year, period.month, card.closingDay, card.dueDay);
        for (const t of cardTx) {
          if (t.creditCardId === card.id && billIndexOf(t.date, card.closingDay) === bill) {
            total += Number(t.amount);
            if (t.installments === 1) oneOffs += Number(t.amount);
          }
        }
      }
      billTotals.set(formatPeriod(period), total);
      billOneOffs.set(formatPeriod(period), oneOffs);
    }
  }

  const months: ProjectionMonth[] = periods.map((p) => {
    const key = formatPeriod(p);
    const cardBills = Math.round((billTotals.get(key) ?? 0) * 100) / 100;
    // Day-to-day card spending still to come on this bill = usual amount − what's already on it
    const variable = avgCash + Math.max(avgCardOneOff - (billOneOffs.get(key) ?? 0), 0);
    return {
      period: key,
      label: `${MONTH_LABELS[p.month - 1]}/${String(p.year).slice(2)}`,
      income,
      fixed,
      cardBills,
      variable: Math.round(variable * 100) / 100,
      balance: Math.round((income - fixed - cardBills - variable) * 100) / 100,
      cardShare: income > 0 ? cardBills / income : null,
    };
  });

  return { months, hasIncome: income > 0, variableBasisMonths: basisMonths, cards };
};
