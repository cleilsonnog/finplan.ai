import { auth, clerkClient } from "@clerk/nextjs/server";

export const hasLifetimeAccess = async (): Promise<boolean> => {
  const { userId } = await auth();
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return user.privateMetadata?.lifetimePurchase === true;
};
