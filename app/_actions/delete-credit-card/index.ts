"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";

/** How many purchases go away with the card — shown in the confirmation dialog */
export const getCreditCardDeletionInfo = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const transactions = await db.transaction.count({
    where: { creditCardId: id, userId: result.effectiveUserId },
  });
  return { transactions };
};

/**
 * Deletes the card with its purchases, bills (cascade) and import batches. Purchases can't
 * outlive the card: without a creditCardId they would count as cash spending and lower the
 * month's balance.
 */
export const deleteCreditCard = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const card = await db.creditCard.findFirst({ where: { id, userId }, select: { id: true } });
  if (!card) throw new Error("Cartão não encontrado");

  await db.$transaction([
    db.transaction.deleteMany({ where: { creditCardId: id, userId } }),
    db.importBatch.deleteMany({ where: { creditCardId: id, userId } }),
    db.creditCard.delete({ where: { id } }),
  ]);
  revalidatePath("/credit-cards");
  revalidatePath("/transactions");
  revalidatePath("/import");
  revalidatePath("/");
};
