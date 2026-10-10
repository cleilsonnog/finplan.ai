"use client";

import Image from "next/image";
import Link from "next/link";
import { CreditCardIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { BILL_STATUS_LABELS, CARD_BRAND_ICONS, getBankIcon } from "@/app/_constants/credit-cards";
import type { CreditCardOutlook, UpcomingBillMonth } from "@/app/_data/get-credit-card-outlook";
import type { BillStatus } from "@prisma/client";

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtShort = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");

const STATUS_STYLES: Record<BillStatus, string> = {
  PAID: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  OPEN: "bg-muted text-muted-foreground",
  CLOSED: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  OVERDUE: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const usageColor = (ratio: number) => {
  if (ratio >= 0.9) return "bg-red-500";
  if (ratio >= 0.7) return "bg-amber-500";
  return "bg-[var(--viz-card)]";
};

const UpcomingTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: UpcomingBillMonth }[];
}) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg">
      <p className="mb-2 text-sm font-semibold">Fatura {item.label}</p>
      {item.byCard.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nada lançado ainda</p>
      ) : (
        <div className="space-y-1">
          {item.byCard.map((c) => (
            <div key={c.cardId} className="flex justify-between gap-4 text-xs">
              <span className="text-muted-foreground">{c.name}</span>
              <span className="font-medium tabular-nums">{fmt(c.amount)}</span>
            </div>
          ))}
        </div>
      )}
      {item.byCard.length > 1 && (
        <div className="mt-2 flex justify-between border-t pt-2 text-xs">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold tabular-nums">{fmt(item.total)}</span>
        </div>
      )}
    </div>
  );
};

interface CreditCardOverviewProps {
  outlook: CreditCardOutlook;
  monthLabel: string;
}

const CreditCardOverview = ({ outlook, monthLabel }: CreditCardOverviewProps) => {
  const { cards, upcoming } = outlook;

  if (cards.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
        <CreditCardIcon className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Cadastre seus cartões para acompanhar faturas e limite aqui.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/credit-cards">Adicionar cartão</Link>
        </Button>
      </Card>
    );
  }

  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cards.reduce((s, c) => s + c.usedLimit, 0);
  const upcomingTotal = upcoming.reduce((s, m) => s + m.total, 0);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="text-base font-semibold">Cartões de crédito</CardTitle>
          <p className="text-xs text-muted-foreground">
            {fmt(totalUsed)} usados de {fmt(totalLimit)} de limite total
          </p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link href="/credit-cards">Ver faturas</Link>
        </Button>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
        {/* Per-card status */}
        <div className="space-y-3">
          {cards.map((card) => {
            const ratio = card.limit > 0 ? Math.min(card.usedLimit / card.limit, 1) : 0;
            const available = Math.max(card.limit - card.usedLimit, 0);
            const logo = getBankIcon(card.bank) ?? CARD_BRAND_ICONS[card.brand];
            return (
              <div key={card.id} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                    {logo ? (
                      <Image src={logo} alt={card.bank} width={24} height={24} />
                    ) : (
                      <CreditCardIcon size={16} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{card.name}</p>
                    <p className="text-xs text-muted-foreground">•••• {card.lastFourDigits}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Vence em {monthLabel}</p>
                    <p className="text-base font-semibold">{fmt(card.dueBill.amount)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[card.dueBill.status]}`}
                      >
                        {BILL_STATUS_LABELS[card.dueBill.status]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {card.dueBill.status === "OPEN"
                          ? `fecha ${fmtDate(card.dueBill.closingDate)}`
                          : `vence ${fmtDate(card.dueBill.dueDate)}`}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Próxima fatura</p>
                    <p className="text-base font-semibold">{fmt(card.nextBill.amount)}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      fecha {fmtDate(card.nextBill.closingDate)} · vence {fmtDate(card.nextBill.dueDate)}
                    </p>
                  </div>
                </div>

                {(card.dueBill.status === "CLOSED" || card.dueBill.status === "OVERDUE") &&
                  card.dueBill.amount > 0 && (
                    <Link
                      href={`/credit-cards?month=${card.dueBill.closingPeriod}`}
                      className="mt-2 block text-[11px] font-medium text-primary hover:underline"
                    >
                      Já pagou? Marque como paga para descontar do saldo
                    </Link>
                  )}

                {card.limit > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--viz-track)]">
                      <div
                        className={`h-full rounded-full ${usageColor(ratio)}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                      <span>{Math.round(ratio * 100)}% do limite</span>
                      <span>{fmt(available)} disponível</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Upcoming bills */}
        <div className="flex flex-col">
          <div className="mb-2 flex items-baseline justify-between">
            <p className="text-sm font-medium">Próximas faturas</p>
            <p className="text-xs text-muted-foreground">
              {fmt(upcomingTotal)} em 6 meses
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={upcoming} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v) =>
                  Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                }
              />
              <Tooltip content={<UpcomingTooltip />} cursor={{ fill: "hsl(var(--muted-foreground) / 0.08)" }} />
              <Bar dataKey="total" fill="var(--viz-card)" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
          {/* Table view of the same values — every number readable without hovering */}
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {upcoming.map((m) => (
              <div key={m.key} className="rounded-md bg-muted/60 px-2 py-1.5 text-center">
                <p className="text-[11px] text-muted-foreground">{m.label}</p>
                <p className="text-xs font-semibold tabular-nums">{fmtShort(m.total)}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditCardOverview;
