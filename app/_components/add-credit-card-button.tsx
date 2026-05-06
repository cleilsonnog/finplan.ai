"use client";

import { CreditCardIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import UpsertCreditCardDialog from "./upsert-credit-card-dialog";

const AddCreditCardButton = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        className="rounded-full font-bold"
        onClick={() => setDialogIsOpen(true)}
      >
        Adicionar cartão
        <CreditCardIcon />
      </Button>
      <UpsertCreditCardDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
      />
    </>
  );
};

export default AddCreditCardButton;
