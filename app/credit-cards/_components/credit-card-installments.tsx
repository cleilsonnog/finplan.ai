"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
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
import { Badge } from "@/app/_components/ui/badge";
import { Progress } from "@/app/_components/ui/progress";
import { useState } from "react";

interface InstallmentGroup {
  name: string;
  creditCardId: string;
  creditCardName: string;
  totalInstallments: number;
  installmentAmount: number;
  totalAmount: number;
  paidInstallments: number;
  remainingAmount: number;
  startDate: string;
  nextDueDate: string | null;
}

interface CreditCardOption {
  id: string;
  name: string;
  lastFourDigits: string;
}

interface CreditCardInstallmentsProps {
  installmentGroups: InstallmentGroup[];
  creditCards: CreditCardOption[];
}

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const CreditCardInstallments = ({
  installmentGroups,
  creditCards,
}: CreditCardInstallmentsProps) => {
  const [selectedCardId, setSelectedCardId] = useState<string>("all");

  const filtered =
    selectedCardId === "all"
      ? installmentGroups
      : installmentGroups.filter((g) => g.creditCardId === selectedCardId);

  const totalRemaining = filtered.reduce((sum, g) => sum + g.remainingAmount, 0);

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-bold">
          Compras Parceladas
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
            Nenhuma compra parcelada encontrada.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cartão</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead className="text-right">Parcela</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Restante</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((group, index) => {
                    const progress =
                      (group.paidInstallments / group.totalInstallments) * 100;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {group.name}
                        </TableCell>
                        <TableCell>{group.creditCardName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-2 w-20" />
                            <Badge variant="outline" className="text-xs">
                              {group.paidInstallments}/{group.totalInstallments}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(group.installmentAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(group.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(group.remainingAmount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end border-t pt-4">
              <p className="text-sm font-bold">
                Total restante: {formatCurrency(totalRemaining)}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditCardInstallments;
