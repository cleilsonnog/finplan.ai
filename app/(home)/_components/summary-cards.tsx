import {
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { CustomCategoryOption } from "@/app/_constants/transactions";

interface SummaryCardsProps {
  month: string;
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  creditCards?: SerializedCreditCard[];
  canUserAddTransaction: boolean;
  customCategories?: CustomCategoryOption[];
}

const SummaryCards = async ({
  balance,
  depositsTotal,
  expensesTotal,
  investmentsTotal,
  creditCards = [],
  canUserAddTransaction,
  customCategories = [],
}: SummaryCardsProps) => {
  return (
    <div className="space-y-6">
      {/* PRIMEIRO CARD */}

      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balance}
        size="large"
        creditCards={creditCards}
        canUserAddTransaction={canUserAddTransaction}
        customCategories={customCategories}
      />

      {/* OUTROS CARDS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <SummaryCard
          icon={<PiggyBankIcon size={16} />}
          title="Investido"
          amount={investmentsTotal}
        />
        <SummaryCard
          icon={<TrendingUpIcon size={16} className="text-primary" />}
          title="Receita"
          amount={depositsTotal}
        />
        <SummaryCard
          icon={<TrendingDownIcon size={16} className="text-red-500" />}
          title="Despesas"
          amount={expensesTotal}
        />
      </div>
    </div>
  );
};

export default SummaryCards;
