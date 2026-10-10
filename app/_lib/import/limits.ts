import { db } from "@/app/_lib/prisma";
import { hasPremiumAccess } from "@/app/_lib/has-premium-access";

// Free plan: one statement import per calendar month, up to 50 lines. These transactions
// don't count toward the 15 manual transactions/month.
export const FREE_IMPORTS_PER_MONTH = 1;
export const FREE_MAX_LINES = 50;
// Safety cap for everyone (a year of statements in one go is almost certainly a mistake)
export const MAX_LINES = 500;

export interface ImportLimits {
  isPremium: boolean;
  importsLeft: number | null; // null = unlimited
  maxLines: number;
}

export const getImportLimits = async (userId: string): Promise<ImportLimits> => {
  if (await hasPremiumAccess()) {
    return { isPremium: true, importsLeft: null, maxLines: MAX_LINES };
  }
  const now = new Date();
  const used = await db.importBatch.count({
    where: { userId, createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
  });
  return {
    isPremium: false,
    importsLeft: Math.max(FREE_IMPORTS_PER_MONTH - used, 0),
    maxLines: FREE_MAX_LINES,
  };
};
