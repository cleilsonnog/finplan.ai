import { Button } from "@/app/_components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
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
  const getAmountColor = (transaction: SerializedTransaction) => {
    if (transaction.type === TransactionType.EXPENSE) {
      return "text-red-500";
    }
    if (transaction.type === TransactionType.DEPOSIT) {
      return "text-primary";
    }
    return "text-white";
  };
  const getAmountPrefix = (transaction: SerializedTransaction) => {
    if (transaction.type === TransactionType.DEPOSIT) {
      return "+";
    }
    return "-";
  };
  return (
    <ScrollArea className="rounded-md border">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-bold">Últimas Transações</CardTitle>
        <Button variant="outline" className="rounded-full font-bold" asChild>
          <Link href="/transactions">Ver mais</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {lastTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white bg-opacity-[3%] p-3 text-white">
                {(() => {
                  const iconName = TRANSACTION_PAYMENT_METHOD_ICONS[transaction.paymentMethod];
                  const Icon = PAYMENT_METHOD_ICON_MAP[iconName];
                  return <Icon size={20} />;
                })()}
              </div>
              <div>
                <p className="text-sm font-bold">{transaction.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(transaction.date).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <p className={`text-sm font-bold ${getAmountColor(transaction)}`}>
              {getAmountPrefix(transaction)}
              {formatCurrency(Number(transaction.amount))}
            </p>
          </div>
        ))}
      </CardContent>
    </ScrollArea>
  );
};

export default LastTransactions;
