import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z.object({
  name: z.string().trim().min(1),
  // Negative only for card credits (refund, cashback): a negative expense lowers the bill
  amount: z.number().refine((v) => v !== 0),
  type: z.nativeEnum(TransactionType),
  category: z.nativeEnum(TransactionCategory),
  paymentMethod: z.nativeEnum(TransactionPaymentMethod),
  date: z.date(),
  creditCardId: z.string().optional(),
  customCategoryId: z.string().optional(),
  installments: z.number().int().min(1).max(48).default(1),
  notes: z.string().trim().max(500).nullable().optional(),
}).refine(
  (t) => t.amount > 0 || (t.type === "EXPENSE" && t.paymentMethod === "CREDIT_CARD" && (t.installments ?? 1) === 1),
  { message: "Valor negativo só para estorno/crédito no cartão", path: ["amount"] },
);
