"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { db } from "@/app/_lib/prisma";

/**
 * Deletes the signed-in user's account: stops a monthly Stripe subscription, erases every row
 * keyed by the user's own id and removes the Clerk user. Uses the user's own id, never the
 * effective (shared) one — a partner leaving deletes only their own data and the share link.
 * Keep the table list in sync with scripts/migrate-clerk-to-prod.ts COLUMNS.
 */
export const deleteAccount = async (confirmation: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  if (confirmation.trim().toUpperCase() !== "EXCLUIR") throw new Error("Digite EXCLUIR para confirmar");

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

  // Stop future charges first: if this fails, nothing else is deleted
  const subscriptionId = user.privateMetadata?.stripeSubscriptionId as string | undefined;
  if (subscriptionId && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-10-28.acacia" });
    try {
      await stripe.subscriptions.cancel(subscriptionId);
    } catch (err) {
      // Already canceled/removed on Stripe's side is fine
      if (!(err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing")) throw err;
    }
  }

  const link = await db.whatsAppLink.findUnique({ where: { userId }, select: { phone: true } });

  await db.$transaction([
    ...(link ? [db.whatsAppSession.deleteMany({ where: { phone: link.phone } })] : []),
    db.transaction.deleteMany({ where: { userId } }),
    db.recurringExpense.deleteMany({ where: { userId } }),
    db.recurringIncome.deleteMany({ where: { userId } }),
    db.importBatch.deleteMany({ where: { userId } }),
    db.creditCardBill.deleteMany({ where: { userId } }),
    db.creditCard.deleteMany({ where: { userId } }),
    db.budget.deleteMany({ where: { userId } }),
    db.categoryRule.deleteMany({ where: { userId } }),
    db.customCategory.deleteMany({ where: { userId } }),
    db.userCategoryLabel.deleteMany({ where: { userId } }),
    db.whatsAppLink.deleteMany({ where: { userId } }),
    db.pushSubscription.deleteMany({ where: { userId } }),
    db.shoppingListItem.deleteMany({ where: { userId } }),
    db.accountShare.deleteMany({ where: { OR: [{ ownerId: userId }, { memberId: userId }] } }),
    db.accountShareInvite.deleteMany({
      where: { OR: [{ ownerId: userId }, ...(email ? [{ invitedEmail: email }] : [])] },
    }),
  ]);

  await client.users.deleteUser(userId);
};
