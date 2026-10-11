"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { SITE_URL } from "@/app/_lib/site";

/**
 * Stripe Customer Portal for monthly subscribers: cancel, change card, see invoices. The
 * customer id is saved in Clerk's privateMetadata by the Stripe webhook at checkout.
 */
export const createStripePortalSession = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not found");
  }
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const customerId = user.privateMetadata?.stripeCustomerId as string | undefined;
  if (!customerId) {
    throw new Error("Assinatura não encontrada. Fale com a gente pelo WhatsApp.");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-10-28.acacia",
  });
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${SITE_URL}/subscription`,
  });
  return { url: session.url };
};
