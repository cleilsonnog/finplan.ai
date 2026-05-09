"use client";

import { Button } from "@/app/_components/ui/button";
import UpsertTransactionDialog from "@/app/_components/upsert-transaction-dialog";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { CustomCategoryOption } from "@/app/_constants/transactions";
import { SerializedTransaction } from "../_columns";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

interface EditTransactionButtonProps {
  transaction: SerializedTransaction;
  creditCards?: SerializedCreditCard[];
  customCategories?: CustomCategoryOption[];
}

const EditTransactionButton = ({
  transaction,
  creditCards = [],
  customCategories = [],
}: EditTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const categoryValue =
    transaction.category === "OTHER" && transaction.customCategoryId
      ? `custom:${transaction.customCategoryId}`
      : transaction.category;

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
      <UpsertTransactionDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        defaultValues={{
          name: transaction.name,
          amount: Number(transaction.amount),
          type: transaction.type,
          categoryValue,
          paymentMethod: transaction.paymentMethod,
          date: new Date(transaction.date),
          creditCardId: transaction.creditCardId ?? undefined,
          installments: transaction.installments ?? 1,
        }}
        transactionId={transaction.id}
        creditCards={creditCards}
        customCategories={customCategories}
      />
    </>
  );
};

export default EditTransactionButton;
