"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import type { MonthlyOverviewItem } from "@/app/_data/get-monthly-overview";

interface MonthlyBarChartProps {
  data: MonthlyOverviewItem[];
}

const SERIES = [
  { key: "deposits", name: "Receita", color: "var(--viz-income)" },
  { key: "expensesCash", name: "Despesas à vista", color: "var(--viz-expense)" },
  { key: "expensesCreditCard", name: "Compras no cartão", color: "var(--viz-card)" },
  { key: "investments", name: "Investido", color: "var(--viz-invest)" },
] as const;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

const formatAxis = (value: number) =>
  new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value);

interface ChartRow {
  monthLabel: string;
  deposits: number;
  expensesCash: number;
  expensesCreditCard: number;
  investments: number;
  paidBills: number;
}

const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  // Same cash view as the "Saldo do mês" tile: card purchases count through paid bills
  const balance = row.deposits - row.expensesCash - row.paidBills - row.investments;
  return (
    <div className="min-w-[200px] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 text-sm font-semibold">{label}</p>
      <div className="space-y-1">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(row[s.key])}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 space-y-1 border-t pt-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Faturas pagas</span>
          <span className="font-medium tabular-nums">{formatCurrency(row.paidBills)}</span>
        </div>
        <div className="flex justify-between">
        <span className="text-muted-foreground">Saldo</span>
        <span className="font-semibold tabular-nums">{formatCurrency(balance)}</span>
        </div>
      </div>
    </div>
  );
};

const MonthlyBarChart = ({ data }: MonthlyBarChartProps) => {
  const chartData: ChartRow[] = data.map((item) => {
    // expenses excludes recurring; recurringPaid adds back the bills actually paid
    const allExpenses = item.expenses + item.recurringPaid;
    return {
      monthLabel: item.monthLabel,
      deposits: item.deposits,
      expensesCash: Math.max(allExpenses - item.creditCard, 0),
      expensesCreditCard: item.creditCard,
      investments: item.investments,
      paidBills: item.paidBills,
    };
  });
  const expectedIncome = data[0]?.expectedIncome ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">Visão mensal</CardTitle>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </div>
        {/* Legend — identity never relies on color alone */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
          ))}
          {expectedIncome > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-0 w-3 border-t-2 border-dashed" style={{ borderColor: "var(--viz-income)" }} />
              Receita esperada
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={2} barCategoryGap="22%" margin={{ top: 12, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxis}
              width={44}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted-foreground) / 0.08)" }} />
            {expectedIncome > 0 && (
              <ReferenceLine
                y={expectedIncome}
                stroke="var(--viz-income)"
                strokeDasharray="6 4"
                strokeWidth={1.5}
              />
            )}
            <Bar dataKey="deposits" name="Receita" fill="var(--viz-income)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar
              dataKey="expensesCash"
              name="Despesas à vista"
              stackId="expenses"
              fill="var(--viz-expense)"
              maxBarSize={24}
              stroke="hsl(var(--background))"
              strokeWidth={1}
            />
            <Bar
              dataKey="expensesCreditCard"
              name="Compras no cartão"
              stackId="expenses"
              fill="var(--viz-card)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              stroke="hsl(var(--background))"
              strokeWidth={1}
            />
            <Bar dataKey="investments" name="Investido" fill="var(--viz-invest)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyBarChart;
