"use client";

import { Pie, PieChart } from "recharts";

import { Card, CardContent } from "@/app/_components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { TransactionType } from "@prisma/client";
import { CreditCardIcon, PiggyBankIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import PercentageItem from "./percentage-item";

const chartConfig = {
  [TransactionType.INVESTMENT]: {
    label: "Investido",
    color: "#FFFFFF",
  },
  [TransactionType.DEPOSIT]: {
    label: "Receita",
    color: "#55B02E",
  },
  [TransactionType.EXPENSE]: {
    label: "Despesas",
    color: "#E93030",
  },
  creditCard: {
    label: "Cartão",
    color: "#8B5CF6",
  },
} satisfies ChartConfig;

interface TransactionsPieChartProps {
  depositsTotal: number;
  investmentsTotal: number;
  expensesTotal: number;
  creditCardTotal: number;
  expensesWithoutCC: number;
}

const TransactionsPieChart = ({
  depositsTotal,
  investmentsTotal,
  creditCardTotal,
  expensesWithoutCC,
}: TransactionsPieChartProps) => {
  const total = depositsTotal + expensesWithoutCC + creditCardTotal + investmentsTotal;
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const chartData = [
    {
      type: TransactionType.DEPOSIT,
      amount: depositsTotal,
      fill: "#55B02E",
    },
    {
      type: TransactionType.EXPENSE,
      amount: expensesWithoutCC,
      fill: "#E93030",
    },
    {
      type: "creditCard",
      amount: creditCardTotal,
      fill: "#8B5CF6",
    },
    {
      type: TransactionType.INVESTMENT,
      amount: investmentsTotal,
      fill: "#FFFFFF",
    },
  ];
  return (
    <Card className="flex flex-col p-6">
      <CardContent className="flex flex-1 flex-col justify-center pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[200px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="type"
              innerRadius={60}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>

      <div className="space-y-3 p-6 pt-0">
        <PercentageItem
          icon={<TrendingUpIcon size={16} className="text-primary" />}
          title="Receita"
          value={pct(depositsTotal)}
        />
        <PercentageItem
          icon={<TrendingDownIcon size={16} className="text-red-500" />}
          title="Despesas"
          value={pct(expensesWithoutCC)}
        />
        <PercentageItem
          icon={<CreditCardIcon size={16} className="text-violet-500" />}
          title="Cartão"
          value={pct(creditCardTotal)}
        />
        <PercentageItem
          icon={<PiggyBankIcon size={16} />}
          title="Investido"
          value={pct(investmentsTotal)}
        />
      </div>
    </Card>
  );
};

export default TransactionsPieChart;
