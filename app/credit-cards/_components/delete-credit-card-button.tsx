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
import { Loader2Icon, TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteCreditCard,
  getCreditCardDeletionInfo,
} from "@/app/_actions/delete-credit-card";

interface DeleteCreditCardButtonProps {
  creditCardId: string;
  cardName?: string;
  /** Button classes — the card visual needs white icons over its gradient */
  className?: string;
  iconSize?: number;
}

const DeleteCreditCardButton = ({
  creditCardId,
  cardName,
  className = "text-muted-foreground",
  iconSize,
}: DeleteCreditCardButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);
  const [transactions, setTransactions] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const open = async () => {
    setTransactions(null);
    setDialogIsOpen(true);
    try {
      const info = await getCreditCardDeletionInfo(creditCardId);
      setTransactions(info.transactions);
    } catch {
      setTransactions(null);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await deleteCreditCard(creditCardId);
      toast.success("Cartão excluído");
      setDialogIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao excluir o cartão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={open}
        title="Excluir cartão"
      >
        <TrashIcon size={iconSize} />
      </Button>
      <AlertDialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {cardName ? `o cartão ${cardName}` : "este cartão"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {transactions === null
                ? "Verificando os lançamentos do cartão..."
                : transactions === 0
                  ? "O cartão não tem lançamentos. Essa ação não pode ser desfeita."
                  : `As ${transactions} compras deste cartão (inclusive parcelas futuras) e as faturas dele também serão apagadas. Essa ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={loading || transactions === null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteCreditCardButton;
