import {
  TransactionCategory,
  TransactionPaymentMethod,
  TransactionType,
} from "@prisma/client";
import { z } from "zod";

export const upsertTransactionSchema = z
  .object({
    name: z.string().trim().min(1),
    amount: z.number().positive(),
    type: z.nativeEnum(TransactionType),
    category: z.nativeEnum(TransactionCategory),
    paymentMethod: z.nativeEnum(TransactionPaymentMethod),
    date: z.date(),
    creditCardId: z.string().optional(),
  })
  .refine(
    (data) =>
      data.paymentMethod !== TransactionPaymentMethod.CREDIT_CARD ||
      !!data.creditCardId,
    {
      message: "O cartão de crédito é obrigatório para este método de pagamento.",
      path: ["creditCardId"],
    },
  );
