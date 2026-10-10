import { createHash } from "crypto";
import OpenAI from "openai";
import { stripAccents } from "./normalize";
import { extractPdfColumns, type PdfPageText } from "./pdf-text";
import type { StatementLine } from "./types";

// Statements and card bills come as PDF in a different layout per bank (Santander bills list
// several cards side by side; account statements split each movement over two lines). The
// model reads the PDF and returns structured lines. Each result carries a check against totals
// printed on the document, so a misread shows up on the review screen instead of being imported.

const PDF_MODEL = "gpt-4o";
// Structuring already-extracted text is an easier job than reading the PDF
const BILL_TEXT_MODEL = process.env.IMPORT_BILL_MODEL || "gpt-4.1-mini";

const toDate = (iso: string | null) => {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
};

const round2 = (v: number) => Math.round(v * 100) / 100;

/** Stable id per line; the occurrence counter keeps identical lines (two coffees) distinct */
const idFactory = (prefix: string) => {
  const seen = new Map<string, number>();
  return (base: string) => {
    const occurrence = (seen.get(base) ?? 0) + 1;
    seen.set(base, occurrence);
    return `${prefix}:${createHash("sha1").update(`${base}|${occurrence}`).digest("hex").slice(0, 24)}`;
  };
};

const askModel = async <T>(
  buffer: Buffer,
  fileName: string,
  instructions: string,
  schema: object,
  name: string,
  prompt = "Extraia os lançamentos deste documento.",
) => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: PDF_MODEL,
    temperature: 0,
    input: [
      { role: "system", content: instructions },
      {
        role: "user",
        content: [
          {
            type: "input_file",
            filename: fileName,
            file_data: `data:application/pdf;base64,${buffer.toString("base64")}`,
          },
          { type: "input_text", text: prompt },
        ],
      },
    ],
    text: { format: { type: "json_schema", name, strict: true, schema: schema as Record<string, unknown> } },
  });
  return JSON.parse(response.output_text) as T;
};

/** Same as askModel, for text already extracted from the PDF */
const askModelText = async <T>(instructions: string, schema: object, name: string, text: string) => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: BILL_TEXT_MODEL,
    temperature: 0,
    input: [
      { role: "system", content: instructions },
      { role: "user", content: text },
    ],
    text: { format: { type: "json_schema", name, strict: true, schema: schema as Record<string, unknown> } },
  });
  return JSON.parse(response.output_text) as T;
};

// ---------------------------------------------------------------------------------------------
// Credit card bill
// ---------------------------------------------------------------------------------------------

export interface PdfBill {
  lines: StatementLine[];
  /** Total printed on the bill */
  billTotal: number | null;
  dueDate: Date | null;
  /** Purchases minus credits as extracted — should match billTotal */
  extractedTotal: number;
}

// Short keys: the per-page output is long and generation time is the bottleneck
interface BillLine {
  d: string; // date
  t: string; // description
  v: number; // amount
  c: boolean; // is credit
  pn: number | null; // installment number
  pt: number | null; // installment total
  k: string | null; // card last digits
}

const BILL_HEADER_INSTRUCTIONS =
  "Você lê o texto da primeira página de faturas de cartão de crédito brasileiras e devolve o resumo: " +
  "billTotal = 'Total a Pagar'; dueDate = vencimento; periodEnd = último dia do período das compras desta fatura " +
  "(ex.: 'compras realizadas até 29/09' ou 'Período 26/08/26 a 29/09/26' → 29/09). Datas em YYYY-MM-DD.";

const BILL_HEADER_SCHEMA = {
  type: "object",
  properties: {
    billTotal: { type: ["number", "null"] },
    dueDate: { type: ["string", "null"] },
    periodEnd: { type: ["string", "null"] },
  },
  required: ["billTotal", "dueDate", "periodEnd"],
  additionalProperties: false,
};

const billLinesInstructions = (context: string) =>
  "Você recebe o texto de UMA coluna de uma página de fatura de cartão de crédito brasileira " +
  "(colunas da tabela separadas por ' | '). " + context + " " +
  "Extraia TODOS os lançamentos, linha por linha, sem resumir nem pular nenhum. " +
  "Marcadores [CARTAO xxxx] indicam a qual cartão pertencem as linhas seguintes: informe k = xxxx. " +
  "Números soltos antes da data (ex.: '3 06/09 MERCADO') são códigos do banco, ignore-os. " +
  "Inclua compras, parcelas, tarifas, IOF, juros, seguros e créditos (estornos, descontos, cashback). " +
  "NÃO inclua o pagamento da fatura anterior ('PAGAMENTO DE FATURA'), subtotais ('VALOR TOTAL'), resumos, " +
  "lançamentos de valor zero, o boleto nem o histórico de faturas. Se a página não tiver lançamentos, devolva lista vazia. " +
  "date em YYYY-MM-DD: a fatura mostra só dia/mês da COMPRA; nenhuma data pode ser posterior ao fim do período; " +
  "em parcelamentos a data é a da compra original, que pode ser de meses ou do ano anterior. " +
  "amount: valor positivo em reais. isCredit: true para créditos (valores negativos na fatura). " +
  "pn/pt: da coluna Parcela ('08/10' → 8 e 10), senão null. " +
  "t: texto do lançamento como impresso, sem a parcela. " +
  "Campos: d=data, t=descrição, v=valor, c=é crédito, pn/pt=parcela, k=4 últimos dígitos do cartão.";

const BILL_LINES_SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          d: { type: "string" },
          t: { type: "string" },
          v: { type: "number" },
          c: { type: "boolean" },
          pn: { type: ["integer", "null"] },
          pt: { type: ["integer", "null"] },
          k: { type: ["string", "null"] },
        },
        required: ["d", "t", "v", "c", "pn", "pt", "k"],
        additionalProperties: false,
      },
    },
  },
  required: ["lines"],
  additionalProperties: false,
};

const BILL_CREDIT = /desconto|estorno|cashback|credito|devolucao|reembolso|bonificacao/;

// "CLEILSON H NOGUEIRA - 4258 XXXX XXXX 0949" → "0949"
const CARD_HEADER = /\d{4}\s*X{4}\s*X{4}\s*(\d{4})/i;

// Most bills print each line as "dd/mm DESCRIPTION [nn/nn] AMOUNT" — once the columns are
// separated (pdf-text.ts adds " | " between table cells) a regex reads them exactly.
// "3 06/09 MERCADO LIDER | 12,99" · "09/02 SALVADOR AUTO PECAS | 08/10 | 144,00" · "29/09 DESCONTO DO MES | -127,70"
const BILL_LINE =
  /^(?:\d\s+)?(\d{2})\/(\d{2})\s+(.+?)\s+\|\s+(?:(\d{2})\/(\d{2})\s+\|\s+)?(-?\d{1,3}(?:\.\d{3})*,\d{2})(?:\s*-)?(?:\s+\|.*)?$/;
const SKIP_LINE = /pagamento\s*(de\s*)?fatura|pagamento\s*recebido|saldo\s*anterior|valor\s*total|total\s*(da|desta)\s*fatura/;

const parseBillChunksWithRegex = (chunks: string[], periodEnd: Date | null): BillLine[] => {
  const end = periodEnd ?? new Date();
  const out: BillLine[] = [];
  for (const chunk of chunks) {
    let card: string | null = null;
    for (const raw of chunk.split("\n")) {
      const marker = /^\[CARTAO (\d{4})\]$/.exec(raw);
      if (marker) {
        card = marker[1];
        continue;
      }
      const m = BILL_LINE.exec(raw.trim());
      if (!m) continue;
      const description = m[3].replace(/\s+\|\s+/g, " ").trim();
      if (SKIP_LINE.test(stripAccents(description.toLowerCase()))) continue;
      const value = Number(m[6].replace(/\./g, "").replace(",", "."));
      if (!value) continue;
      // Only day/month is printed: purchases can't be after the period end, so a later
      // month belongs to the previous year (installments bought last year)
      const day = Number(m[1]);
      const month = Number(m[2]);
      let year = end.getFullYear();
      if (month > end.getMonth() + 1 || (month === end.getMonth() + 1 && day > end.getDate() + 5)) year--;
      const installment = m[4] ? { pn: Number(m[4]), pt: Number(m[5]) } : null;
      out.push({
        d: `${year}-${m[2]}-${m[1]}`,
        t: description,
        v: Math.abs(value),
        c: value < 0 || /-$/.test(raw.trim()),
        pn: installment && installment.pt > 1 ? installment.pn : null,
        pt: installment && installment.pt > 1 ? installment.pt : null,
        k: card,
      });
    }
  }
  return out;
};

export interface PdfInspection {
  pages: PdfPageText[];
  /** Looks like a credit card bill (masked card number + bill summary terms) */
  isCardBill: boolean;
  /** Last digits of every card printed on the bill (holder + additional cards) */
  cardSuffixes: string[];
}

/** Reads the PDF text once to tell a card bill from an account statement */
export const inspectPdf = async (buffer: Buffer): Promise<PdfInspection> => {
  const pages = await extractPdfColumns(buffer);
  const text = pages.flatMap((p) => p.columns).join("\n");
  const cardSuffixes = Array.from(new Set(Array.from(text.matchAll(new RegExp(CARD_HEADER, "gi")), (m) => m[1])));
  const billTerms = /total\s+a\s+pagar|pagamento\s+m[ií]nimo|limite\s+dispon[ií]vel|vencimento\s+da\s+fatura/i.test(text);
  return { pages, isCardBill: cardSuffixes.length > 0 && billTerms, cardSuffixes };
};

export const parseCardBillPdf = async (inspection: PdfInspection): Promise<PdfBill> => {
  const { pages } = inspection;
  if (pages.length === 0) throw new Error("PDF sem texto");

  const header = await askModelText<{ billTotal: number | null; dueDate: string | null; periodEnd: string | null }>(
    BILL_HEADER_INSTRUCTIONS,
    BILL_HEADER_SCHEMA,
    "card_bill_header",
    pages[0].columns.join("\n"),
  );
  const context = [
    header.periodEnd && `O período de compras desta fatura termina em ${header.periodEnd}.`,
    header.dueDate && `Vencimento: ${header.dueDate}.`,
  ]
    .filter(Boolean)
    .join(" ");

  // Mark card blocks in reading order; a block continuing from the previous column/page
  // inherits the last card seen
  let currentCard: string | null = null;
  const chunks: string[] = [];
  for (const page of pages) {
    for (const column of page.columns) {
      const out: string[] = currentCard ? [`[CARTAO ${currentCard}]`] : [];
      for (const line of column.split("\n")) {
        const m = CARD_HEADER.exec(line);
        if (m) {
          currentCard = m[1];
          out.push(`[CARTAO ${currentCard}]`);
        }
        out.push(line);
      }
      // Columns without any amount (headers, ads, payment slip) carry no purchases
      if (/\d+,\d{2}/.test(column)) chunks.push(out.join("\n"));
    }
  }

  // Exact and free when the layout is the usual one; the model only reads bills it can't
  const net = (ls: BillLine[]) => round2(ls.reduce((sum, l) => sum + (l.c ? -l.v : l.v), 0));
  let billLines = parseBillChunksWithRegex(chunks, toDate(header.periodEnd));
  const regexMatches = header.billTotal !== null && Math.abs(net(billLines) - header.billTotal) < 1;
  if (!regexMatches) {
    const results = await Promise.all(
      chunks.map((chunk) =>
        askModelText<{ lines: BillLine[] }>(billLinesInstructions(context), BILL_LINES_SCHEMA, "card_bill_lines", chunk),
      ),
    );
    const modelLines = results.flatMap((r) => r.lines);
    // Keep whichever reading lands closer to the printed total
    if (header.billTotal === null || Math.abs(net(modelLines) - header.billTotal) < Math.abs(net(billLines) - header.billTotal)) {
      billLines = modelLines;
    }
  }

  const nextId = idFactory("pdf");
  const lines: StatementLine[] = [];
  for (const l of billLines) {
    const date = toDate(l.d);
    if (!date || !(l.v > 0)) continue;
    // The model sometimes misses the minus sign on these — they are always credits
    if (BILL_CREDIT.test(stripAccents(l.t.toLowerCase()))) l.c = true;
    const hasInstallment = !!l.pn && !!l.pt && l.pt > 1 && l.pn <= l.pt;
    lines.push({
      externalId: nextId(`${l.d}|${l.t.trim().toLowerCase()}|${l.v.toFixed(2)}|${l.pn ?? ""}`),
      date,
      description: l.t.trim(),
      amount: l.c ? l.v : -l.v, // purchases are money out
      installment: hasInstallment ? { number: l.pn!, total: l.pt! } : undefined,
      cardSuffix: l.k ?? undefined,
    });
  }

  return {
    lines,
    billTotal: header.billTotal,
    dueDate: toDate(header.dueDate),
    extractedTotal: round2(lines.reduce((s, l) => s - l.amount, 0)),
  };
};

// ---------------------------------------------------------------------------------------------
// Bank account statement
// ---------------------------------------------------------------------------------------------

export interface PdfAccountStatement {
  lines: StatementLine[];
  openingBalance: number | null;
  closingBalance: number | null;
  /** opening + sum(lines) — should match closingBalance */
  computedClosing: number | null;
}

interface AccountLine {
  date: string;
  kind: string;
  counterparty: string | null;
  amount: number;
  isOwnTransfer: boolean;
}

const ACCOUNT_INSTRUCTIONS =
  "Você extrai a movimentação da conta corrente de extratos bancários brasileiros. " +
  "Cada movimento pode ocupar duas linhas: a primeira com o tipo (ex.: 'PIX ENVIADO', 'DEBITO VISA ELECTRON BRASIL', " +
  "'DEBITO AUT. CTA ENERGIA ELETRICA') e o valor; a segunda com o detalhe (pessoa do pix, estabelecimento da compra no débito, " +
  "empresa do débito automático). Quando a data não aparece na linha, ela é a mesma do movimento anterior. " +
  "kind: o tipo do movimento como impresso. counterparty: o detalhe (estabelecimento/pessoa/empresa) sem datas e horários, ou null. " +
  "amount: com sinal — negativo para saídas/débitos (valores com '-' no final), positivo para entradas. " +
  "isOwnTransfer: true quando o pix/TED/transferência é entre contas do PRÓPRIO titular (a contraparte tem o mesmo nome do titular). " +
  "Ignore linhas de saldo ('SALDO EM', 'SALDO ANTERIOR'), as tabelas de saldos por período, investimentos e propaganda. " +
  "openingBalance/closingBalance: saldos inicial e final da conta corrente no período. date em YYYY-MM-DD.";

const ACCOUNT_SCHEMA = {
  type: "object",
  properties: {
    holderName: { type: ["string", "null"] },
    openingBalance: { type: ["number", "null"] },
    closingBalance: { type: ["number", "null"] },
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          kind: { type: "string" },
          counterparty: { type: ["string", "null"] },
          amount: { type: "number" },
          isOwnTransfer: { type: "boolean" },
        },
        required: ["date", "kind", "counterparty", "amount", "isOwnTransfer"],
        additionalProperties: false,
      },
    },
  },
  required: ["holderName", "openingBalance", "closingBalance", "lines"],
  additionalProperties: false,
};

export const parseAccountStatementPdf = async (
  buffer: Buffer,
  fileName: string,
): Promise<PdfAccountStatement> => {
  const parsed = await askModel<{
    holderName: string | null;
    openingBalance: number | null;
    closingBalance: number | null;
    lines: AccountLine[];
  }>(buffer, fileName, ACCOUNT_INSTRUCTIONS, ACCOUNT_SCHEMA, "account_statement");

  const nextId = idFactory("pdfacc");
  const lines: StatementLine[] = [];
  for (const l of parsed.lines) {
    const date = toDate(l.date);
    if (!date || !l.amount) continue;
    const counterparty = l.counterparty?.trim() || null;
    lines.push({
      externalId: nextId(`${l.date}|${l.kind.trim().toLowerCase()}|${counterparty?.toLowerCase() ?? ""}|${l.amount.toFixed(2)}`),
      date,
      // The merchant/person is what the user recognizes; the movement type goes in memo
      description: counterparty ?? l.kind.trim(),
      memo: l.kind.trim(),
      amount: l.amount,
      ownTransfer: l.isOwnTransfer,
    });
  }

  const sum = lines.reduce((s, l) => s + l.amount, 0);
  return {
    lines,
    openingBalance: parsed.openingBalance,
    closingBalance: parsed.closingBalance,
    computedClosing: parsed.openingBalance !== null ? round2(parsed.openingBalance + sum) : null,
  };
};
