"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";

interface UpsertTransactionParams {
  id?: string;
  name: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
  creditCardId?: string;
  customCategoryId?: string;
  installments?: number;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (params.customCategoryId) {
    const customCategory = await db.customCategory.findFirst({
      where: { id: params.customCategoryId, userId },
    });
    if (!customCategory) {
      throw new Error("Custom category not found");
    }
  }

  const installments = params.installments ?? 1;
  const isCreditCard = params.paymentMethod === "CREDIT_CARD";

  if (params.id) {
    // Update: only update the single transaction (no installment re-creation)
    const data = {
      ...params,
      userId,
      creditCardId: isCreditCard ? params.creditCardId : null,
      customCategoryId: params.customCategoryId || null,
      installments: undefined as unknown as number,
      installmentNumber: undefined as unknown as number,
    };
    delete (data as Record<string, unknown>).installments;
    delete (data as Record<string, unknown>).installmentNumber;

    await db.transaction.update({
      where: { id: params.id },
      data,
    });
  } else if (isCreditCard && installments > 1) {
    // Create installment transactions
    const installmentAmount = Math.round((params.amount / installments) * 100) / 100;
    const baseDate = new Date(params.date);

    const transactions = Array.from({ length: installments }, (_, i) => {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + i);
      return {
        name: params.name,
        amount: installmentAmount,
        type: params.type,
        category: params.category,
        paymentMethod: params.paymentMethod,
        date,
        userId,
        creditCardId: params.creditCardId ?? null,
        customCategoryId: params.customCategoryId || null,
        installments,
        installmentNumber: i + 1,
      };
    });

    await db.transaction.createMany({ data: transactions });
  } else {
    // Single transaction
    await db.transaction.create({
      data: {
        name: params.name,
        amount: params.amount,
        type: params.type,
        category: params.category,
        paymentMethod: params.paymentMethod,
        date: params.date,
        userId,
        creditCardId: isCreditCard ? params.creditCardId : null,
        customCategoryId: params.customCategoryId || null,
        installments: 1,
        installmentNumber: 1,
      },
    });
  }
  revalidatePath("/transactions");
  revalidatePath("/");
};
