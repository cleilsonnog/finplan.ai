"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { TransactionCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const budgetItemSchema = z.object({
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().nonnegative(),
  customCategoryId: z.string().optional(),
});

const upsertBudgetsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number(),
  budgets: z.array(budgetItemSchema),
});

type UpsertBudgetsInput = z.infer<typeof upsertBudgetsSchema>;

export const upsertBudgets = async (input: UpsertBudgetsInput) => {
  upsertBudgetsSchema.parse(input);
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  await Promise.all(
    input.budgets.map(async (budget) => {
      const customCategoryId = budget.customCategoryId || null;
      const where = {
        userId,
        category: budget.category,
        customCategoryId,
        month: input.month,
        year: input.year,
      };
      if (budget.amount > 0) {
        const existing = await db.budget.findFirst({ where });
        if (existing) {
          return db.budget.update({
            where: { id: existing.id },
            data: { amount: budget.amount },
          });
        }
        return db.budget.create({
          data: {
            userId,
            category: budget.category,
            customCategoryId,
            month: input.month,
            year: input.year,
            amount: budget.amount,
          },
        });
      }
      return db.budget.deleteMany({ where });
    }),
  );

  revalidatePath("/budget");
};
