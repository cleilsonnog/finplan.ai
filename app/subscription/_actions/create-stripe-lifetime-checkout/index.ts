"use server";

import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

export const createStripeLifetimeCheckout = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe secret key not found");
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-10-28.acacia",
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: process.env.APP_URL,
    cancel_url: process.env.APP_URL,
    metadata: {
      clerk_user_id: userId,
      plan_type: "lifetime",
    },
    line_items: [
      {
        price: process.env.STRIPE_LIFETIME_PRICE_ID,
        quantity: 1,
      },
    ],
  });
  return { sessionId: session.id };
};
