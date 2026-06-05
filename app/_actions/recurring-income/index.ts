"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";
import { recurringIncomeSchema } from "./schema";

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

export const receiveRecurringIncome = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const income = await db.recurringIncome.findFirst({
    where: { id, userId },
  });
  if (!income) throw new Error("Recurring income not found");

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const existing = await db.transaction.findFirst({
    where: {
      recurringIncomeId: id,
      userId,
      date: { gte: monthStart, lte: monthEnd },
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
      date: now,
      userId,
      recurringIncomeId: id,
      installments: 1,
      installmentNumber: 1,
    },
  });
  revalidate();
};
