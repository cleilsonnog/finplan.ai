"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { getCategoryLabel } from "@/app/_utils/category";
import { TransactionCategory } from "@prisma/client";
import { useState } from "react";

interface CreditCardTransactionItem {
  id: string;
  name: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  creditCardId: string | null;
  creditCardName: string;
  customCategory?: { id: string; name: string } | null;
}

interface CreditCardOption {
  id: string;
  name: string;
  lastFourDigits: string;
}

interface CreditCardTransactionsProps {
  transactions: CreditCardTransactionItem[];
  creditCards: CreditCardOption[];
}

const CreditCardTransactions = ({
  transactions,
  creditCards,
}: CreditCardTransactionsProps) => {
  const [selectedCardId, setSelectedCardId] = useState<string>("all");

  const filtered =
    selectedCardId === "all"
      ? transactions
      : transactions.filter((t) => t.creditCardId === selectedCardId);

  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-bold">
          Gastos com Cartão de Crédito
        </CardTitle>
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
            Nenhuma transação com cartão de crédito encontrada.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cartão</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>{t.creditCardName}</TableCell>
                    <TableCell>
                      {getCategoryLabel(t.category, t.customCategory)}
                    </TableCell>
                    <TableCell>
                      {new Date(t.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(t.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            <div className="mt-4 flex justify-end border-t pt-4">
              <p className="text-sm font-bold">
                Total: {formatCurrency(total)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditCardTransactions;
