import AddTransactionButton from "@/app/_components/add-transaction-button";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { CustomCategoryOption } from "@/app/_constants/transactions";
import type { CardCommitment } from "@/app/_data/get-credit-card-commitment";
import { ReactNode } from "react";

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  subtitle?: string;
  futureByCard?: CardCommitment[];
  creditCards?: SerializedCreditCard[];
  canUserAddTransaction?: boolean;
  customCategories?: CustomCategoryOption[];
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  subtitle,
  futureByCard,
  creditCards = [],
  canUserAddTransaction = true,
  customCategories = [],
}: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p
          className={`${size === "small" ? "text-muted-foreground" : "text-foreground opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <div className="w-full">
          <p
            className={`font-bold ${size === "small" ? "text-lg sm:text-2xl" : "text-2xl sm:text-4xl"}`}
          >
            {formatCurrency(amount)}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {futureByCard && futureByCard.length > 0 && (
            <div className="mt-3 space-y-3">
              {futureByCard.map((card) => (
                <div key={card.cardId}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: card.color }}
                    />
                    <span className="text-xs font-medium text-muted-foreground">
                      {card.cardName} •••• {card.lastFourDigits}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {card.months.map((m) => {
                      const isHigh = m.amount > 1200;
                      return (
                        <div
                          key={`${m.year}-${m.month}`}
                          className={`rounded-md border px-3 py-1.5 text-center text-xs ${
                            isHigh
                              ? "border-red-500/30 bg-red-500/10"
                              : "border-amber-500/30 bg-amber-500/10"
                          }`}
                        >
                          <p
                            className={`font-semibold ${isHigh ? "text-red-400" : "text-amber-400"}`}
                          >
                            {formatCurrency(m.amount)}
                          </p>
                          <p
                            className={`capitalize ${isHigh ? "text-red-500/70" : "text-amber-500/70"}`}
                          >
                            {m.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {size === "large" && (
          <AddTransactionButton
            canUserAddTransaction={canUserAddTransaction}
            creditCards={creditCards}
            customCategories={customCategories}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SummaryCard;
