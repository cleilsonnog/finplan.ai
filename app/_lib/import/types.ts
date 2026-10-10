import type {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";

/** A line read from a statement file, before categorization */
export interface StatementLine {
  /** Stable id of the line in the source (OFX FITID or a content hash) — used to skip re-imports */
  externalId: string;
  date: Date;
  description: string;
  /** Signed: negative = money out (expense/payment), positive = money in */
  amount: number;
  /** "05/10" style installment found in a card bill line */
  installment?: { number: number; total: number };
  /** Statement's own label for the movement ("PIX ENVIADO", "DEBITO AUT."), used to classify it */
  memo?: string;
  /** Money moved between the holder's own accounts — neither income nor expense */
  ownTransfer?: boolean;
  /** Last 4 digits of the card (bills can list the holder's and additional cards) */
  cardSuffix?: string;
}

export type StatementKind = "ACCOUNT" | "CREDIT_CARD";

/** What a line becomes when imported */
export type LineAction =
  | "TRANSACTION" // regular income / expense / investment
  | "BILL_PAYMENT" // card bill paid from the account: marks the bill as paid, no new expense
  | "IGNORE"; // card bill "payment received" line, refunds of the bill itself, etc.

export type CategorySource = "rule" | "history" | "keyword" | "ai" | "default";

export interface PreviewRow {
  externalId: string;
  date: string; // ISO
  description: string; // original statement text
  name: string; // editable display name
  amount: number; // positive
  type: TransactionType;
  category: TransactionCategory;
  customCategoryId: string | null;
  categorySource: CategorySource;
  paymentMethod: TransactionPaymentMethod;
  action: LineAction;
  installment: { number: number; total: number } | null;
  /** BILL_PAYMENT rows: card whose bill gets marked as paid (auto-matched, user can change) */
  billCardId: string | null;
  /** Why the line is ignored / extra context shown on the review screen */
  note: string | null;
  cardSuffix: string | null;
  /** Editable note saved on the transaction (prefilled for additional cards) */
  notes: string | null;
  /** Already in the app (same file imported before, or launched by hand/WhatsApp) */
  duplicateOf: { id: string; name: string } | null;
  include: boolean;
}

/** Transaction already in the app for the imported bill that matches no line of the file */
export interface OrphanTransaction {
  id: string;
  name: string;
  amount: number;
  date: string; // ISO
}
