import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const text = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-10-28.acacia",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      text,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const subscriptionId = session.subscription;
        if (!subscriptionId) {
          console.log("checkout.session.completed: no subscription, skipping");
          return NextResponse.json({ received: true });
        }
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscriptionId as string,
        );
        const clerkUserId = stripeSubscription.metadata.clerk_user_id;
        if (!clerkUserId) {
          console.log(
            "checkout.session.completed: no clerk_user_id in metadata",
          );
          return NextResponse.json(
            { error: "Missing clerk_user_id" },
            { status: 400 },
          );
        }
        const client = await clerkClient();
        await client.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscriptionId as string,
          },
          publicMetadata: {
            subscriptionPlan: "premium",
          },
        });

        break;
      }
      case "customer.subscription.deleted": {
        const subscription = await stripe.subscriptions.retrieve(
          event.data.object.id,
        );
        const clerkUserId = subscription.metadata.clerk_user_id;
        if (!clerkUserId) {
          console.log("subscription.deleted: no clerk_user_id in metadata");
          return NextResponse.json(
            { error: "Missing clerk_user_id" },
            { status: 400 },
          );
        }
        const client = await clerkClient();
        await client.users.updateUser(clerkUserId, {
          privateMetadata: {
            stripeCustomerId: null,
            stripeSubscriptionId: null,
          },
          publicMetadata: {
            subscriptionPlan: null,
          },
        });

        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
};
