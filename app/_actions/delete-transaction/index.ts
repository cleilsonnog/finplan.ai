"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async (transactionId: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const transaction = await db.transaction.findFirst({
    where: { id: transactionId, userId },
  });
  if (!transaction) {
    throw new Error("Transaction not found");
  }
  await db.transaction.delete({ where: { id: transactionId } });
  revalidatePath("/transactions");
  revalidatePath("/");
};
