"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const deleteTransaction = async (transactionId: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
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
