import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  PiggyBankIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WalletIcon,
} from "lucide-react";
import { ReactNode } from "react";
import AddTransactionButton, {
  SerializedCreditCard,
} from "@/app/_components/add-transaction-button";
import { Card } from "@/app/_components/ui/card";
import { CustomCategoryOption } from "@/app/_constants/transactions";

interface SummaryCardsProps {
  balance: number;
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  creditCardTotal: number;
  /** Previous month totals, for the month-over-month delta */
  previous?: { deposits: number; expenses: number; investments: number };
  creditCards?: SerializedCreditCard[];
  canUserAddTransaction: boolean;
  customCategories?: CustomCategoryOption[];
}

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface DeltaProps {
  current: number;
  previous?: number;
  /** Whether going up is good news (income) or bad news (expenses) */
  upIsGood: boolean;
}

const Delta = ({ current, previous, upIsGood }: DeltaProps) => {
  if (!previous) {
    return <p className="text-xs text-muted-foreground">Sem dados do mês anterior</p>;
  }
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(change));
  if (rounded === 0) {
    return <p className="text-xs text-muted-foreground">Igual ao mês anterior</p>;
  }
  const up = change > 0;
  const good = up === upIsGood;
  const Icon = up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className={`inline-flex items-center gap-0.5 font-semibold ${
          good ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
        }`}
      >
        <Icon size={14} />
        {rounded}%
      </span>
      vs. mês anterior
    </p>
  );
};

interface StatTileProps {
  icon: ReactNode;
  label: string;
  value: number;
  swatch: string;
  children?: ReactNode;
}

const StatTile = ({ icon, label, value, swatch, children }: StatTileProps) => (
  <Card className="flex flex-col justify-between gap-3 p-5">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: swatch }} />
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
      </div>
      <span className="rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</span>
    </div>
    <p className="text-2xl font-semibold tracking-tight">{fmt(value)}</p>
    {children}
  </Card>
);

const SummaryCards = ({
  balance,
  depositsTotal,
  expensesTotal,
  investmentsTotal,
  creditCardTotal,
  previous,
  creditCards = [],
  canUserAddTransaction,
  customCategories = [],
}: SummaryCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Saldo — the one hero number */}
      <Card className="flex flex-col justify-between gap-4 border-primary/30 bg-primary/5 p-5 sm:col-span-2 xl:col-span-1">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Saldo do mês</p>
          <span className="rounded-md bg-primary/15 p-1.5 text-primary">
            <WalletIcon size={16} />
          </span>
        </div>
        <div>
          <p
            className={`text-3xl font-semibold tracking-tight ${
              balance < 0 ? "text-red-600 dark:text-red-400" : ""
            }`}
          >
            {fmt(balance)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Receita − despesas − investimentos
          </p>
        </div>
        <AddTransactionButton
          canUserAddTransaction={canUserAddTransaction}
          creditCards={creditCards}
          customCategories={customCategories}
        />
      </Card>

      <StatTile
        icon={<TrendingUpIcon size={16} />}
        label="Receita"
        value={depositsTotal}
        swatch="var(--viz-income)"
      >
        <Delta current={depositsTotal} previous={previous?.deposits} upIsGood />
      </StatTile>

      <StatTile
        icon={<TrendingDownIcon size={16} />}
        label="Despesas"
        value={expensesTotal}
        swatch="var(--viz-expense)"
      >
        <div className="space-y-1">
          <Delta current={expensesTotal} previous={previous?.expenses} upIsGood={false} />
          {creditCardTotal > 0 && (
            <p className="text-xs text-muted-foreground">
              {fmt(creditCardTotal)} no cartão
            </p>
          )}
        </div>
      </StatTile>

      <StatTile
        icon={<PiggyBankIcon size={16} />}
        label="Investido"
        value={investmentsTotal}
        swatch="var(--viz-invest)"
      >
        <Delta current={investmentsTotal} previous={previous?.investments} upIsGood />
      </StatTile>
    </div>
  );
};

export default SummaryCards;
