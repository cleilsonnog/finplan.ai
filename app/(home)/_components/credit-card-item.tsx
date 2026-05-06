"use client";

import { Progress } from "@/app/_components/ui/progress";
import { CARD_BRAND_LABELS } from "@/app/_constants/credit-cards";
import { CreditCardSummaryItem } from "@/app/_data/get-credit-card-summary";
import { CardBrand } from "@prisma/client";

const BRAND_GRADIENTS: Record<string, string> = {
  VISA: "from-blue-900/80 to-blue-700/40",
  MASTERCARD: "from-red-900/80 to-orange-800/40",
  ELO: "from-yellow-900/80 to-yellow-700/40",
  AMEX: "from-cyan-900/80 to-cyan-700/40",
  HIPERCARD: "from-red-800/80 to-red-600/40",
  OTHER: "from-zinc-800/80 to-zinc-600/40",
};

interface CreditCardItemProps {
  data: CreditCardSummaryItem;
}

const CreditCardItem = ({ data }: CreditCardItemProps) => {
  const { card, invoiceTotal, availableLimit, usagePercent } = data;
  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const gradient = BRAND_GRADIENTS[card.brand] ?? BRAND_GRADIENTS.OTHER;

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${gradient} border border-white/10 p-4 space-y-3`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{card.name}</p>
          <p className="text-sm text-white/60">
            ****{card.lastFourDigits} &middot;{" "}
            {CARD_BRAND_LABELS[card.brand as CardBrand]}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Fatura atual</span>
          <span className="font-medium text-white">
            {formatCurrency(invoiceTotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Disponível</span>
          <span className="font-medium text-white">
            {formatCurrency(availableLimit)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={Math.min(usagePercent, 100)} />
        <p className="text-right text-xs text-white/50">{usagePercent}% usado</p>
      </div>

      <div className="flex justify-between text-xs text-white/50">
        <span>Fecha dia {card.closingDay}</span>
        <span>Vence dia {card.dueDay}</span>
      </div>
    </div>
  );
};

export default CreditCardItem;
