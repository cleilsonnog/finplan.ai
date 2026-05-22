"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";
import { recurringExpenseSchema } from "./schema";
import { TransactionCategory, TransactionPaymentMethod } from "@prisma/client";

function parseCategory(categoryValue: string) {
  if (categoryValue.startsWith("custom:")) {
    return {
      category: TransactionCategory.OTHER,
      customCategoryId: categoryValue.replace("custom:", ""),
    };
  }
  return {
    category: categoryValue as TransactionCategory,
    customCategoryId: null,
  };
}

function revalidate() {
  revalidatePath("/recurring");
  revalidatePath("/transactions");
  revalidatePath("/");
}

export const upsertRecurringExpense = async (
  id: string | undefined,
  input: { name: string; amount: number; category: string; dueDay: number },
) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const parsed = recurringExpenseSchema.parse(input);
  const { category, customCategoryId } = parseCategory(parsed.category);

  if (customCategoryId) {
    const customCategory = await db.customCategory.findFirst({
      where: { id: customCategoryId, userId },
    });
    if (!customCategory) throw new Error("Custom category not found");
  }

  if (id) {
    const existing = await db.recurringExpense.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error("Recurring expense not found");
    await db.recurringExpense.update({
      where: { id },
      data: {
        name: parsed.name,
        amount: parsed.amount,
        category,
        customCategoryId,
        dueDay: parsed.dueDay,
      },
    });
  } else {
    await db.recurringExpense.create({
      data: {
        userId,
        name: parsed.name,
        amount: parsed.amount,
        category,
        customCategoryId,
        dueDay: parsed.dueDay,
      },
    });
  }
  revalidate();
};

export const deleteRecurringExpense = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const existing = await db.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Recurring expense not found");
  await db.recurringExpense.delete({ where: { id } });
  revalidate();
};

export const toggleRecurringExpense = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const existing = await db.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Recurring expense not found");
  await db.recurringExpense.update({
    where: { id },
    data: { active: !existing.active },
  });
  revalidate();
};

export const payRecurringExpense = async (
  id: string,
  paymentMethod: TransactionPaymentMethod = TransactionPaymentMethod.PIX,
) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const expense = await db.recurringExpense.findFirst({
    where: { id, userId },
  });
  if (!expense) throw new Error("Recurring expense not found");

  // Check if already paid this month (use Brazil timezone)
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const existing = await db.transaction.findFirst({
    where: {
      recurringExpenseId: id,
      userId,
      date: { gte: monthStart, lte: monthEnd },
    },
  });
  if (existing) throw new Error("Já pago neste mês");

  await db.transaction.create({
    data: {
      name: expense.name,
      amount: expense.amount,
      type: "EXPENSE",
      category: expense.category,
      paymentMethod,
      date: now,
      userId,
      customCategoryId: expense.customCategoryId,
      recurringExpenseId: id,
      installments: 1,
      installmentNumber: 1,
    },
  });
  revalidate();
};
