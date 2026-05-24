"use client";

import { useState } from "react";
import Link from "next/link";
import { Progress } from "@/app/_components/ui/progress";
import { Button } from "@/app/_components/ui/button";
import UpsertCreditCardDialog from "@/app/_components/upsert-credit-card-dialog";
import { CARD_BRAND_LABELS, CARD_COLOR_GRADIENTS } from "@/app/_constants/credit-cards";
import { CreditCardSummaryItem } from "@/app/_data/get-credit-card-summary";
import { CardBrand } from "@prisma/client";
import { PencilIcon } from "lucide-react";

interface CreditCardItemProps {
  data: CreditCardSummaryItem;
  editable?: boolean;
}

const CreditCardItem = ({ data, editable = false }: CreditCardItemProps) => {
  const { card, invoiceTotal, cashTotal, installmentTotal, availableLimit, usagePercent } = data;
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const formatCurrency = (value: number) =>
    Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const gradient = CARD_COLOR_GRADIENTS[card.color] ?? CARD_COLOR_GRADIENTS.blue;

  const content = (
    <div
      className={`rounded-xl bg-gradient-to-br ${gradient} border border-white/10 p-4 space-y-3 ${!editable ? "transition-opacity hover:opacity-90" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-white">{card.name}</p>
          <p className="text-sm text-white/60">
            ****{card.lastFourDigits} &middot;{" "}
            {CARD_BRAND_LABELS[card.brand as CardBrand]}
          </p>
        </div>
        {editable && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setDialogIsOpen(true)}
          >
            <PencilIcon size={14} />
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-white/60">Fatura atual</span>
          <span className="font-medium text-white">
            {formatCurrency(invoiceTotal)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/50">À vista</span>
          <span className="text-white/70">
            {formatCurrency(cashTotal)}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-white/50">Parcelado</span>
          <span className="text-white/70">
            {formatCurrency(installmentTotal)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-1">
          <span className="text-white/60">Disponível</span>
          <span className="font-medium text-white">
            {formatCurrency(availableLimit)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <Progress value={Math.min(usagePercent, 100)} />
        <p className="text-right text-xs text-white/50">{usagePercent}% usado</p>
      </div>

      <div className="flex justify-between text-xs text-white/50">
        <span>Fecha dia {card.closingDay}</span>
        <span>Vence dia {card.dueDay}</span>
      </div>
    </div>
  );

  if (editable) {
    return (
      <>
        {content}
        <UpsertCreditCardDialog
          isOpen={dialogIsOpen}
          setIsOpen={setDialogIsOpen}
          creditCardId={card.id}
          defaultValues={{
            name: card.name,
            lastFourDigits: card.lastFourDigits,
            brand: card.brand as CardBrand,
            bank: card.bank,
            limit: card.limit,
            closingDay: card.closingDay,
            dueDay: card.dueDay,
            color: card.color,
          }}
        />
      </>
    );
  }

  return (
    <Link href="/credit-cards">
      {content}
    </Link>
  );
};

export default CreditCardItem;
