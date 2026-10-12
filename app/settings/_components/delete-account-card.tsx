"use client";

import { deleteAccount } from "@/app/_actions/delete-account";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { useClerk } from "@clerk/nextjs";
import { Loader2Icon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DeleteAccountCardProps {
  /** Monthly Stripe subscriber — the subscription is canceled with the account */
  hasStripeSubscription: boolean;
  /** Member of someone else's shared account */
  isSharedMember: boolean;
}

export default function DeleteAccountCard({
  hasStripeSubscription,
  isSharedMember,
}: DeleteAccountCardProps) {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmed = confirmation.trim().toUpperCase() === "EXCLUIR";

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteAccount(confirmation);
      toast.success("Conta excluída.");
      await signOut({ redirectUrl: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir a conta.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-destructive/40 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <TriangleAlertIcon className="h-5 w-5 text-destructive" />
        <h2 className="text-lg font-semibold">Excluir conta</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Apaga sua conta e todos os seus dados: transações, cartões, faturas,
        importações, orçamentos, recorrentes, lista de compras e o vínculo do
        WhatsApp. Não dá para desfazer.
      </p>
      <Button
        variant="destructive"
        onClick={() => {
          setConfirmation("");
          setOpen(true);
        }}
      >
        Excluir minha conta
      </Button>

      <AlertDialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta definitivamente?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Todos os seus dados serão apagados agora e não poderão ser recuperados.</p>
                {hasStripeSubscription && (
                  <p>Sua assinatura Premium mensal será cancelada e não haverá novas cobranças.</p>
                )}
                {isSharedMember && (
                  <p>Você sairá da conta compartilhada. Os dados do dono da conta não são apagados.</p>
                )}
                <p>
                  Para confirmar, digite <strong>EXCLUIR</strong>:
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
            disabled={loading}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={!confirmed || loading}>
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Excluir conta
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
