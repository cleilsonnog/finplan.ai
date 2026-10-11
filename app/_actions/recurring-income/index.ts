"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";
import { recurringIncomeSchema } from "./schema";
import { currentPeriod, periodDate, periodRange, toPeriod } from "@/app/_utils/period";

function revalidate() {
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export const upsertRecurringIncome = async (
  id: string | undefined,
  input: { name: string; amount: number; receiveDay: number },
) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const parsed = recurringIncomeSchema.parse(input);

  if (id) {
    const existing = await db.recurringIncome.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Recurring income not found");
    await db.recurringIncome.update({
      where: { id },
      data: {
        name: parsed.name,
        amount: parsed.amount,
        receiveDay: parsed.receiveDay,
      },
    });
  } else {
    await db.recurringIncome.create({
      data: {
        userId,
        name: parsed.name,
        amount: parsed.amount,
        receiveDay: parsed.receiveDay,
      },
    });
  }
  revalidate();
};

export const deleteRecurringIncome = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const existing = await db.recurringIncome.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Recurring income not found");
  await db.recurringIncome.delete({ where: { id } });
  revalidate();
};

export const toggleRecurringIncome = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const existing = await db.recurringIncome.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Recurring income not found");
  await db.recurringIncome.update({
    where: { id },
    data: { active: !existing.active },
  });
  revalidate();
};

export const receiveRecurringIncome = async (id: string, month?: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const income = await db.recurringIncome.findFirst({
    where: { id, userId },
  });
  if (!income) throw new Error("Recurring income not found");

  const period = month ? toPeriod(month) : currentPeriod();
  const { start, end } = periodRange(period);
  const existing = await db.transaction.findFirst({
    where: {
      recurringIncomeId: id,
      userId,
      date: { gte: start, lt: end },
    },
  });
  if (existing) throw new Error("Já recebido neste mês");

  await db.transaction.create({
    data: {
      name: income.name,
      amount: income.amount,
      type: "DEPOSIT",
      category: "SALARY",
      paymentMethod: "BANK_TRANSFER",
      date: periodDate(period, income.receiveDay),
      userId,
      recurringIncomeId: id,
      installments: 1,
      installmentNumber: 1,
    },
  });
  revalidate();
};

/**
 * Marks an income already in the app (PIX received, imported line) as this month's receipt of a
 * recurring income — instead of "Receber", which would create a second transaction.
 */
export const linkIncomeToRecurring = async (
  transactionId: string,
  recurringIncomeId: string,
) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const [transaction, income] = await Promise.all([
    db.transaction.findFirst({
      where: { id: transactionId, userId, type: "DEPOSIT" },
      select: { id: true, date: true, recurringIncomeId: true },
    }),
    db.recurringIncome.findFirst({
      where: { id: recurringIncomeId, userId },
      select: { id: true },
    }),
  ]);
  if (!transaction || !income) throw new Error("Receita não encontrada");
  if (transaction.recurringIncomeId) throw new Error("Entrada já vinculada");

  const { start, end } = periodRange(currentPeriod(transaction.date));
  const existing = await db.transaction.findFirst({
    where: { recurringIncomeId, userId, date: { gte: start, lt: end } },
    select: { id: true },
  });
  if (existing) throw new Error("Essa receita já foi recebida neste mês");

  await db.transaction.update({
    where: { id: transaction.id },
    data: { recurringIncomeId },
  });
  revalidate();
};
