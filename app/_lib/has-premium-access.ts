import { clerkClient } from "@clerk/nextjs/server";
import { getEffectiveUserId } from "./get-effective-user-id";

export const hasPremiumAccess = async (): Promise<boolean> => {
  const result = await getEffectiveUserId();
  if (!result) return false;

  const client = await clerkClient();
  const ownerUser = await client.users.getUser(result.effectiveUserId);
  if (ownerUser.publicMetadata.subscriptionPlan === "premium") {
    return true;
  }

  if (result.isSharedMember) {
    const memberUser = await client.users.getUser(result.realUserId);
    return memberUser.publicMetadata.subscriptionPlan === "premium";
  }

  return false;
};
