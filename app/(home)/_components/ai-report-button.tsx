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
import { BotIcon, Loader2Icon, PrinterIcon } from "lucide-react";
import { useRef, useState } from "react";
import { ScrollArea } from "@/app/_components/ui/scroll-area";
import Markdown from "react-markdown";
import Link from "next/link";

interface AiReportButtonProps {
  hasPremiumPlan: boolean;
  month: string;
}

const AiReportButton = ({ month, hasPremiumPlan }: AiReportButtonProps) => {
  const [report, setReport] = useState<string | null>(null);
  const [reportIsLoading, setReportIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório IA - Finplan</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
            h1, h2, h3, h4 { margin-top: 1.5rem; }
            ul, ol { padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div id="content"></div>
        </body>
      </html>
    `);
    const contentEl = printWindow.document.getElementById("content");
    if (contentEl) {
      const reportEl = document.getElementById("ai-report-content");
      if (reportEl) contentEl.innerHTML = reportEl.innerHTML;
    }
    printWindow.document.close();
    printWindow.print();
  };

  const handleGenerateReportClick = async () => {
    try {
      setReportIsLoading(true);
      setReport("");

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const response = await fetch("/api/ai-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ao gerar relatório: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Stream não disponível");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setReport(accumulated);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
    } finally {
      setReportIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      abortControllerRef.current?.abort();
      setReport(null);
    }
  };

  return (
    <Dialog onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          Relatório IA
          <BotIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[600px]">
        {hasPremiumPlan ? (
          <>
            <DialogHeader>
              <DialogTitle>Relatório IA</DialogTitle>
              <DialogDescription>
                Use inteligência artificial para gerar um relatório com insights
                sobre suas finanças.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="prose prose-h3:text-foreground prose-h4:text-foreground prose-strong:text-foreground max-h-[450px] text-foreground">
              <div id="ai-report-content">
                <Markdown>{report}</Markdown>
              </div>
            </ScrollArea>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancelar</Button>
              </DialogClose>
              {report && !reportIsLoading && (
                <Button variant="outline" onClick={handlePrint}>
                  <PrinterIcon />
                  Imprimir
                </Button>
              )}
              <Button
                onClick={handleGenerateReportClick}
                disabled={reportIsLoading}
              >
                {reportIsLoading && <Loader2Icon className="animate-spin" />}
                Gerar relatório
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Relatório IA</DialogTitle>
              <DialogDescription>
                Você precisa de um plano premium para gerar relatórios com IA.
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiReportButton;
