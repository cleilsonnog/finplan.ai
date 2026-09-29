import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { endOfMonth, startOfMonth } from "date-fns";

export const getCurrentMonthTransactions = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const now = new Date();
  return db.transaction.count({
    where: {
      userId,
      date: {
        gte: startOfMonth(now),
        lte: endOfMonth(now),
      },
      installmentNumber: 1,
    },
  });
};
