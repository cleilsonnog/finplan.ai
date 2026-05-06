"use client";

import { Button } from "@/app/_components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { deleteCreditCard } from "@/app/_actions/delete-credit-card";

interface DeleteCreditCardButtonProps {
  creditCardId: string;
}

const DeleteCreditCardButton = ({
  creditCardId,
}: DeleteCreditCardButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteCreditCard(creditCardId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
        onClick={() => setDialogIsOpen(true)}
      >
        <TrashIcon />
      </Button>
      <AlertDialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Tem certeza que deseja deletar este cartão?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteCreditCardButton;
