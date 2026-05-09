import { clerkClient } from "@clerk/nextjs/server";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { getCurrentMonthTransactions } from "../get-current-month-transactions";

export const canUserAddTransaction = async () => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const { effectiveUserId } = result;
  const client = await clerkClient();
  const user = await client.users.getUser(effectiveUserId);
  if (user.publicMetadata.subscriptionPlan === "premium") {
    return true;
  }
  const currentMonthTransactions = await getCurrentMonthTransactions();
  if (currentMonthTransactions >= 15) {
    return false;
  }
  return true;
};
