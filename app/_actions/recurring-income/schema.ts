import { z } from "zod";

export const recurringIncomeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "O nome é obrigatório." })
    .max(100, { message: "O nome deve ter no máximo 100 caracteres." }),
  amount: z.number().positive({ message: "O valor deve ser positivo." }),
  receiveDay: z
    .number()
    .int()
    .min(1, { message: "O dia deve ser entre 1 e 31." })
    .max(31, { message: "O dia deve ser entre 1 e 31." }),
});

export type RecurringIncomeInput = z.infer<typeof recurringIncomeSchema>;
