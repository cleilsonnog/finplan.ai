import { z } from "zod";

export const customCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "O nome é obrigatório." })
    .max(50, { message: "O nome deve ter no máximo 50 caracteres." }),
});

export type CustomCategoryInput = z.infer<typeof customCategorySchema>;
