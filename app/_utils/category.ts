import { TransactionCategory } from "@prisma/client";
import { TRANSACTION_CATEGORY_LABELS } from "../_constants/transactions";

interface CustomCategoryInfo {
  id: string;
  name: string;
}

export function getCategoryLabel(
  category: TransactionCategory,
  customCategory?: CustomCategoryInfo | null,
): string {
  if (category === "OTHER" && customCategory) {
    return customCategory.name;
  }
  return TRANSACTION_CATEGORY_LABELS[category];
}

export function getCategoryKey(
  category: TransactionCategory,
  customCategoryId?: string | null,
): string {
  if (category === "OTHER" && customCategoryId) {
    return `custom:${customCategoryId}`;
  }
  return category;
}
