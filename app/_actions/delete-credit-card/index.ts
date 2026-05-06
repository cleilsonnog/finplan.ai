"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export const deleteCreditCard = async (id: string) => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await db.creditCard.delete({
    where: { id, userId },
  });
  revalidatePath("/credit-cards");
};
