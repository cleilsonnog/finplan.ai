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
        className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4 transition-colors hover:border-white/40 hover:bg-white/[0.05]"
      >
        <div className="rounded-full border border-white/20 p-3">
          <PlusIcon className="h-6 w-6 text-white/40" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-white/60">
            Adicione um cartão
          </p>
          <p className="text-xs text-white/30">
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
