"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { createPixPayment } from "../_actions/create-pix-payment";
import { CopyIcon, CheckIcon, Loader2Icon, QrCodeIcon } from "lucide-react";

const PixPaymentModal = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    qrCode: string;
    qrCodeBase64: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    try {
      const data = await createPixPayment();
      setPixData(data);
    } catch (err) {
      console.error("Erro ao criar pagamento PIX:", err);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!pixData?.qrCode) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setPixData(null);
    setCopied(false);
  };

  return (
    <>
      <Button
        className="w-full rounded-full bg-[#00b4d8] font-bold hover:bg-[#0096b7]"
        onClick={handleOpen}
      >
        <QrCodeIcon className="mr-2 h-4 w-4" />
        Pagar com PIX
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pagamento via PIX</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Gerando QR Code...
              </p>
            </div>
          ) : pixData ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-lg bg-white p-3">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  width={250}
                  height={250}
                />
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Escaneie o QR Code ou copie o codigo abaixo
              </p>

              <div className="flex w-full items-center gap-2">
                <input
                  readOnly
                  value={pixData.qrCode}
                  className="flex-1 truncate rounded-md border bg-muted px-3 py-2 text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="rounded-lg border border-yellow-600/30 bg-yellow-950/20 p-3">
                <p className="text-center text-xs text-yellow-500">
                  Apos o pagamento, seu acesso vitalicio sera ativado
                  automaticamente em alguns segundos.
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PixPaymentModal;
