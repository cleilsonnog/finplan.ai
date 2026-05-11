"use client";

import { Button } from "@/app/_components/ui/button";
import { createStripeLifetimeCheckout } from "../_actions/create-stripe-lifetime-checkout";
import { loadStripe } from "@stripe/stripe-js";

const AcquireLifetimeButton = () => {
  const handleClick = async () => {
    const { sessionId } = await createStripeLifetimeCheckout();
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      throw new Error("Stripe publishable key not found");
    }
    const stripe = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    );
    if (!stripe) {
      throw new Error("Stripe not found");
    }
    await stripe.redirectToCheckout({ sessionId });
  };

  return (
    <Button
      className="w-full rounded-full bg-green-600 font-bold hover:bg-green-700"
      onClick={handleClick}
    >
      Garantir acesso vitalício
    </Button>
  );
};

export default AcquireLifetimeButton;
