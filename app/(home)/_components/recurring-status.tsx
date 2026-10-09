import Link from "next/link";
import { CheckCircle2Icon, ClockIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";

interface RecurringStatusProps {
  totalPaid: number;
  totalPending: number;
}

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const RecurringStatus = ({ totalPaid, totalPending }: RecurringStatusProps) => {
  const total = totalPaid + totalPending;
  const ratio = total > 0 ? totalPaid / total : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Contas fixas</CardTitle>
          <p className="text-xs text-muted-foreground">Recorrentes do mês</p>
        </div>
        <Link href="/recurring" className="text-xs font-medium text-primary hover:underline">
          Gerenciar
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma conta fixa cadastrada.</p>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-2xl font-semibold">{Math.round(ratio * 100)}%</span>
                <span className="text-xs text-muted-foreground">pago de {fmt(total)}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--viz-track)]">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2Icon size={13} className="text-emerald-500" /> Pago
                </p>
                <p className="mt-1 text-sm font-semibold">{fmt(totalPaid)}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ClockIcon size={13} className="text-amber-500" /> Falta pagar
                </p>
                <p className="mt-1 text-sm font-semibold">{fmt(totalPending)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringStatus;
