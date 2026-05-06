"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
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
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
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
