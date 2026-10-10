"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangleIcon, CalculatorIcon, CheckCircle2Icon, XIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import type { Projection, ProjectionMonth } from "@/app/_data/get-projection";
import { billIndexOf, dueDateOf } from "@/app/_utils/credit-card-bill";
import { formatPeriod } from "@/app/_utils/period";

const CARD_LIMIT = 0.3;

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtShort = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

interface Simulation {
  amount: number;
  installments: number;
  cardId: string;
}

/** Due periods of each installment of a purchase made today on the given card */
const simulatedCharges = (sim: Simulation, card: Projection["cards"][number]) => {
  const firstBill = billIndexOf(new Date(), card.closingDay);
  const each = sim.amount / sim.installments;
  const charges = new Map<string, number>();
  for (let i = 0; i < sim.installments; i++) {
    const due = dueDateOf(firstBill + i, card.closingDay, card.dueDay);
    const key = formatPeriod({ year: due.getFullYear(), month: due.getMonth() + 1 });
    charges.set(key, (charges.get(key) ?? 0) + each);
  }
  return charges;
};

const ChartTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: ProjectionMonth }[] }) => {
  if (!active || !payload?.length) return null;
  const m = payload[0].payload;
  const rows: [string, number][] = [
    ["Receita esperada", m.income],
    ["Contas fixas", -m.fixed],
    ["Faturas do cartão", -m.cardBills],
    ["Gastos variáveis (estim.)", -m.variable],
  ];
  return (
    <div className="min-w-[220px] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 text-sm font-semibold">{m.label}</p>
      <div className="space-y-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-muted-foreground">{label}</span>
            <span className="tabular-nums">{fmt(value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between border-t pt-2 text-xs">
        <span className="text-muted-foreground">Sobra prevista</span>
        <span className="font-semibold tabular-nums">{fmt(m.balance)}</span>
      </div>
    </div>
  );
};

const ProjectionCard = ({ projection }: { projection: Projection }) => {
  const [simOpen, setSimOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState("10");
  const [cardId, setCardId] = useState(projection.cards[0]?.id ?? "");

  const simulation: Simulation | null = useMemo(() => {
    const value = Number(amount.replace(/\./g, "").replace(",", "."));
    return simOpen && value > 0 && cardId ? { amount: value, installments: Number(installments), cardId } : null;
  }, [simOpen, amount, installments, cardId]);

  const months = useMemo(() => {
    if (!simulation) return projection.months;
    const card = projection.cards.find((c) => c.id === simulation.cardId);
    if (!card) return projection.months;
    const charges = simulatedCharges(simulation, card);
    return projection.months.map((m) => {
      const extra = charges.get(m.period) ?? 0;
      if (!extra) return m;
      const cardBills = m.cardBills + extra;
      return {
        ...m,
        cardBills,
        balance: m.balance - extra,
        cardShare: m.income > 0 ? cardBills / m.income : null,
      };
    });
  }, [projection, simulation]);

  const negative = months.filter((m) => m.balance < 0);
  const overLimit = months.filter((m) => m.cardShare !== null && m.cardShare > CARD_LIMIT);
  const worst = months.reduce((w, m) => (m.balance < w.balance ? m : w), months[0]);

  if (!projection.hasIncome) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Próximos meses</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Cadastre suas receitas fixas (salário, renda) em{" "}
          <Link href="/recurring" className="font-medium text-primary hover:underline">Recorrentes</Link> para ver
          quanto vai sobrar em cada um dos próximos meses.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Próximos meses</CardTitle>
          <p className="text-xs text-muted-foreground">
            Sobra prevista = receita − contas fixas − faturas − gastos do dia a dia (média de{" "}
            {projection.variableBasisMonths || 0} {projection.variableBasisMonths === 1 ? "mês" : "meses"})
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setSimOpen((v) => !v)}>
          {simOpen ? <XIcon size={14} className="mr-1" /> : <CalculatorIcon size={14} className="mr-1" />}
          {simOpen ? "Fechar simulação" : "Posso parcelar?"}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {simOpen && (
          <div className="grid gap-3 rounded-lg border bg-muted/40 p-3 sm:grid-cols-[1fr,120px,1fr]">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Valor total da compra</p>
              <Input
                inputMode="decimal"
                placeholder="Ex.: 2.400,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Parcelas</p>
              <Select value={installments} onValueChange={setInstallments}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cartão</p>
              <Select value={cardId} onValueChange={setCardId}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Cartão" /></SelectTrigger>
                <SelectContent>
                  {projection.cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {simulation && (
              <p className="text-xs sm:col-span-3">
                {simulation.installments}x de <strong>{fmt(simulation.amount / simulation.installments)}</strong> —{" "}
                {negative.length === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    cabe no orçamento: a pior sobra fica em {fmt(worst.balance)} ({worst.label}).
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">
                    não cabe: {negative.length} {negative.length === 1 ? "mês fica" : "meses ficam"} no vermelho.
                  </span>
                )}
                {simulation.installments > months.length &&
                  ` Parcelas depois de ${months[months.length - 1].label} não aparecem aqui.`}
              </p>
            )}
          </div>
        )}

        {(negative.length > 0 || overLimit.length > 0) ? (
          <div className="space-y-1.5">
            {negative.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 text-xs">
                <AlertTriangleIcon size={14} className="mt-0.5 shrink-0 text-red-500" />
                <span>
                  <strong>Saldo negativo previsto</strong> em {negative.map((m) => m.label).join(", ")}. Evite novas
                  compras parceladas e reveja gastos variáveis.
                </span>
              </p>
            )}
            {overLimit.length > 0 && (
              <p className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs">
                <AlertTriangleIcon size={14} className="mt-0.5 shrink-0 text-amber-500" />
                <span>
                  <strong>Cartão acima de {CARD_LIMIT * 100}% da receita</strong> em{" "}
                  {overLimit.map((m) => `${m.label} (${Math.round(m.cardShare! * 100)}%)`).join(", ")}.
                </span>
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs">
            <CheckCircle2Icon size={14} className="shrink-0 text-emerald-500" />
            Nenhum mês no vermelho e o cartão fica abaixo de {CARD_LIMIT * 100}% da receita.
          </p>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={months} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v)}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--muted-foreground) / 0.08)" }} />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1} />
            <Bar dataKey="balance" radius={[4, 4, 4, 4]} maxBarSize={28}>
              {months.map((m) => (
                <Cell key={m.period} fill={m.balance < 0 ? "var(--viz-expense)" : "var(--viz-income)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Table view — every number readable without hovering */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1.5 text-left font-normal" />
                {months.map((m) => (
                  <th key={m.period} className="py-1.5 text-right font-normal">{m.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {(
                [
                  ["Receita", (m: ProjectionMonth) => m.income, ""],
                  ["Contas fixas", (m: ProjectionMonth) => -m.fixed, ""],
                  ["Faturas", (m: ProjectionMonth) => -m.cardBills, "cards"],
                  ["Dia a dia (estim.)", (m: ProjectionMonth) => -m.variable, ""],
                ] as const
              ).map(([label, get, kind]) => (
                <tr key={label} className="border-t border-border/50">
                  <td className="py-1.5 text-muted-foreground">{label}</td>
                  {months.map((m) => (
                    <td
                      key={m.period}
                      className={`py-1.5 text-right ${
                        kind === "cards" && m.cardShare !== null && m.cardShare > CARD_LIMIT
                          ? "text-amber-600 dark:text-amber-400"
                          : ""
                      }`}
                    >
                      {fmtShort(get(m))}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t font-semibold">
                <td className="py-1.5">Sobra</td>
                {months.map((m) => (
                  <td
                    key={m.period}
                    className={`py-1.5 text-right ${m.balance < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                  >
                    {fmtShort(m.balance)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectionCard;
