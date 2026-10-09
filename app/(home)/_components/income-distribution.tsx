import { AlertTriangleIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

interface IncomeDistributionProps {
  depositsTotal: number;
  expensesWithoutCC: number;
  creditCardTotal: number;
  investmentsTotal: number;
}

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const IncomeDistribution = ({
  depositsTotal,
  expensesWithoutCC,
  creditCardTotal,
  investmentsTotal,
}: IncomeDistributionProps) => {
  const outflow = expensesWithoutCC + creditCardTotal + investmentsTotal;
  const leftover = depositsTotal - outflow;
  // When spending exceeds income, the bar shows the split of outflows instead
  const base = Math.max(depositsTotal, outflow);

  const segments = [
    { key: "cash", label: "Despesas à vista", value: expensesWithoutCC, color: "var(--viz-expense)" },
    { key: "card", label: "Cartão", value: creditCardTotal, color: "var(--viz-card)" },
    { key: "invest", label: "Investido", value: investmentsTotal, color: "var(--viz-invest)" },
    { key: "left", label: "Sobrou", value: Math.max(leftover, 0), color: "var(--viz-income)" },
  ];
  const pct = (v: number) => (base > 0 ? (v / base) * 100 : 0);
  const savingsRate = depositsTotal > 0 ? Math.round((Math.max(leftover, 0) + investmentsTotal) / depositsTotal * 100) : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Destino da receita</CardTitle>
        <p className="text-xs text-muted-foreground">Para onde foi o dinheiro que entrou</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        {base === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma movimentação neste mês.</p>
        ) : (
          <>
            {/* 100% bar — 2px gaps separate the segments */}
            <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-[var(--viz-track)]">
              {segments
                .filter((s) => s.value > 0)
                .map((s) => (
                  <div
                    key={s.key}
                    className="h-full first:rounded-l-full last:rounded-r-full"
                    style={{ width: `${pct(s.value)}%`, backgroundColor: s.color }}
                    title={`${s.label}: ${fmt(s.value)}`}
                  />
                ))}
            </div>

            <div className="space-y-3">
              {segments.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium tabular-nums">{fmt(s.value)}</span>
                    <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                      {Math.round(pct(s.value))}%
                    </span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto border-t pt-4">
              {leftover < 0 ? (
                <p className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertTriangleIcon size={14} className="mt-0.5 shrink-0" />
                  Saídas superam a receita em {fmt(Math.abs(leftover))}
                </p>
              ) : (
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-muted-foreground">Taxa de poupança</span>
                  <span className="text-lg font-semibold">{savingsRate}%</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default IncomeDistribution;
