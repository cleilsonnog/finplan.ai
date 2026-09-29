"use server";

import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { revalidatePath } from "next/cache";

export const addShoppingItems = async (names: string[]) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const items = names
    .map((n) => n.trim())
    .filter((n) => n.length > 0 && n.length <= 100);

  if (items.length === 0) throw new Error("Nenhum item válido.");

  await db.shoppingListItem.createMany({
    data: items.map((name) => ({ userId, name })),
  });

  revalidatePath("/shopping-list");
};

export const removeShoppingItem = async (id: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");

  await db.shoppingListItem.delete({
    where: { id, userId: result.effectiveUserId },
  });

  revalidatePath("/shopping-list");
};

export const clearShoppingList = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");

  await db.shoppingListItem.deleteMany({
    where: { userId: result.effectiveUserId },
  });

  revalidatePath("/shopping-list");
};
