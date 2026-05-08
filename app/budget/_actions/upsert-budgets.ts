"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { TransactionCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const budgetItemSchema = z.object({
  category: z.nativeEnum(TransactionCategory),
  amount: z.number().nonnegative(),
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
    input.budgets.map((budget) =>
      budget.amount > 0
        ? db.budget.upsert({
            where: {
              userId_category_month_year: {
                userId,
                category: budget.category,
                month: input.month,
                year: input.year,
              },
            },
            update: { amount: budget.amount },
            create: {
              userId,
              category: budget.category,
              month: input.month,
              year: input.year,
              amount: budget.amount,
            },
          })
        : db.budget.deleteMany({
            where: {
              userId,
              category: budget.category,
              month: input.month,
              year: input.year,
            },
          }),
    ),
  );

  revalidatePath("/budget");
};
