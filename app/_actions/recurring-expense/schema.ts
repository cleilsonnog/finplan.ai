import { z } from "zod";

export const recurringExpenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "O nome é obrigatório." })
    .max(100, { message: "O nome deve ter no máximo 100 caracteres." }),
  amount: z.number().positive({ message: "O valor deve ser positivo." }),
  category: z.string().min(1, { message: "A categoria é obrigatória." }),
  dueDay: z
    .number()
    .int()
    .min(1, { message: "O dia deve ser entre 1 e 31." })
    .max(31, { message: "O dia deve ser entre 1 e 31." }),
});

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;
