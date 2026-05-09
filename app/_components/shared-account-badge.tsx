"use client";

import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { leaveShare } from "@/app/_actions/account-sharing";
import { toast } from "sonner";
import { Loader2Icon, UsersIcon } from "lucide-react";
import type { ShareRole } from "@/app/_data/get-share-status";

interface SharedAccountBadgeProps {
  role: ShareRole;
  partnerName: string | null;
}

const SharedAccountBadge = ({ role, partnerName }: SharedAccountBadgeProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLeave = async () => {
    try {
      setIsLoading(true);
      await leaveShare();
      toast.success("Você saiu da conta compartilhada.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao sair.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const label =
    role === "owner"
      ? `Compartilhando com ${partnerName ?? "membro"}`
      : `Conta de ${partnerName ?? "proprietário"}`;

  if (role === "member") {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Badge
            variant="outline"
            className="cursor-pointer gap-1 border-primary/30 text-xs"
          >
            <UsersIcon className="h-3 w-3" />
            {label}
          </Badge>
        </DialogTrigger>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Conta Compartilhada</DialogTitle>
            <DialogDescription>
              Você está visualizando os dados financeiros de{" "}
              <strong>{partnerName}</strong>. Deseja sair?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleLeave}
              disabled={isLoading}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              Sair da conta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-primary/30 text-xs">
      <UsersIcon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

export default SharedAccountBadge;
