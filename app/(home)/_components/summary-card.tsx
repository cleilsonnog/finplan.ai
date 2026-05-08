import AddTransactionButton from "@/app/_components/add-transaction-button";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { CustomCategoryOption } from "@/app/_constants/transactions";
import { ReactNode } from "react";

interface SummaryCardProps {
  icon: ReactNode;
  title: string;
  amount: number;
  size?: "small" | "large";
  creditCards?: SerializedCreditCard[];
  canUserAddTransaction?: boolean;
  customCategories?: CustomCategoryOption[];
}

const SummaryCard = ({
  icon,
  title,
  amount,
  size = "small",
  creditCards = [],
  canUserAddTransaction = true,
  customCategories = [],
}: SummaryCardProps) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-4">
        {icon}
        <p
          className={`${size === "small" ? "text-muted-foreground" : "text-white opacity-70"}`}
        >
          {title}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p
          className={`font-bold ${size === "small" ? "text-2xl" : "text-2xl sm:text-4xl"}`}
        >
          {Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </p>

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
