"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { acceptInvite, rejectInvite } from "@/app/_actions/account-sharing";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

interface PendingInvite {
  id: string;
  ownerName: string;
}

interface PendingInvitesBannerProps {
  invites: PendingInvite[];
}

const PendingInvitesBanner = ({ invites }: PendingInvitesBannerProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (invites.length === 0) return null;

  const visibleInvites = invites.filter((i) => !dismissed.has(i.id));
  if (visibleInvites.length === 0) return null;

  const handleAccept = async (inviteId: string) => {
    try {
      setLoadingId(inviteId);
      await acceptInvite(inviteId);
      toast.success("Convite aceito! Agora você compartilha a conta.");
      setDismissed((prev) => new Set(prev).add(inviteId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao aceitar convite.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    try {
      setLoadingId(inviteId);
      await rejectInvite(inviteId);
      toast.success("Convite recusado.");
      setDismissed((prev) => new Set(prev).add(inviteId));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao recusar convite.",
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2">
      {visibleInvites.map((invite) => (
        <div
          key={invite.id}
          className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {invite.ownerName} convidou você para compartilhar a conta
            </p>
            <p className="text-xs text-muted-foreground">
              Ao aceitar, você visualizará os dados financeiros de{" "}
              {invite.ownerName}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReject(invite.id)}
              disabled={loadingId === invite.id}
            >
              {loadingId === invite.id && (
                <Loader2Icon className="animate-spin" />
              )}
              Recusar
            </Button>
            <Button
              size="sm"
              onClick={() => handleAccept(invite.id)}
              disabled={loadingId === invite.id}
            >
              {loadingId === invite.id && (
                <Loader2Icon className="animate-spin" />
              )}
              Aceitar
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PendingInvitesBanner;
