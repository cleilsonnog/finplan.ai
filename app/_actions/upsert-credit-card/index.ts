"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { CardBrand } from "@prisma/client";
import { upsertCreditCardSchema } from "./schema";
import { revalidatePath } from "next/cache";

interface UpsertCreditCardParams {
  id?: string;
  name: string;
  lastFourDigits: string;
  brand: CardBrand;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export const upsertCreditCard = async (params: UpsertCreditCardParams) => {
  upsertCreditCardSchema.parse(params);
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const { id, ...data } = params;
  if (id) {
    await db.creditCard.update({
      where: { id },
      data: { ...data, userId },
    });
  } else {
    await db.creditCard.create({
      data: { ...data, userId },
    });
  }
  revalidatePath("/credit-cards");
};
