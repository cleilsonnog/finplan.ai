"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import { linkIncomeToRecurring } from "@/app/_actions/recurring-income";
import { TRANSACTION_PAYMENT_METHOD_LABELS } from "@/app/_constants/transactions";
import type { TransactionPaymentMethod, TransactionSource } from "@prisma/client";
import { Link2Icon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

interface OtherIncome {
  id: string;
  name: string;
  amount: number;
  date: string;
  paymentMethod: TransactionPaymentMethod;
  source: TransactionSource;
}

interface RecurringIncomeOption {
  id: string;
  name: string;
  amount: number;
  active: boolean;
  receivedThisMonth: boolean;
}

interface OtherIncomeListProps {
  incomes: OtherIncome[];
  recurringIncomes: RecurringIncomeOption[];
  month: string;
}

const SOURCE_LABELS: Partial<Record<TransactionSource, string>> = {
  IMPORT: "Importado",
  WHATSAPP: "WhatsApp",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const OtherIncomeList = ({
  incomes,
  recurringIncomes,
  month,
}: OtherIncomeListProps) => {
  const [linking, setLinking] = useState<OtherIncome | null>(null);
  const [targetId, setTargetId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Only recurring incomes still waiting for this month's receipt can take a link
  const linkable = recurringIncomes.filter((r) => r.active && !r.receivedThisMonth);
  const total = incomes.reduce((sum, i) => sum + i.amount, 0);

  const openLink = (income: OtherIncome) => {
    setLinking(income);
    // Preselect the recurring income with the closest amount
    const closest = [...linkable].sort(
      (a, b) => Math.abs(a.amount - income.amount) - Math.abs(b.amount - income.amount),
    )[0];
    setTargetId(closest?.id ?? "");
  };

  const handleLink = async () => {
    if (!linking || !targetId) return;
    try {
      setLoading(true);
      await linkIncomeToRecurring(linking.id, targetId);
      toast.success("Entrada vinculada à receita recorrente");
      setLinking(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao vincular");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>Outras entradas do mês</CardTitle>
            <p className="text-sm text-muted-foreground">
              PIX recebidos, importados e receitas avulsas
            </p>
          </div>
          {incomes.length > 0 && (
            <span className="shrink-0 font-semibold text-primary">
              {formatCurrency(total)}
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {incomes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma outra entrada neste mês.
            </p>
          ) : (
            incomes.map((income) => (
              <div
                key={income.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate font-medium">{income.name}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDay(income.date)}</span>
                    <span>
                      {TRANSACTION_PAYMENT_METHOD_LABELS[income.paymentMethod]}
                    </span>
                    {SOURCE_LABELS[income.source] && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                        {SOURCE_LABELS[income.source]}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="font-semibold text-primary">
                    {formatCurrency(income.amount)}
                  </span>
                  {linkable.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => openLink(income)}
                      title="Vincular a uma receita recorrente"
                    >
                      <Link2Icon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          <Link
            href={`/transactions?month=${month}`}
            className="block pt-1 text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Ver todas as transações do mês
          </Link>
        </CardContent>
      </Card>

      <AlertDialog open={!!linking} onOpenChange={(open) => !open && setLinking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vincular a uma receita recorrente</AlertDialogTitle>
            <AlertDialogDescription>
              {linking &&
                `"${linking.name}" (${formatCurrency(linking.amount)}) passa a contar como o recebimento do mês da receita escolhida, sem criar outro lançamento.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a receita" />
            </SelectTrigger>
            <SelectContent>
              {linkable.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} · {formatCurrency(r.amount)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleLink();
              }}
              disabled={!targetId || loading}
            >
              {loading && <Loader2Icon className="mr-1 h-4 w-4 animate-spin" />}
              Vincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OtherIncomeList;
