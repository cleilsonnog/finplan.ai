"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { customCategorySchema } from "./schema";

async function requirePremium() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata.subscriptionPlan !== "premium") {
    throw new Error("Premium plan required");
  }
  return userId;
}

export const listCustomCategories = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return db.customCategory.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
};

export const createCustomCategory = async (input: { name: string }) => {
  const userId = await requirePremium();
  const { name } = customCategorySchema.parse(input);
  const category = await db.customCategory.create({
    data: { userId, name },
  });
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/");
  return category;
};

export const updateCustomCategory = async (
  id: string,
  input: { name: string },
) => {
  const userId = await requirePremium();
  const { name } = customCategorySchema.parse(input);
  const category = await db.customCategory.findFirst({
    where: { id, userId },
  });
  if (!category) throw new Error("Category not found");
  const updated = await db.customCategory.update({
    where: { id },
    data: { name },
  });
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/");
  return updated;
};

export const deleteCustomCategory = async (id: string) => {
  const userId = await requirePremium();
  const category = await db.customCategory.findFirst({
    where: { id, userId },
  });
  if (!category) throw new Error("Category not found");
  await db.customCategory.delete({ where: { id } });
  revalidatePath("/categories");
  revalidatePath("/transactions");
  revalidatePath("/budget");
  revalidatePath("/");
};
