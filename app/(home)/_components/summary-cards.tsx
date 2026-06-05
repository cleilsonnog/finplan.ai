import {
  CreditCardIcon,
  PiggyBankIcon,
  ShieldAlertIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import SummaryCard from "./summary-card";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { CustomCategoryOption } from "@/app/_constants/transactions";
import type { CreditCardCommitment } from "@/app/_data/get-credit-card-commitment";

interface SummaryCardsProps {
  month: string;
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  creditCardTotal: number;
  expensesWithoutCC: number;
  creditCards?: SerializedCreditCard[];
  canUserAddTransaction: boolean;
  customCategories?: CustomCategoryOption[];
  creditCardCommitment: CreditCardCommitment;
}

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

const SummaryCards = async ({
  balance,
  depositsTotal,
  expensesTotal,
  investmentsTotal,
  creditCardTotal,
  expensesWithoutCC,
  creditCards = [],
  canUserAddTransaction,
  customCategories = [],
  creditCardCommitment,
}: SummaryCardsProps) => {
  return (
    <div className="space-y-6">
      {/* PRIMEIRO CARD */}

      <SummaryCard
        icon={<WalletIcon size={16} />}
        title="Saldo"
        amount={balance}
        size="large"
        subtitle={`${fmt(depositsTotal)} receita − ${fmt(expensesWithoutCC)} despesas − ${fmt(creditCardTotal)} cartão − ${fmt(investmentsTotal)} investido`}
        creditCards={creditCards}
        canUserAddTransaction={canUserAddTransaction}
        customCategories={customCategories}
      />

      {/* OUTROS CARDS */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
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
          subtitle="Inclui cartão, à vista, parcelado e outros"
        />
        <SummaryCard
          icon={<CreditCardIcon size={16} className="text-violet-500" />}
          title="Cartão no mês"
          amount={creditCardCommitment.currentMonthBill}
          subtitle="Próxima fatura, total comprometido e avista"
        />
      </div>

      {/* COMPROMETIMENTO NO CARTÃO */}
      <SummaryCard
        icon={<ShieldAlertIcon size={16} className="text-amber-500" />}
        title="Comprometido no cartão"
        amount={creditCardCommitment.futureTotal}
        futureByCard={creditCardCommitment.futureByCard}
      />
    </div>
  );
};

export default SummaryCards;
