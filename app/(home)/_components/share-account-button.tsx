"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Loader2Icon, UserPlusIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { sendShareInvite, revokeShare } from "@/app/_actions/account-sharing";
import { toast } from "sonner";
import type { ShareStatus } from "@/app/_data/get-share-status";

interface ShareAccountButtonProps {
  hasPremiumPlan: boolean;
  shareStatus: ShareStatus;
}

const ShareAccountButton = ({
  hasPremiumPlan,
  shareStatus,
}: ShareAccountButtonProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleInvite = async () => {
    try {
      setIsLoading(true);
      await sendShareInvite(email);
      toast.success("Convite enviado com sucesso!");
      setEmail("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao enviar convite.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async () => {
    try {
      setIsLoading(true);
      await revokeShare();
      toast.success("Compartilhamento removido.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao revogar.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Members don't see this button — they use the badge to leave
  if (shareStatus.role === "member") return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <UserPlusIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[450px]">
        {!hasPremiumPlan ? (
          <>
            <DialogHeader>
              <DialogTitle>Compartilhar Conta</DialogTitle>
              <DialogDescription>
                O compartilhamento de conta está disponível apenas no plano
                premium.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button asChild>
                <Link href="/subscription">Assinar plano premium</Link>
              </Button>
            </DialogFooter>
          </>
        ) : shareStatus.role === "owner" ? (
          <>
            <DialogHeader>
              <DialogTitle>Conta Compartilhada</DialogTitle>
              <DialogDescription>
                Você compartilha sua conta com{" "}
                <strong>{shareStatus.partnerName}</strong> (
                {shareStatus.partnerEmail}).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Fechar</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Revogar acesso
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Compartilhar Conta</DialogTitle>
              <DialogDescription>
                Convide alguém para compartilhar o controle financeiro com você.
                A pessoa convidada verá e poderá gerenciar seus dados
                financeiros.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                type="email"
                placeholder="Email da pessoa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleInvite}
                disabled={isLoading || !email}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareAccountButton;
