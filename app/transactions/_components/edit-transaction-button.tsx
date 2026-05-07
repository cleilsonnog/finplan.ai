"use client";

import { Button } from "@/app/_components/ui/button";
import UpsertTransactionDialog from "@/app/_components/upsert-transaction-dialog";
import { SerializedCreditCard } from "@/app/_components/add-transaction-button";
import { SerializedTransaction } from "../_columns";
import { PencilIcon } from "lucide-react";
import { useState } from "react";

interface EditTransactionButtonProps {
  transaction: SerializedTransaction;
  creditCards?: SerializedCreditCard[];
}

const EditTransactionButton = ({
  transaction,
  creditCards = [],
}: EditTransactionButtonProps) => {
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
      <UpsertTransactionDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        defaultValues={{
          ...transaction,
          amount: Number(transaction.amount),
          creditCardId: transaction.creditCardId ?? undefined,
        }}
        transactionId={transaction.id}
        creditCards={creditCards}
      />
    </>
  );
};

export default EditTransactionButton;
