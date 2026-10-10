import { z } from "zod";
import { parsePeriod } from "@/app/_utils/period";

export const generateAiReportSchema = z.object({
  // "YYYY-MM" (legacy "MM" still accepted, current year implied)
  month: z.string().refine((value) => parsePeriod(value) !== null),
});

export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;
