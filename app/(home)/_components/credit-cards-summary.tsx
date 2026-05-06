"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { CreditCardSummary } from "@/app/_data/get-credit-card-summary";
import { CreditCardIcon } from "lucide-react";

interface CreditCardsSummaryProps {
  creditCardSummary: CreditCardSummary;
}

const CreditCardsSummary = ({ creditCardSummary }: CreditCardsSummaryProps) => {
  const { cards, totalInvoice, totalLimit, totalAvailable, totalUsagePercent } =
    creditCardSummary;

  if (cards.length === 0) {
    return null;
  }

  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 pb-2">
        <CreditCardIcon size={16} />
        <CardTitle className="text-base">Cartões de Crédito</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Total Faturas</p>
            <p className="text-lg font-bold">{formatCurrency(totalInvoice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Limite Total</p>
            <p className="text-lg font-bold">{formatCurrency(totalLimit)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Disponível</p>
            <p className="text-lg font-bold">
              {formatCurrency(totalAvailable)}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Progress value={Math.min(totalUsagePercent, 100)} />
          <p className="text-right text-xs text-muted-foreground">
            {totalUsagePercent}% do limite utilizado
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardsSummary;
