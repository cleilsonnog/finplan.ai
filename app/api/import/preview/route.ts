import { NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { rateLimit } from "@/app/_lib/rate-limit";
import { getImportLimits } from "@/app/_lib/import/limits";
import { decodeOfx, parseOfx } from "@/app/_lib/import/ofx";
import { inspectPdf, parseAccountStatementPdf, parseCardBillPdf } from "@/app/_lib/import/pdf";
import { buildPreview } from "@/app/_lib/import/preview";
import type { StatementKind } from "@/app/_lib/import/types";

// Route handler instead of a Server Action: actions cap the body at 1 MB and card bill PDFs
// are often larger. Vercel's own limit for function bodies is 4.5 MB.
const MAX_FILE_BYTES = 4 * 1024 * 1024;

// PDF reading by the model can take a while
export const maxDuration = 60;

export async function POST(req: Request) {
  const result = await getEffectiveUserId();
  if (!result) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const userId = result.effectiveUserId;

  if (!rateLimit(`import-preview:${userId}`, { maxRequests: 10, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto." }, { status: 429 });
  }

  const limits = await getImportLimits(userId);
  if (limits.importsLeft === 0) {
    return NextResponse.json(
      { error: "Você já usou a importação gratuita deste mês. Assine o premium para importar sem limite." },
      { status: 403 },
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const creditCardId = (form.get("creditCardId") as string | null) || null;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Envie um arquivo" }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Arquivo maior que 4 MB" }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  const userCards = await db.creditCard.findMany({
    where: { userId },
    select: { id: true, name: true, closingDay: true, dueDay: true, lastFourDigits: true },
  });
  let creditCard = creditCardId ? (userCards.find((c) => c.id === creditCardId) ?? null) : null;
  if (creditCardId && !creditCard) {
    return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });
  }

  try {
    let kind: StatementKind;
    let lines;
    let bill: { billTotal: number | null; extractedTotal: number; dueDate: string | null } | null = null;
    let account: { openingBalance: number | null; closingBalance: number | null; computedClosing: number | null } | null = null;
    let billDueDate: Date | null = null;
    let inspection: Awaited<ReturnType<typeof inspectPdf>> | null = null;

    if (name.endsWith(".ofx") || buffer.subarray(0, 200).toString("latin1").includes("OFXHEADER")) {
      const statement = parseOfx(decodeOfx(buffer));
      kind = statement.kind;
      lines = statement.lines;
      if (kind === "CREDIT_CARD" && !creditCard) {
        return NextResponse.json({ error: "Este OFX é de cartão de crédito: selecione o cartão" }, { status: 400 });
      }
    } else if (name.endsWith(".pdf") && !(inspection = await inspectPdf(buffer)).isCardBill) {
      // The file's content decides, not the type picked on screen
      const pdf = await parseAccountStatementPdf(buffer, file.name);
      kind = "ACCOUNT";
      lines = pdf.lines;
      account = {
        openingBalance: pdf.openingBalance,
        closingBalance: pdf.closingBalance,
        computedClosing: pdf.computedClosing,
      };
    } else if (name.endsWith(".pdf") && inspection) {
      // Card printed on the bill wins over the one picked on screen; a single card needs no pick
      // Suffixes come in print order — the holder's card is listed first, then additional ones
      const printed = inspection.cardSuffixes
        .map((suffix) => userCards.find((c) => c.lastFourDigits === suffix))
        .find(Boolean);
      creditCard = printed ?? creditCard ?? (userCards.length === 1 ? userCards[0] : null);
      if (!creditCard) {
        return NextResponse.json(
          { error: "Este PDF é uma fatura de cartão, mas não identifiquei qual. Escolha o cartão e envie de novo." },
          { status: 400 },
        );
      }
      const pdf = await parseCardBillPdf(inspection);
      kind = "CREDIT_CARD";
      lines = pdf.lines;
      billDueDate = pdf.dueDate;
      bill = {
        billTotal: pdf.billTotal,
        extractedTotal: pdf.extractedTotal,
        dueDate: pdf.dueDate?.toISOString() ?? null,
      };
    } else {
      return NextResponse.json({ error: "Formato não suportado. Use PDF ou OFX." }, { status: 400 });
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: "Nenhum lançamento encontrado no arquivo" }, { status: 422 });
    }

    const { rows, orphans } = await buildPreview({
      userId,
      kind,
      lines,
      creditCard: kind === "CREDIT_CARD" ? creditCard : null,
      billDueDate,
    });

    return NextResponse.json({
      kind,
      fileName: file.name,
      fileType: name.endsWith(".pdf") ? "PDF" : "OFX",
      creditCardId: kind === "CREDIT_CARD" ? creditCard?.id : null,
      cardName: kind === "CREDIT_CARD" && creditCard ? `${creditCard.name} •••• ${creditCard.lastFourDigits}` : null,
      rows,
      orphans,
      bill,
      account,
      limits,
    });
  } catch (err) {
    console.error("Import preview failed:", err);
    return NextResponse.json(
      { error: "Não foi possível ler o arquivo. Confira se é o extrato/fatura correto." },
      { status: 422 },
    );
  }
}
