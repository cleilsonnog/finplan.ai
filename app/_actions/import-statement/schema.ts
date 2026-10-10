import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const importRowSchema = z.object({
  externalId: z.string().min(1).max(200),
  date: z.string().datetime(),
  description: z.string().max(300),
  name: z.string().trim().min(1).max(100),
  amount: z.number().positive().max(10_000_000),
  isCredit: z.boolean(),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  customCategoryId: z.string().nullable(),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  action: z.enum(["TRANSACTION", "BILL_PAYMENT", "IGNORE"]),
  installment: z
    .object({ number: z.number().int().min(1).max(48), total: z.number().int().min(2).max(48) })
    .nullable(),
  billCardId: z.string().nullable(),
  notes: z.string().trim().max(500).nullable(),
  /** User asked to remember this category for the merchant */
  remember: z.boolean(),
});

export const importStatementSchema = z.object({
  fileName: z.string().max(200),
  fileType: z.enum(["OFX", "PDF"]),
  creditCardId: z.string().nullable(),
  createFutureInstallments: z.boolean(),
  rows: z.array(importRowSchema).max(500),
  /** Old entries of this card bill the user chose to delete (they don't exist on the PDF) */
  deleteTransactionIds: z.array(z.string()).max(200).default([]),
  /** Real dates printed on the imported card bill: stored on that bill and locked */
  billDates: z.object({ closingDate: z.string().datetime(), dueDate: z.string().datetime() }).nullable().default(null),
});

export type ImportStatementInput = z.infer<typeof importStatementSchema>;
export type ImportRowInput = z.infer<typeof importRowSchema>;
