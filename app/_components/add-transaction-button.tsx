"use client";

import { ArrowRightIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import UpsertTransactionDialog from "./upsert-transaction-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Link from "next/link";
import { CreditCard } from "@prisma/client";

export type SerializedCreditCard = Omit<CreditCard, "limit"> & {
  limit: number;
};

interface AddTransactionButtonProps {
  canUserAddTransaction: boolean;
  creditCards?: SerializedCreditCard[];
}

const AddTransactionButton = ({
  canUserAddTransaction,
  creditCards = [],
}: AddTransactionButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  if (!canUserAddTransaction) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild className="rounded-full font-bold">
              <Link href="/subscription">
                Assinar plano premium
                <ArrowRightIcon />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Você atingiu o limite de transações. Assine o plano premium para
            transações ilimitadas.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <Button
        className="rounded-full font-bold"
        onClick={() => setDialogIsOpen(true)}
      >
        Adicionar transação
        <PlusIcon />
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
