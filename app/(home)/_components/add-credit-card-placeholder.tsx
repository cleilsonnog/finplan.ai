"use client";

import UpsertCreditCardDialog from "@/app/_components/upsert-credit-card-dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

const AddCreditCardPlaceholder = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setDialogIsOpen(true)}
        className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-4 transition-colors hover:border-muted-foreground/40 hover:bg-muted/50"
      >
        <div className="rounded-full border border-border p-3">
          <PlusIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Adicione um cartão
          </p>
          <p className="text-xs text-muted-foreground/60">
            Cadastre seu cartão de crédito para acompanhar faturas
          </p>
        </div>
      </button>
      <UpsertCreditCardDialog
        isOpen={dialogIsOpen}
        setIsOpen={setDialogIsOpen}
      />
    </>
  );
};

export default AddCreditCardPlaceholder;
