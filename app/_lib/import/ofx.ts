import { parseInstallment } from "./normalize";
import type { StatementKind, StatementLine } from "./types";

// OFX 1.x is SGML (tags often left unclosed, one per line); OFX 2.x is XML. Reading each
// <STMTTRN> block tag by tag up to the next "<" handles both.

/** Brazilian banks usually export OFX 1.x in windows-1252 (CHARSET:1252) */
export const decodeOfx = (buffer: Buffer) => {
  const head = buffer.subarray(0, 600).toString("latin1");
  const isUtf8 = /CHARSET:\s*(UTF-?8|NONE)/i.test(head) || /encoding="utf-8"/i.test(head);
  return new TextDecoder(isUtf8 ? "utf-8" : "windows-1252").decode(buffer);
};

const tagValue = (block: string, tag: string) => {
  const m = new RegExp(`<${tag}>([^<\\r\\n]*)`, "i").exec(block);
  return m ? m[1].trim() : undefined;
};

/** 20261005, 20261005120000, 20261005120000.000[-3:BRT] → Date at noon local (date only matters) */
const parseOfxDate = (value: string) => {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (!m) return null;
  // Noon avoids any day shift from the bank's timezone suffix
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
};

const parseAmount = (value: string) => {
  // "-123.45", "-123,45", "1.234,56"
  const v = value.includes(",") ? value.replace(/\./g, "").replace(",", ".") : value;
  return Number(v);
};

export interface OfxStatement {
  kind: StatementKind;
  bankId?: string;
  lines: StatementLine[];
}

export const parseOfx = (text: string): OfxStatement => {
  const kind: StatementKind = /<CREDITCARDMSGSRSV1>|<CCSTMTRS>/i.test(text) ? "CREDIT_CARD" : "ACCOUNT";
  const bankId = tagValue(text, "BANKID") ?? tagValue(text, "ORG");
  const accountId = tagValue(text, "ACCTID") ?? "";

  const blocks = text.split(/<STMTTRN>/i).slice(1);
  const lines: StatementLine[] = [];
  for (const raw of blocks) {
    const block = raw.split(/<\/STMTTRN>/i)[0];
    const dateRaw = tagValue(block, "DTPOSTED");
    const amountRaw = tagValue(block, "TRNAMT");
    if (!dateRaw || !amountRaw) continue;
    const date = parseOfxDate(dateRaw);
    const amount = parseAmount(amountRaw);
    if (!date || !Number.isFinite(amount) || amount === 0) continue;

    const memo = tagValue(block, "MEMO");
    const name = tagValue(block, "NAME");
    // Some banks put the merchant in NAME and a generic text in MEMO, others the opposite
    const description =
      [name, memo].filter(Boolean).sort((a, b) => b!.length - a!.length)[0] ?? "Sem descrição";
    const fitId = tagValue(block, "FITID");

    lines.push({
      // FITID is unique only per account — prefix with the account to make it global per user
      externalId: fitId
        ? `ofx:${accountId}:${fitId}`
        : `ofx:${accountId}:${dateRaw.slice(0, 8)}:${amountRaw}:${description}`,
      date,
      description,
      amount,
      installment: kind === "CREDIT_CARD" ? parseInstallment(description) : undefined,
    });
  }
  return { kind, bankId, lines };
};
