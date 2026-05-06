"use client";

import { Card, CardContent } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { CARD_BRAND_LABELS } from "@/app/_constants/credit-cards";
import { CreditCardSummaryItem } from "@/app/_data/get-credit-card-summary";
import { CardBrand } from "@prisma/client";

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

  return (
    <Card className="min-w-[280px]">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{card.name}</p>
            <p className="text-sm text-muted-foreground">
              ****{card.lastFourDigits} &middot;{" "}
              {CARD_BRAND_LABELS[card.brand as CardBrand]}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fatura atual</span>
            <span className="font-medium">{formatCurrency(invoiceTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Disponível</span>
            <span className="font-medium">
              {formatCurrency(availableLimit)}
            </span>
          </div>
        </div>

        <div className="space-y-1">
          <Progress value={Math.min(usagePercent, 100)} />
          <p className="text-right text-xs text-muted-foreground">
            {usagePercent}% usado
          </p>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Fecha dia {card.closingDay}</span>
          <span>Vence dia {card.dueDay}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardItem;
