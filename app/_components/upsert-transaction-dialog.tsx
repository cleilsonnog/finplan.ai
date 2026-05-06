"use client";

import { ArrowDownUpIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import UpsertTransactionDialog, {
  SerializedCreditCard,
} from "./add-transaction-button";

interface AddTransactionButtonProps {
  creditCards?: SerializedCreditCard[];
}

const AddTransactionButton = ({
  creditCards = [],
}: AddTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        className="rounded-full font-bold"
        onClick={() => setDialogIsOpen(true)}
      >
        Adicionar transação
        <ArrowDownUpIcon />
      </Button>
      <UpsertTransactionDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
        creditCards={creditCards}
      />
    </>
  );
};

export default AddTransactionButton;
