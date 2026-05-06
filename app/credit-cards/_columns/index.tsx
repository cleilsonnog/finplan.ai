"use client";

import { CreditCard } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { CARD_BRAND_LABELS } from "@/app/_constants/credit-cards";
import EditCreditCardButton from "../_components/edit-credit-card-button";
import DeleteCreditCardButton from "../_components/delete-credit-card-button";

export type SerializedCreditCard = Omit<CreditCard, "limit"> & {
  limit: number;
};

export const creditCardColumns: ColumnDef<SerializedCreditCard>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "lastFourDigits",
    header: "Final",
    cell: ({ row: { original: card } }) => `****${card.lastFourDigits}`,
  },
  {
    accessorKey: "brand",
    header: "Bandeira",
    cell: ({ row: { original: card } }) => CARD_BRAND_LABELS[card.brand],
  },
  {
    accessorKey: "bank",
    header: "Banco",
  },
  {
    accessorKey: "limit",
    header: "Limite",
    cell: ({ row: { original: card } }) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(card.limit),
  },
  {
    accessorKey: "closingDay",
    header: "Fechamento",
    cell: ({ row: { original: card } }) => `Dia ${card.closingDay}`,
  },
  {
    accessorKey: "dueDay",
    header: "Vencimento",
    cell: ({ row: { original: card } }) => `Dia ${card.dueDay}`,
  },
  {
    accessorKey: "actions",
    header: "Ações",
    cell: ({ row: { original: card } }) => {
      return (
        <div className="space-x-1">
          <EditCreditCardButton creditCard={card} />
          <DeleteCreditCardButton creditCardId={card.id} />
        </div>
      );
    },
  },
];
