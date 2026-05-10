"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";

export const payCreditCardBill = async (billId: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const bill = await db.creditCardBill.findUnique({
    where: { id: billId },
  });

  if (!bill || bill.userId !== userId) {
    throw new Error("Fatura não encontrada");
  }

  if (bill.status === "PAID") {
    throw new Error("Fatura já está paga");
  }

  if (bill.status === "OPEN") {
    throw new Error("Fatura ainda está aberta");
  }

  await db.creditCardBill.update({
    where: { id: billId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  });

  revalidatePath("/credit-cards");
};
