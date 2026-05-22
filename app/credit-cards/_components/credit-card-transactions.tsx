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
import { Button } from "@/app/_components/ui/button";
import { getCategoryLabel } from "@/app/_utils/category";
import { TransactionCategory } from "@prisma/client";
import { FileDown } from "lucide-react";
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

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const CreditCardTransactions = ({
  transactions,
  creditCards,
}: CreditCardTransactionsProps) => {
  const [selectedCardId, setSelectedCardId] = useState<string>("all");

  const filtered =
    selectedCardId === "all"
      ? transactions
      : transactions.filter((t) => t.creditCardId === selectedCardId);

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Gastos com Cartao de Credito", 14, 20);

    doc.setFontSize(9);
    let startY = 28;
    if (selectedCardId !== "all") {
      const card = creditCards.find((c) => c.id === selectedCardId);
      if (card) {
        doc.text(`Cartao: ${card.name} (****${card.lastFourDigits})`, 14, 27);
        startY = 32;
      }
    }

    const rows = filtered.map((t) => [
      t.name,
      t.creditCardName,
      getCategoryLabel(t.category, t.customCategory),
      new Date(t.date).toLocaleDateString("pt-BR"),
      formatCurrency(t.amount),
    ]);

    autoTable(doc, {
      startY,
      head: [["Nome", "Cartao", "Categoria", "Data", "Valor"]],
      body: rows,
      foot: [["", "", "", "Total", formatCurrency(total)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      footStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    });

    doc.save("gastos-cartao.pdf");
  };

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-bold">
          Gastos com Cartão de Crédito
        </CardTitle>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={filtered.length === 0}
          >
            <FileDown className="mr-1 h-4 w-4" />
            PDF
          </Button>
        </div>
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
