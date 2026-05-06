"use client";

import { useMemo, useState } from "react";
import { DataTable } from "@/app/_components/ui/data-table";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { createTransactionColumns, SerializedTransaction } from "../_columns";
import { Button } from "@/app/_components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  TRANSACTION_CATEGORY_LABELS,
  TRANSACTION_CATEGORY_OPTIONS,
  TRANSACTION_PAYMENT_METHOD_LABELS,
  TRANSACTION_PAYMENT_METHOD_OPTIONS,
} from "@/app/_constants/transactions";
import { FileDown } from "lucide-react";
import { TransactionCategory, TransactionPaymentMethod } from "@prisma/client";

interface TransactionsTableProps {
  transactions: SerializedTransaction[];
  creditCards: SerializedCreditCard[];
}

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const TransactionsTable = ({
  transactions,
  creditCards,
}: TransactionsTableProps) => {
  const [category, setCategory] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [creditCardId, setCreditCardId] = useState("all");

  const columns = createTransactionColumns(creditCards);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (category !== "all" && t.category !== category) return false;
      if (paymentMethod !== "all" && t.paymentMethod !== paymentMethod)
        return false;
      if (
        creditCardId !== "all" &&
        (t.creditCardId ?? "") !== creditCardId
      )
        return false;
      return true;
    });
  }, [transactions, category, paymentMethod, creditCardId]);

  const showCreditCardFilter = paymentMethod === "CREDIT_CARD";

  const handleExportPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Transações", 14, 20);

    doc.setFontSize(9);
    const filters: string[] = [];
    if (category !== "all")
      filters.push(
        `Categoria: ${TRANSACTION_CATEGORY_LABELS[category as TransactionCategory]}`,
      );
    if (paymentMethod !== "all")
      filters.push(
        `Método: ${TRANSACTION_PAYMENT_METHOD_LABELS[paymentMethod as TransactionPaymentMethod]}`,
      );
    if (creditCardId !== "all") {
      const card = creditCards.find((c) => c.id === creditCardId);
      if (card) filters.push(`Cartão: ${card.name} (****${card.lastFourDigits})`);
    }
    if (filters.length > 0) {
      doc.text(`Filtros: ${filters.join(" | ")}`, 14, 27);
    }

    const startY = filters.length > 0 ? 32 : 28;

    const rows = filtered.map((t) => {
      let method =
        TRANSACTION_PAYMENT_METHOD_LABELS[t.paymentMethod];
      if (t.paymentMethod === "CREDIT_CARD" && t.creditCard) {
        method = `${t.creditCard.name} (****${t.creditCard.lastFourDigits})`;
      }
      return [
        t.name,
        TRANSACTION_CATEGORY_LABELS[t.category],
        method,
        new Date(t.date).toLocaleDateString("pt-BR"),
        formatCurrency(t.amount),
      ];
    });

    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    autoTable(doc, {
      startY,
      head: [["Nome", "Categoria", "Método", "Data", "Valor"]],
      body: rows,
      foot: [["", "", "", "Total", formatCurrency(total)]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255 },
      footStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: "bold" },
    });

    doc.save("transacoes.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {TRANSACTION_CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={paymentMethod}
          onValueChange={(v) => {
            setPaymentMethod(v);
            if (v !== "CREDIT_CARD") setCreditCardId("all");
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Método de pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos métodos</SelectItem>
            {TRANSACTION_PAYMENT_METHOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showCreditCardFilter && creditCards.length > 0 && (
          <Select value={creditCardId} onValueChange={setCreditCardId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Cartão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos cartões</SelectItem>
              {creditCards.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  {card.name} (****{card.lastFourDigits})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleExportPdf}
          disabled={filtered.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <DataTable columns={columns} data={filtered} />
    </div>
  );
};

export default TransactionsTable;
