"use client";

import { Button } from "@/app/_components/ui/button";
import { createStripeCheckout } from "../_actions/create-stripe-checkout";
import { createStripePortalSession } from "../_actions/create-stripe-portal-session";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AcquirePlanButtonProps {
  hasPremiumPlan: boolean;
  isLifetime: boolean;
  /** Monthly Stripe subscriber — can use the Customer Portal */
  hasStripeSubscription: boolean;
}

const AcquirePlanButton = ({
  hasPremiumPlan,
  isLifetime,
  hasStripeSubscription,
}: AcquirePlanButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleAcquirePlanClick = async () => {
    const { sessionId } = await createStripeCheckout();
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

  const handleManageClick = async () => {
    try {
      setLoading(true);
      const { url } = await createStripePortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao abrir o portal",
      );
      setLoading(false);
    }
  };

  if (isLifetime) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Acesso vitalício: sem mensalidade, nada para gerenciar.
      </p>
    );
  }
  if (hasPremiumPlan) {
    if (!hasStripeSubscription) {
      return (
        <p className="text-center text-sm text-muted-foreground">
          Para alterar seu plano, fale com a gente pelo WhatsApp.
        </p>
      );
    }
    return (
      <div className="space-y-2">
        <Button
          className="w-full rounded-full font-bold"
          variant="outline"
          onClick={handleManageClick}
          disabled={loading}
        >
          {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
          Gerenciar assinatura
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Cancelar, trocar o cartão ou ver suas faturas
        </p>
      </div>
    );
  }
  return (
    <Button
      className="w-full rounded-full font-bold"
      onClick={handleAcquirePlanClick}
    >
      Adquirir plano
    </Button>
  );
};

export default AcquirePlanButton;
