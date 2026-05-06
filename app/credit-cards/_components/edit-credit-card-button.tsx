"use client";

import { Button } from "@/app/_components/ui/button";
import UpsertCreditCardDialog from "@/app/_components/upsert-credit-card-dialog";
import { SerializedCreditCard } from "../_columns";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

interface EditCreditCardButtonProps {
  creditCard: SerializedCreditCard;
}

const EditCreditCardButton = ({ creditCard }: EditCreditCardButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
      >
        <PencilIcon />
      </Button>
      <UpsertCreditCardDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        defaultValues={{
          name: creditCard.name,
          lastFourDigits: creditCard.lastFourDigits,
          brand: creditCard.brand,
          bank: creditCard.bank,
          limit: creditCard.limit,
          closingDay: creditCard.closingDay,
          dueDay: creditCard.dueDay,
        }}
        creditCardId={creditCard.id}
      />
    </>
  );
};

export default EditCreditCardButton;
