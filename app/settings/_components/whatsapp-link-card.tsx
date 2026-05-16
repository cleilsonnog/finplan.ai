"use client";

import { linkWhatsApp, unlinkWhatsApp } from "@/app/_actions/whatsapp-link";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WhatsAppLinkCardProps {
  currentPhone: string | null;
}

export default function WhatsAppLinkCard({
  currentPhone,
}: WhatsAppLinkCardProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLink() {
    if (!phone.trim()) {
      toast.error("Informe o numero do WhatsApp.");
      return;
    }
    setLoading(true);
    try {
      await linkWhatsApp(phone);
      toast.success("WhatsApp vinculado com sucesso!");
      setPhone("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao vincular WhatsApp.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUnlink() {
    setLoading(true);
    try {
      await unlinkWhatsApp();
      toast.success("WhatsApp desvinculado.");
    } catch {
      toast.error("Erro ao desvincular.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-green-500" />
        <h2 className="text-lg font-semibold">WhatsApp</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Vincule seu numero para cadastrar transacoes pelo WhatsApp. Envie
        mensagens como: <strong>gastei 50 alimentacao pix</strong>
      </p>

      {currentPhone ? (
        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <div>
            <p className="text-sm text-muted-foreground">Numero vinculado</p>
            <p className="font-mono font-semibold">+{currentPhone}</p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleUnlink}
            disabled={loading}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="5522999998888"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
          <Button onClick={handleLink} disabled={loading}>
            Vincular
          </Button>
        </div>
      )}

      <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Comandos:</strong>
        </p>
        <p>gastei 50 alimentacao pix</p>
        <p>recebi 3000 salario transferencia</p>
        <p>investi 500 educacao pix</p>
        <p>ajuda - ver todos os comandos</p>
      </div>
    </div>
  );
}
