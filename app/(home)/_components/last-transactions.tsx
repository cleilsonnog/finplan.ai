import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import { TRANSACTION_PAYMENT_METHOD_ICONS } from "@/app/_constants/transactions";
import { formatCurrency } from "@/app/_utils/currency";
import { TransactionPaymentMethod, TransactionType } from "@prisma/client";
import {
  ArrowLeftRight,
  Banknote,
  CircleEllipsis,
  CreditCard,
  FileText,
  QrCode,
} from "lucide-react";
import Link from "next/link";

const PAYMENT_METHOD_ICON_MAP = {
  ArrowLeftRight,
  FileText,
  Banknote,
  CreditCard,
  CircleEllipsis,
  QrCode,
} as const;

interface SerializedTransaction {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  paymentMethod: TransactionPaymentMethod;
  date: Date;
}

interface LastTransactionsProps {
  lastTransactions: SerializedTransaction[];
}

const LastTransactions = ({ lastTransactions }: LastTransactionsProps) => {
  // A negative expense is a card credit (refund, cashback): money back, shown as "+"
  const isCredit = (transaction: SerializedTransaction) =>
    transaction.type === TransactionType.EXPENSE && Number(transaction.amount) < 0;
  const getAmountColor = (transaction: SerializedTransaction) => {
    if (isCredit(transaction)) {
      return "text-primary";
    }
    if (transaction.type === TransactionType.EXPENSE) {
      return "text-red-500";
    }
    if (transaction.type === TransactionType.DEPOSIT) {
      return "text-primary";
    }
    return "text-foreground";
  };
  const getAmountPrefix = (transaction: SerializedTransaction) => {
    if (transaction.type === TransactionType.DEPOSIT || isCredit(transaction)) {
      return "+";
    }
    return "-";
  };
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Últimas transações</CardTitle>
          <p className="text-xs text-muted-foreground">Movimentações mais recentes</p>
        </div>
        <Button variant="outline" size="sm" className="rounded-full" asChild>
          <Link href="/transactions">Ver todas</Link>
        </Button>
      </CardHeader>
      <ScrollArea className="h-[340px]">
      <CardContent className="space-y-4">
        {lastTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2.5 text-muted-foreground">
                {(() => {
                  const iconName = TRANSACTION_PAYMENT_METHOD_ICONS[transaction.paymentMethod];
                  const Icon = PAYMENT_METHOD_ICON_MAP[iconName];
                  return <Icon size={18} />;
                })()}
              </div>
              <div>
                <p className="text-sm font-medium">{transaction.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className={`shrink-0 text-sm font-semibold tabular-nums ${getAmountColor(transaction)}`}>
              {getAmountPrefix(transaction)}
              {formatCurrency(Math.abs(Number(transaction.amount)))}
            </p>
          </div>
        ))}
      </CardContent>
      </ScrollArea>
    </Card>
  );
};

export default LastTransactions;
