"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { BILL_STATUS_LABELS } from "@/app/_constants/credit-cards";
import { SerializedBill } from "@/app/_data/get-credit-card-bills";
import { payCreditCardBill } from "@/app/_actions/pay-credit-card-bill";
import { BillStatus } from "@prisma/client";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { CheckCircle2Icon, AlertTriangleIcon, ClockIcon, CreditCardIcon } from "lucide-react";

interface CreditCardOption {
  id: string;
  name: string;
  lastFourDigits: string;
}

interface CreditCardBillsProps {
  bills: SerializedBill[];
  creditCards: CreditCardOption[];
}

const STATUS_STYLES: Record<BillStatus, { className: string; icon: React.ReactNode }> = {
  OPEN: {
    className: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/20",
    icon: <CreditCardIcon className="mr-1" size={12} />,
  },
  CLOSED: {
    className: "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20",
    icon: <ClockIcon className="mr-1" size={12} />,
  },
  PAID: {
    className: "bg-green-500/20 text-green-400 hover:bg-green-500/20",
    icon: <CheckCircle2Icon className="mr-1" size={12} />,
  },
  OVERDUE: {
    className: "bg-red-500/20 text-red-400 hover:bg-red-500/20",
    icon: <AlertTriangleIcon className="mr-1" size={12} />,
  },
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const CreditCardBills = ({ bills, creditCards }: CreditCardBillsProps) => {
  const [selectedCardId, setSelectedCardId] = useState<string>("all");
  const [loadingBillId, setLoadingBillId] = useState<string | null>(null);

  const filtered =
    selectedCardId === "all"
      ? bills
      : bills.filter((b) => b.creditCardId === selectedCardId);

  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const handlePayBill = async (billId: string) => {
    try {
      setLoadingBillId(billId);
      await payCreditCardBill(billId);
      toast.success("Fatura marcada como paga!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao pagar fatura",
      );
    } finally {
      setLoadingBillId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-bold">Faturas</CardTitle>
        <Select value={selectedCardId} onValueChange={setSelectedCardId}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por cartão" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cartões</SelectItem>
            {creditCards.map((card) => (
              <SelectItem key={card.id} value={card.id}>
                {card.name} (****{card.lastFourDigits})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma fatura encontrada.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bill) => {
              const style = STATUS_STYLES[bill.status];
              const canPay = bill.status === "CLOSED" || bill.status === "OVERDUE";

              return (
                <div
                  key={bill.id}
                  className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">
                        {bill.creditCardName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ****{bill.creditCardLastFour}
                      </p>
                    </div>
                    <Badge className={style.className}>
                      {style.icon}
                      {BILL_STATUS_LABELS[bill.status]}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {MONTH_NAMES[bill.month - 1]}/{bill.year}
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(bill.totalAmount)}
                    </p>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Fecha:{" "}
                      {new Date(bill.closingDate).toLocaleDateString("pt-BR")}
                    </span>
                    <span>
                      Vence:{" "}
                      {new Date(bill.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  {bill.paidAt && (
                    <p className="text-xs text-green-400">
                      Pago em{" "}
                      {new Date(bill.paidAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}

                  {canPay && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          className="w-full"
                          size="sm"
                          variant={bill.status === "OVERDUE" ? "destructive" : "default"}
                          disabled={loadingBillId === bill.id}
                        >
                          <CheckCircle2Icon className="mr-2" size={14} />
                          {loadingBillId === bill.id
                            ? "Processando..."
                            : "Marcar como Paga"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar pagamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Deseja marcar a fatura de{" "}
                            <strong>
                              {MONTH_NAMES[bill.month - 1]}/{bill.year}
                            </strong>{" "}
                            do cartão <strong>{bill.creditCardName}</strong> no
                            valor de{" "}
                            <strong>{formatCurrency(bill.totalAmount)}</strong>{" "}
                            como paga?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handlePayBill(bill.id)}
                          >
                            Confirmar Pagamento
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditCardBills;
