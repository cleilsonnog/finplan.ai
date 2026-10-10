"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

const schema = z.object({
  cardId: z.string().min(1),
  closingDay: z.number().int().min(1).max(31),
  dueDay: z.number().int().min(1).max(31),
});

/**
 * Updates the card's closing/due day (suggested when an imported bill shows the bank moved
 * them). Closed and imported bills keep their locked dates; only open/future bills follow.
 */
export const updateCardBillingDays = async (input: z.infer<typeof schema>) => {
  const { cardId, closingDay, dueDay } = schema.parse(input);
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const updated = await db.creditCard.updateMany({
    where: { id: cardId, userId: result.effectiveUserId },
    data: { closingDay, dueDay },
  });
  if (updated.count === 0) throw new Error("Cartão não encontrado");
  revalidatePath("/");
  revalidatePath("/credit-cards");
  revalidatePath("/import");
};
