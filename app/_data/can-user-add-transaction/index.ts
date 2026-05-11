import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { hasPremiumAccess } from "@/app/_lib/has-premium-access";
import { getCurrentMonthTransactions } from "../get-current-month-transactions";

export const canUserAddTransaction = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  if (await hasPremiumAccess()) {
    return true;
  }
  const currentMonthTransactions = await getCurrentMonthTransactions();
  if (currentMonthTransactions >= 15) {
    return false;
  }
  return true;
};
