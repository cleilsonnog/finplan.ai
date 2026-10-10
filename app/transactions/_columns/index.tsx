"use client";

import { Transaction } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export type SerializedTransaction = Omit<Transaction, "amount"> & {
  amount: number;
  creditCard?: { name: string; lastFourDigits: string } | null;
  customCategory?: { id: string; name: string } | null;
};
import TransactionTypeBadge from "../_components/type-badge";
import DeleteTransactionButton from "../_components/delete-transaction-button";
import {
  TRANSACTION_PAYMENT_METHOD_LABELS,
  CustomCategoryOption,
} from "@/app/_constants/transactions";
import { getCategoryLabel } from "@/app/_utils/category";
import EditTransactionButton from "../_components/edit-transaction-button";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";

export const createTransactionColumns = (
  creditCards: SerializedCreditCard[] = [],
  customCategories: CustomCategoryOption[] = [],
): ColumnDef<SerializedTransaction>[] => [
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row: { original: transaction } }) => (
      <div className="max-w-[260px]">
        <p>{transaction.name}</p>
        {transaction.notes && (
          <p className="truncate text-xs text-muted-foreground" title={transaction.notes}>
            {transaction.notes}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row: { original: transaction } }) => (
      <TransactionTypeBadge transaction={transaction} />
    ),
  },
  {
    accessorKey: "category",
    header: "Categoria",
    cell: ({ row: { original: transaction } }) =>
      getCategoryLabel(transaction.category, transaction.customCategory),
  },
  {
    accessorKey: "paymentMethod",
    header: "Método de Pagamento",
    cell: ({ row: { original: transaction } }) => {
      if (transaction.paymentMethod === "CREDIT_CARD" && transaction.creditCard) {
        const cardLabel = `${transaction.creditCard.name} (****${transaction.creditCard.lastFourDigits})`;
        if (transaction.installments > 1) {
          return `${cardLabel} - ${transaction.installmentNumber}/${transaction.installments}`;
        }
        return cardLabel;
      }
      return TRANSACTION_PAYMENT_METHOD_LABELS[transaction.paymentMethod];
    },
  },
  {
    accessorKey: "date",
    header: "Data",
    cell: ({ row: { original: transaction } }) =>
      new Date(transaction.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row: { original: transaction } }) => {
      const value = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Math.abs(Number(transaction.amount)));
      // Negative expense = card credit (refund, cashback, discount)
      return Number(transaction.amount) < 0 ? (
        <span className="text-emerald-600 dark:text-emerald-400">
          +{value}
          <span className="block text-[11px] text-muted-foreground">crédito</span>
        </span>
      ) : (
        value
      );
    },
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original: transaction } }) => {
      return (
        <div className="space-x-1">
          <EditTransactionButton
                transaction={transaction}
                creditCards={creditCards}
                customCategories={customCategories}
              />
          <DeleteTransactionButton transactionId={transaction.id} />
        </div>
      );
    },
  },
];
