import { TransactionCategory } from "@prisma/client";

export interface TotalExpensePerCategory {
  category: TransactionCategory;
  totalAmount: number;
  percentageOfTotal: number;
  customCategoryId?: string | null;
  customCategoryName?: string | null;
}
