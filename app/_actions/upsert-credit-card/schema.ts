import { CardBrand } from "@prisma/client";
import { z } from "zod";

export const upsertCreditCardSchema = z.object({
  name: z.string().trim().min(1, {
    message: "O nome é obrigatório.",
  }),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, {
      message: "Informe exatamente 4 dígitos.",
    }),
  brand: z.nativeEnum(CardBrand, {
    required_error: "A bandeira é obrigatória.",
  }),
  bank: z.string().trim().min(1, {
    message: "O banco é obrigatório.",
  }),
  limit: z
    .number({
      required_error: "O limite é obrigatório.",
    })
    .positive({
      message: "O limite deve ser positivo.",
    }),
  closingDay: z
    .number({
      required_error: "O dia de fechamento é obrigatório.",
    })
    .int()
    .min(1, { message: "Mínimo 1." })
    .max(31, { message: "Máximo 31." }),
  dueDay: z
    .number({
      required_error: "O dia de vencimento é obrigatório.",
    })
    .int()
    .min(1, { message: "Mínimo 1." })
    .max(31, { message: "Máximo 31." }),
});
