"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import type { MonthlyOverviewItem } from "@/app/_data/get-monthly-overview";

interface MonthlyBarChartProps {
  data: MonthlyOverviewItem[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

interface TooltipEntry {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipEntry[]; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-bold">{label}</p>
      {payload.map((entry: TooltipEntry) => (
        <p key={entry.name} className="text-xs" style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
};

const MonthlyBarChart = ({ data }: MonthlyBarChartProps) => {
  const chartData = data.map((item) => ({
    ...item,
    expensesCash: item.expenses - item.creditCard,
    expensesCreditCard: item.creditCard,
  }));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base font-bold">Visão Mensal</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" vertical={false} />
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
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted-foreground) / 0.05)" }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            <Bar dataKey="deposits" name="Receita" fill="#55B02E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expensesCash" name="Despesas" stackId="expenses" fill="#E93030" />
            <Bar dataKey="expensesCreditCard" name="Cartão" stackId="expenses" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="recurring" name="Recorrentes" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            <Bar dataKey="investments" name="Investido" fill="#FFFFFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyBarChart;
