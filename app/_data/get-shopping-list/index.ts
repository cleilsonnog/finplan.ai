import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";

export const getShoppingList = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");

  return db.shoppingListItem.findMany({
    where: { userId: result.effectiveUserId },
    orderBy: { createdAt: "asc" },
  });
};
