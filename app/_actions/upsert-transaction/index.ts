"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { upsertTransactionSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { installmentDates } from "@/app/_utils/credit-card-bill";

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
  notes?: string | null;
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
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
      notes: params.notes || null,
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
    const card = params.creditCardId
      ? await db.creditCard.findFirst({
          where: { id: params.creditCardId, userId },
          select: { closingDay: true },
        })
      : null;
    // Real dates: one installment per consecutive bill, starting with the purchase's own bill
    const dates = installmentDates(new Date(params.date), installments, card?.closingDay ?? 31);

    const transactions = dates.map((date, i) => {
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
        notes: params.notes || null,
      };
    });

    await db.transaction.createMany({ data: transactions });
  } else {
    // Single transaction — stored on the real purchase date, also for credit card
    const transactionDate = new Date(params.date);

    await db.transaction.create({
      data: {
        name: params.name,
        amount: params.amount,
        type: params.type,
        category: params.category,
        paymentMethod: params.paymentMethod,
        date: transactionDate,
        userId,
        creditCardId: isCreditCard ? params.creditCardId : null,
        customCategoryId: params.customCategoryId || null,
        installments: 1,
        installmentNumber: 1,
        notes: params.notes || null,
      },
    });
  }
  revalidatePath("/transactions");
  revalidatePath("/");
};
