"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  FileUpIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import type { TransactionCategory } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { TRANSACTION_CATEGORY_LABELS } from "@/app/_constants/transactions";
import type { ImportLimits } from "@/app/_lib/import/limits";
import type { CategorySource, OrphanTransaction, PreviewRow, StatementKind } from "@/app/_lib/import/types";
import { importStatement, type ImportResult } from "@/app/_actions/import-statement";
import { updateCardBillingDays } from "@/app/_actions/update-card-billing-days";

interface ImportFlowProps {
  creditCards: { id: string; name: string; lastFourDigits: string }[];
  customCategories: { id: string; name: string }[];
  categoryLabels: Record<string, string>;
  limits: ImportLimits;
}

interface PreviewResponse {
  kind: StatementKind;
  fileName: string;
  fileType: "OFX" | "PDF";
  creditCardId: string | null;
  cardName: string | null;
  rows: PreviewRow[];
  orphans: OrphanTransaction[];
  bill: {
    billTotal: number | null;
    extractedTotal: number;
    dueDate: string | null;
    periodEnd: string | null;
  } | null;
  cardDrift: { closingDay: number; dueDay: number } | null;
  account: { openingBalance: number | null; closingBalance: number | null; computedClosing: number | null } | null;
  limits: ImportLimits;
}

type ReviewRow = PreviewRow & { remember: boolean; originalCategoryKey: string };

const fmt = (v: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

const SOURCE_BADGE: Record<CategorySource, { label: string; className: string }> = {
  rule: { label: "Regra salva", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  history: { label: "Seu histórico", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  keyword: { label: "Automático", className: "bg-muted text-muted-foreground" },
  ai: { label: "IA", className: "bg-violet-500/10 text-violet-700 dark:text-violet-400" },
  default: { label: "Revisar", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
};

const categoryKey = (r: { category: TransactionCategory; customCategoryId: string | null }) =>
  r.customCategoryId ? `custom:${r.customCategoryId}` : `cat:${r.category}`;

const ImportFlow = ({ creditCards, customCategories, categoryLabels, limits }: ImportFlowProps) => {
  const [kind, setKind] = useState<StatementKind>("ACCOUNT");
  const [cardId, setCardId] = useState<string>(creditCards[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [onlyReview, setOnlyReview] = useState(false);
  const [createFuture, setCreateFuture] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [toDelete, setToDelete] = useState<Set<string>>(new Set());
  const [saving, startSaving] = useTransition();

  const categoryOptions = useMemo(
    () => [
      ...Object.entries(TRANSACTION_CATEGORY_LABELS).map(([value, label]) => ({
        key: `cat:${value}`,
        label: categoryLabels[value] ?? label,
      })),
      ...customCategories.map((c) => ({ key: `custom:${c.id}`, label: c.name })),
    ],
    [categoryLabels, customCategories],
  );

  const blocked = limits.importsLeft === 0;

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      if (kind === "CREDIT_CARD") form.append("creditCardId", cardId);
      const res = await fetch("/api/import/preview", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Não foi possível ler o arquivo");
        return;
      }
      const response = data as PreviewResponse;
      if (response.kind !== kind) {
        toast.info(
          response.kind === "CREDIT_CARD"
            ? `Identifiquei uma fatura de cartão (${response.cardName})`
            : "Identifiquei um extrato de conta",
        );
      }
      setPreview(response);
      setToDelete(new Set());
      setRows(
        response.rows.map((r) => ({ ...r, remember: false, originalCategoryKey: categoryKey(r) })),
      );
    } catch {
      toast.error("Falha ao enviar o arquivo");
    } finally {
      setLoading(false);
    }
  };

  const update = (externalId: string, patch: Partial<ReviewRow>) =>
    setRows((prev) => prev.map((r) => (r.externalId === externalId ? { ...r, ...patch } : r)));

  const selected = rows.filter((r) => r.include && r.action !== "IGNORE");
  const totalOut = selected
    .filter((r) => r.type !== "DEPOSIT")
    .reduce((s, r) => s + (r.isCredit ? -r.amount : r.amount), 0);
  const totalIn = selected.filter((r) => r.type === "DEPOSIT").reduce((s, r) => s + r.amount, 0);
  const toReview = rows.filter((r) => r.action === "TRANSACTION" && r.categorySource === "default").length;
  const hasInstallments = rows.some((r) => r.installment && r.installment.number < r.installment.total);
  const overLimit = selected.length > limits.maxLines;
  const visibleRows = onlyReview
    ? rows.filter((r) => r.action === "TRANSACTION" && r.categorySource === "default")
    : rows;

  const billCheck = preview?.bill?.billTotal
    ? Math.abs(preview.bill.billTotal - preview.bill.extractedTotal) < 1
    : null;
  const balanceCheck =
    preview?.account?.closingBalance != null && preview.account.computedClosing != null
      ? Math.abs(preview.account.closingBalance - preview.account.computedClosing) < 0.05
      : null;

  const handleConfirm = () => {
    if (!preview) return;
    startSaving(async () => {
      try {
        const res = await importStatement({
          fileName: preview.fileName,
          fileType: preview.fileType,
          creditCardId: preview.creditCardId,
          createFutureInstallments: createFuture,
          deleteTransactionIds: Array.from(toDelete),
          billDates:
            preview.bill?.periodEnd && preview.bill.dueDate
              ? { closingDate: preview.bill.periodEnd, dueDate: preview.bill.dueDate }
              : null,
          rows: selected.map((r) => ({
            externalId: r.externalId,
            date: r.date,
            description: r.description,
            name: r.name,
            amount: r.amount,
            isCredit: r.isCredit,
            type: r.type,
            category: r.category,
            customCategoryId: r.customCategoryId,
            paymentMethod: r.paymentMethod,
            action: r.action,
            installment: r.installment,
            billCardId: r.billCardId,
            notes: r.notes?.trim() || null,
            remember: r.remember,
          })),
        });
        setResult(res);
        toast.success("Importação concluída");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao importar");
      }
    });
  };

  const reset = () => {
    setPreview(null);
    setRows([]);
    setFile(null);
    setResult(null);
    setOnlyReview(false);
    setToDelete(new Set());
  };

  // ---------------------------------------------------------------- done
  if (result) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <CheckCircle2Icon className="text-emerald-500" size={36} />
          <p className="text-lg font-semibold">{result.created} transações importadas</p>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            {result.deleted > 0 && <p>{result.deleted} lançamento(s) antigo(s) excluído(s)</p>}
            {result.futureInstallments > 0 && <p>{result.futureInstallments} parcelas futuras criadas</p>}
            {result.billsPaid > 0 && <p>{result.billsPaid} fatura(s) marcada(s) como paga(s)</p>}
            {result.rulesSaved > 0 && <p>{result.rulesSaved} categoria(s) memorizada(s) para as próximas</p>}
            {result.skippedDuplicates > 0 && <p>{result.skippedDuplicates} já estavam importadas e foram ignoradas</p>}
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" onClick={reset}>Importar outro arquivo</Button>
            <Button asChild><Link href="/transactions">Ver transações</Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------- upload
  if (!preview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">1. Escolha o arquivo</CardTitle>
          {!limits.isPremium && (
            <p className="text-xs text-muted-foreground">
              Plano grátis: {limits.importsLeft} importação disponível este mês, até {limits.maxLines} lançamentos.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {blocked ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
              Você já usou a importação gratuita deste mês.{" "}
              <Link href="/subscription" className="font-medium text-primary hover:underline">
                Assine o premium
              </Link>{" "}
              para importar sem limite.
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>O que você vai importar?</Label>
                  <Select value={kind} onValueChange={(v) => setKind(v as StatementKind)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCOUNT">Extrato da conta (PDF ou OFX)</SelectItem>
                      <SelectItem value="CREDIT_CARD">Fatura do cartão (PDF ou OFX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {kind === "CREDIT_CARD" && (
                  <div className="space-y-1.5">
                    <Label>Cartão</Label>
                    {creditCards.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        <Link href="/credit-cards" className="text-primary hover:underline">Cadastre o cartão</Link> primeiro.
                      </p>
                    ) : (
                      <Select value={cardId} onValueChange={setCardId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {creditCards.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} •••• {c.lastFourDigits}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50">
                <FileUpIcon className="text-muted-foreground" />
                <span className="text-sm font-medium">{file ? file.name : "Clique para escolher o arquivo"}</span>
                <span className="text-xs text-muted-foreground">
                  O app identifica sozinho se é extrato ou fatura e de qual cartão.{" "}
                  {kind === "ACCOUNT"
                    ? "Extrato mensal em PDF do app do banco (ou OFX, se o banco oferecer)"
                    : "PDF da fatura fechada baixado do app do banco (ou OFX)"}
                </span>
                <input
                  type="file"
                  accept=".ofx,.pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <Button
                className="w-full sm:w-auto"
                disabled={!file || loading || (kind === "CREDIT_CARD" && !cardId)}
                onClick={handleUpload}
              >
                {loading ? (
                  <>
                    <Loader2Icon className="mr-2 animate-spin" size={16} />
                    {file?.name.toLowerCase().endsWith(".pdf") ? "Lendo a fatura com IA…" : "Lendo extrato…"}
                  </>
                ) : (
                  "Ler arquivo"
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Faturas em PDF e lançamentos que o app não reconhece são analisados por IA (OpenAI). Dados da
                conta, como número e agência, não são enviados.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------- review
  return (
    <Card>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">2. Revise antes de salvar</CardTitle>
            <p className="text-xs text-muted-foreground">
              {preview.kind === "CREDIT_CARD" ? `Fatura do cartão ${preview.cardName ?? ""}` : "Extrato da conta"} ·{" "}
              {preview.fileName} · {rows.length} lançamentos encontrados
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>Trocar arquivo</Button>
        </div>

        {preview.bill && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
              billCheck === false
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-emerald-500/30 bg-emerald-500/5"
            }`}
          >
            {billCheck === false ? (
              <AlertTriangleIcon size={14} className="mt-0.5 shrink-0 text-amber-500" />
            ) : (
              <CheckCircle2Icon size={14} className="mt-0.5 shrink-0 text-emerald-500" />
            )}
            <span>
              Total lido: <strong>{fmt(preview.bill.extractedTotal)}</strong>
              {preview.bill.billTotal !== null && <> · total da fatura: <strong>{fmt(preview.bill.billTotal)}</strong></>}
              {billCheck === false && " — os valores não batem, confira se faltou algum lançamento."}
              {preview.bill.dueDate && ` · vencimento ${new Date(preview.bill.dueDate).toLocaleDateString("pt-BR")}`}
            </span>
          </div>
        )}

        {preview.cardDrift && preview.creditCardId && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sky-500/30 bg-sky-500/5 p-3 text-xs">
            <span>
              O banco fechou esta fatura no <strong>dia {preview.cardDrift.closingDay}</strong> com vencimento no{" "}
              <strong>dia {preview.cardDrift.dueDay}</strong>, diferente do cadastro do cartão. As datas reais desta fatura
              serão usadas de qualquer forma; atualizar o cadastro ajusta as próximas.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  await updateCardBillingDays({
                    cardId: preview.creditCardId!,
                    closingDay: preview.cardDrift!.closingDay,
                    dueDay: preview.cardDrift!.dueDay,
                  });
                  toast.success("Cartão atualizado");
                  setPreview({ ...preview, cardDrift: null });
                } catch {
                  toast.error("Não foi possível atualizar o cartão");
                }
              }}
            >
              Atualizar cartão
            </Button>
          </div>
        )}

        {preview.account && balanceCheck !== null && (
          <div
            className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
              balanceCheck ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
            }`}
          >
            {balanceCheck ? (
              <CheckCircle2Icon size={14} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangleIcon size={14} className="mt-0.5 shrink-0 text-amber-500" />
            )}
            <span>
              {balanceCheck
                ? "Todos os movimentos foram lidos: o saldo final confere com o extrato."
                : `O saldo final calculado (${fmt(preview.account.computedClosing!)}) não confere com o extrato (${fmt(preview.account.closingBalance!)}). Confira se faltou algum lançamento.`}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            className={`rounded-full border px-3 py-1 ${!onlyReview ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
            onClick={() => setOnlyReview(false)}
          >
            Todos ({rows.length})
          </button>
          <button
            className={`rounded-full border px-3 py-1 ${onlyReview ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}
            onClick={() => setOnlyReview(true)}
          >
            Para revisar ({toReview})
          </button>
          {preview.kind === "CREDIT_CARD" && hasInstallments && (
            <label className="ml-auto flex items-center gap-2 text-muted-foreground">
              <input
                type="checkbox"
                className="accent-primary"
                checked={createFuture}
                onChange={(e) => setCreateFuture(e.target.checked)}
              />
              Criar as parcelas futuras das compras parceladas
            </label>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {visibleRows.map((r) => {
          const ignored = r.action === "IGNORE";
          const changed = categoryKey(r) !== r.originalCategoryKey;
          return (
            <div
              key={r.externalId}
              className={`grid grid-cols-[auto,1fr] gap-x-3 gap-y-2 rounded-lg border p-3 sm:grid-cols-[auto,minmax(0,1fr),200px,110px] sm:items-center ${
                !r.include || ignored ? "opacity-50" : ""
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-primary sm:mt-0"
                checked={r.include && !ignored}
                disabled={ignored}
                onChange={(e) => update(r.externalId, { include: e.target.checked })}
                aria-label="Incluir lançamento"
              />

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{fmtDate(r.date)}</span>
                  <Input
                    value={r.name}
                    onChange={(e) => update(r.externalId, { name: e.target.value })}
                    className="h-8 text-sm"
                    disabled={ignored}
                  />
                </div>
                {!ignored && r.action === "TRANSACTION" && (
                  <Input
                    value={r.notes ?? ""}
                    onChange={(e) => update(r.externalId, { notes: e.target.value })}
                    placeholder="Observação (opcional)"
                    maxLength={500}
                    className="h-7 text-xs"
                  />
                )}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="truncate text-muted-foreground" title={r.description}>{r.description}</span>
                  {r.installment && (
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      Parcela {r.installment.number}/{r.installment.total}
                    </span>
                  )}
                  {r.duplicateOf && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-amber-700 dark:text-amber-400">
                      Já lançada: {r.duplicateOf.name}
                    </span>
                  )}
                  {r.cardSuffix && (
                    <span className="rounded bg-muted px-1.5 py-0.5">Cartão final {r.cardSuffix}</span>
                  )}
                  {ignored && r.note && (
                    <span className="rounded bg-muted px-1.5 py-0.5">{r.note}</span>
                  )}
                </div>
              </div>

              <div className="col-start-2 space-y-1 sm:col-start-auto">
                {r.action === "BILL_PAYMENT" ? (
                  <>
                    <Select
                      value={r.billCardId ?? ""}
                      onValueChange={(v) => update(r.externalId, { billCardId: v })}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Fatura de qual cartão?" /></SelectTrigger>
                      <SelectContent>
                        {creditCards.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">Marca a fatura como paga</p>
                  </>
                ) : r.action === "TRANSACTION" ? (
                  <>
                    <Select
                      value={categoryKey(r)}
                      onValueChange={(v) => {
                        const [type, id] = v.split(":");
                        update(r.externalId, {
                          category: type === "cat" ? (id as TransactionCategory) : "OTHER",
                          customCategoryId: type === "custom" ? id : null,
                          remember: v !== r.originalCategoryKey && r.type === "EXPENSE",
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((o) => (
                          <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className={`rounded px-1.5 py-0.5 ${SOURCE_BADGE[r.categorySource].className}`}>
                        {r.categorySource === "ai" && <SparklesIcon size={10} className="mr-0.5 inline" />}
                        {changed ? "Editado" : SOURCE_BADGE[r.categorySource].label}
                      </span>
                      {changed && r.type === "EXPENSE" && (
                        <label className="flex items-center gap-1 text-muted-foreground">
                          <input
                            type="checkbox"
                            className="accent-primary"
                            checked={r.remember}
                            onChange={(e) => update(r.externalId, { remember: e.target.checked })}
                          />
                          lembrar
                        </label>
                      )}
                    </div>
                  </>
                ) : null}
              </div>

              <p
                className={`col-start-2 text-sm font-semibold tabular-nums sm:col-start-auto sm:text-right ${
                  r.type === "DEPOSIT" || r.isCredit ? "text-emerald-600 dark:text-emerald-400" : ""
                }`}
              >
                {r.type === "DEPOSIT" || r.isCredit ? "+" : "−"}
                {fmt(r.amount)}
                <span className="block text-[11px] font-normal text-muted-foreground">
                  {r.isCredit
                    ? "Crédito no cartão"
                    : r.type === "DEPOSIT"
                      ? "Receita"
                      : r.type === "INVESTMENT"
                        ? "Investimento"
                        : r.action === "BILL_PAYMENT"
                          ? "Fatura"
                          : "Despesa"}
                </span>
              </p>
            </div>
          );
        })}

        {preview.orphans.length > 0 && (
          <div className="mt-4 space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <div>
              <p className="text-sm font-medium">
                {preview.orphans.length} lançamento(s) seu(s) nesta fatura não aparece(m) no PDF
              </p>
              <p className="text-xs text-muted-foreground">
                Geralmente são lançamentos antigos digitados com outro valor. Marque os que devem ser excluídos
                para a fatura do app ficar igual à do banco.
              </p>
            </div>
            {preview.orphans.map((o) => (
              <label key={o.id} className="flex items-center justify-between gap-3 rounded-md bg-background/60 px-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-red-500"
                    checked={toDelete.has(o.id)}
                    onChange={(e) =>
                      setToDelete((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(o.id);
                        else next.delete(o.id);
                        return next;
                      })
                    }
                  />
                  <span className="text-xs tabular-nums text-muted-foreground">{fmtDate(o.date)}</span>
                  {o.name}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  {fmt(o.amount)}
                  {toDelete.has(o.id) && <span className="text-xs text-red-600 dark:text-red-400">excluir</span>}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 mt-4 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur">
          <div className="text-sm">
            <p className="font-medium">{selected.length} selecionados</p>
            <p className="text-xs text-muted-foreground">
              Saídas {fmt(totalOut)}
              {totalIn > 0 && ` · Entradas ${fmt(totalIn)}`}
            </p>
            {overLimit && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Plano grátis: até {limits.maxLines} lançamentos por importação.
              </p>
            )}
          </div>
          <Button
            disabled={
              saving ||
              (selected.length === 0 && toDelete.size === 0 && !preview.bill?.periodEnd) ||
              overLimit
            }
            onClick={handleConfirm}
          >
            {saving && <Loader2Icon className="mr-2 animate-spin" size={16} />}
            {selected.length === 0 && toDelete.size === 0
              ? "Salvar datas da fatura"
              : `Importar ${selected.length} lançamentos${toDelete.size > 0 ? ` e excluir ${toDelete.size}` : ""}`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportFlow;
