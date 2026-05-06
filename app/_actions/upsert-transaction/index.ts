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
}

export const upsertTransaction = async (params: UpsertTransactionParams) => {
  upsertTransactionSchema.parse(params);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const data = {
    ...params,
    userId,
    creditCardId:
      params.paymentMethod === "CREDIT_CARD" ? params.creditCardId : null,
  };
  if (params.id) {
    await db.transaction.update({
      where: { id: params.id },
      data,
    });
  } else {
    await db.transaction.create({
      data,
    });
  }
  revalidatePath("/transactions");
  revalidatePath("/");
};
