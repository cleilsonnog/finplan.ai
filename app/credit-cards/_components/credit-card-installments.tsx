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
import { Button } from "@/app/_components/ui/button";
import { FileDown } from "lucide-react";
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
  const totalMonthly = filtered.reduce((sum, g) => sum + g.installmentAmount, 0);

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Compras Parceladas", 14, 20);

    doc.setFontSize(9);
    let startY = 28;
    if (selectedCardId !== "all") {
      const card = creditCards.find((c) => c.id === selectedCardId);
      if (card) {
        doc.text(`Cartao: ${card.name} (****${card.lastFourDigits})`, 14, 27);
        startY = 32;
      }
    }

    const rows = filtered.map((g) => [
      g.name,
      g.creditCardName,
      `${g.paidInstallments}/${g.totalInstallments}`,
      formatCurrency(g.installmentAmount),
      formatCurrency(g.totalAmount),
      formatCurrency(g.remainingAmount),
    ]);

    autoTable(doc, {
      startY,
      head: [["Nome", "Cartao", "Progresso", "Parcela", "Total", "Restante"]],
      body: rows,
      foot: [["", "", "", "", formatCurrency(totalMonthly), formatCurrency(totalRemaining)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      footStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    });

    doc.save("compras-parceladas.pdf");
  };

  return (
    <Card>
      <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-bold">
          Compras Parceladas
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
            <div className="mt-4 flex justify-end gap-6 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Parcela mensal: <span className="font-bold text-foreground">{formatCurrency(totalMonthly)}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Total restante: <span className="font-bold text-foreground">{formatCurrency(totalRemaining)}</span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CreditCardInstallments;
