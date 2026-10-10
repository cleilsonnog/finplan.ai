"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { FileTextIcon, Undo2Icon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { undoImport } from "@/app/_actions/import-statement";

interface RecentImportsProps {
  batches: {
    id: string;
    fileName: string;
    fileType: string;
    cardName: string | null;
    transactionCount: number;
    createdAt: string;
  }[];
}

const RecentImports = ({ batches }: RecentImportsProps) => {
  const [pending, startTransition] = useTransition();
  if (batches.length === 0) return null;

  const handleUndo = (id: string, fileName: string) => {
    if (!confirm(`Desfazer a importação de "${fileName}"? As transações criadas por ela serão apagadas.`)) return;
    startTransition(async () => {
      try {
        await undoImport(id);
        toast.success("Importação desfeita");
      } catch {
        toast.error("Não foi possível desfazer a importação");
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Importações recentes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {batches.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileTextIcon size={18} className="shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{b.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(b.createdAt).toLocaleDateString("pt-BR")} · {b.transactionCount} transações
                  {b.cardName ? ` · ${b.cardName}` : ""}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => handleUndo(b.id, b.fileName)}
            >
              <Undo2Icon size={14} className="mr-1" /> Desfazer
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentImports;
