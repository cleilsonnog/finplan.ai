"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import { TransactionCategory } from "@prisma/client";
import { BellIcon } from "lucide-react";
import Link from "next/link";

interface UpcomingItem {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  category: TransactionCategory;
  customCategoryName: string | null;
  daysUntil: number;
}

interface UpcomingRecurringProps {
  items: UpcomingItem[];
}

const UpcomingRecurring = ({ items }: UpcomingRecurringProps) => {
  if (items.length === 0) return null;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getDueLabel = (daysUntil: number) => {
    if (daysUntil === 0) return "Vence hoje";
    if (daysUntil === 1) return "Vence amanhã";
    return `Vence em ${daysUntil} dias`;
  };

  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <BellIcon className="h-5 w-5 text-yellow-500" />
        <CardTitle className="text-base">Vencimentos Próximos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {items.map((item) => (
            <Link
              href="/recurring"
              key={item.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">
                  {item.customCategoryName ??
                    TRANSACTION_CATEGORY_LABELS[item.category]}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm font-semibold">
                  {formatCurrency(item.amount)}
                </span>
                <span
                  className={`text-xs ${
                    item.daysUntil === 0
                      ? "font-bold text-red-500"
                      : item.daysUntil <= 2
                        ? "text-yellow-500"
                        : "text-muted-foreground"
                  }`}
                >
                  {getDueLabel(item.daysUntil)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingRecurring;
