"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { getEffectiveUserId } from "@/app/_lib/get-effective-user-id";
import { getImportLimits } from "@/app/_lib/import/limits";
import { normalizeMerchant } from "@/app/_lib/import/normalize";
import { billMonth1, billYear } from "@/app/_utils/credit-card-bill";
import { loadBillCalendars } from "@/app/_lib/bill-calendar";
import { importStatementSchema, type ImportStatementInput } from "./schema";

const DAY = 24 * 60 * 60 * 1000;

export interface ImportResult {
  deleted: number;
  created: number;
  futureInstallments: number;
  billsPaid: number;
  rulesSaved: number;
  skippedDuplicates: number;
}

export const importStatement = async (input: ImportStatementInput): Promise<ImportResult> => {
  const params = importStatementSchema.parse(input);
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;

  const limits = await getImportLimits(userId);
  if (limits.importsLeft === 0) {
    throw new Error("Você já usou a importação gratuita deste mês.");
  }
  // Re-importing a bill that is already in the app still records its real dates
  if (params.rows.length === 0 && params.deleteTransactionIds.length === 0 && !params.billDates) {
    throw new Error("Nada selecionado para importar.");
  }
  if (params.rows.length > limits.maxLines) {
    throw new Error(
      limits.isPremium
        ? `Máximo de ${limits.maxLines} lançamentos por importação.`
        : `No plano grátis, até ${limits.maxLines} lançamentos por importação. Desmarque alguns ou assine o premium.`,
    );
  }

  // Every referenced id must belong to this user
  const [cards, customCategories] = await Promise.all([
    db.creditCard.findMany({ where: { userId }, select: { id: true, closingDay: true, dueDay: true } }),
    db.customCategory.findMany({ where: { userId }, select: { id: true } }),
  ]);
  const cardById = new Map(cards.map((c) => [c.id, c]));
  const customIds = new Set(customCategories.map((c) => c.id));
  const statementCard = params.creditCardId ? cardById.get(params.creditCardId) : null;
  if (params.creditCardId && !statementCard) throw new Error("Cartão não encontrado");
  for (const row of params.rows) {
    if (row.customCategoryId && !customIds.has(row.customCategoryId)) throw new Error("Categoria inválida");
    if (row.billCardId && !cardById.has(row.billCardId)) throw new Error("Cartão inválido");
  }

  // Bill calendars (locked dates when known); the imported bill gets the dates it printed
  const calendars = await loadBillCalendars(cards);
  let importedBill: { index: number; closingDate: Date; dueDate: Date } | null = null;
  if (statementCard && params.billDates) {
    const dueDate = new Date(params.billDates.dueDate);
    const index = calendars.get(statementCard.id)!.billIndexDueIn(dueDate.getFullYear(), dueDate.getMonth() + 1);
    importedBill = { index, closingDate: new Date(params.billDates.closingDate), dueDate };
    calendars.set(statementCard.id, calendars.get(statementCard.id)!.with(importedBill));
  }

  const transactionRows = params.rows.filter((r) => r.action === "TRANSACTION");
  const billPaymentRows = params.rows.filter((r) => r.action === "BILL_PAYMENT" && r.billCardId);

  // Lines imported before (same file twice) are skipped, never duplicated
  const existing = await db.transaction.findMany({
    where: { userId, externalId: { in: transactionRows.map((r) => r.externalId) } },
    select: { externalId: true },
  });
  const existingIds = new Set(existing.map((e) => e.externalId));
  const toCreate = transactionRows.filter((r) => !existingIds.has(r.externalId));

  // Future installments of card purchases first seen on this bill (k of n → k+1..n)
  const existingInstallments = statementCard
    ? await db.transaction.findMany({
        where: { userId, creditCardId: statementCard.id, installments: { gt: 1 } },
        select: { amount: true, installments: true, installmentNumber: true, name: true },
      })
    : [];

  return db.$transaction(
    async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          userId,
          fileType: params.fileType,
          fileName: params.fileName,
          creditCardId: statementCard?.id ?? null,
          transactionCount: 0,
        },
      });

      const data: Prisma.TransactionCreateManyInput[] = [];
      let futureInstallments = 0;

      for (const row of toCreate) {
        const isCard = !!statementCard;
        data.push({
          name: row.name,
          type: row.type,
          amount: row.isCredit ? -row.amount : row.amount,
          category: row.customCategoryId ? "OTHER" : row.category,
          customCategoryId: row.customCategoryId,
          paymentMethod: isCard ? "CREDIT_CARD" : row.paymentMethod,
          date: new Date(row.date),
          userId,
          creditCardId: statementCard?.id ?? null,
          installments: row.installment?.total ?? 1,
          installmentNumber: row.installment?.number ?? 1,
          source: "IMPORT",
          notes: row.notes || null,
          externalId: row.externalId,
          importBatchId: batch.id,
        });

        if (
          params.createFutureInstallments &&
          statementCard &&
          row.installment &&
          row.installment.number < row.installment.total
        ) {
          const { number, total } = row.installment;
          const dates = calendars.get(statementCard.id)!.installmentDates(new Date(row.date), total - number + 1);
          for (let k = 1; k < dates.length; k++) {
            const installmentNumber = number + k;
            const alreadyThere = existingInstallments.some(
              (t) =>
                t.installments === total &&
                t.installmentNumber === installmentNumber &&
                Math.abs(Number(t.amount) - row.amount) < 0.05,
            );
            if (alreadyThere) continue;
            data.push({
              name: row.name,
              type: row.type,
              amount: row.isCredit ? -row.amount : row.amount,
              category: row.customCategoryId ? "OTHER" : row.category,
              customCategoryId: row.customCategoryId,
              paymentMethod: "CREDIT_CARD",
              date: dates[k],
              userId,
              creditCardId: statementCard.id,
              installments: total,
              installmentNumber,
              source: "IMPORT",
              notes: row.notes || null,
              importBatchId: batch.id,
            });
            futureInstallments++;
          }
        }
      }

      // Only this user's transactions on the statement's card can be removed here
      const deleted = statementCard && params.deleteTransactionIds.length > 0
        ? await tx.transaction.deleteMany({
            where: { id: { in: params.deleteTransactionIds }, userId, creditCardId: statementCard.id },
          })
        : { count: 0 };

      const created = await tx.transaction.createMany({ data, skipDuplicates: true });

      // Bill payments in the account statement mark the matching bill as paid (no new expense:
      // the purchases were already counted when made)
      let billsPaid = 0;
      for (const row of billPaymentRows) {
        const card = cardById.get(row.billCardId!)!;
        const calendar = calendars.get(card.id)!;
        const paidAt = new Date(row.date);
        // The bill due closest to the payment date (paying a few days early/late is common)
        const around = calendar.billIndexDueIn(paidAt.getFullYear(), paidAt.getMonth() + 1);
        const candidates = [around - 1, around, around + 1]
          .map((index) => ({ index, due: calendar.dueDate(index) }))
          .filter((c) => Math.abs(c.due.getTime() - paidAt.getTime()) <= 20 * DAY)
          .sort((a, b) => Math.abs(a.due.getTime() - paidAt.getTime()) - Math.abs(b.due.getTime() - paidAt.getTime()));
        const target = candidates[0];
        if (!target) continue;

        const month = billMonth1(target.index);
        const year = billYear(target.index);
        const closingDate = calendar.closingDate(target.index);
        const start = calendar.windowStart(target.index);
        const total = await tx.transaction.aggregate({
          where: { creditCardId: card.id, date: { gte: start, lte: closingDate } },
          _sum: { amount: true },
        });
        const bill = await tx.creditCardBill.findUnique({
          where: { creditCardId_month_year: { creditCardId: card.id, month, year } },
        });
        if (bill?.status === "PAID") continue;
        await tx.creditCardBill.upsert({
          where: { creditCardId_month_year: { creditCardId: card.id, month, year } },
          create: {
            creditCardId: card.id,
            userId,
            month,
            year,
            closingDate,
            dueDate: target.due,
            totalAmount: Number(total._sum.amount ?? 0),
            status: "PAID",
            paidAt,
          },
          update: { status: "PAID", paidAt },
        });
        billsPaid++;
      }

      // The imported bill keeps the dates the bank printed, whatever the card's closing day says
      if (statementCard && importedBill) {
        const calendar = calendars.get(statementCard.id)!;
        const month = billMonth1(importedBill.index);
        const year = billYear(importedBill.index);
        const total = await tx.transaction.aggregate({
          where: {
            creditCardId: statementCard.id,
            date: { gte: calendar.windowStart(importedBill.index), lte: calendar.closingDate(importedBill.index) },
          },
          _sum: { amount: true },
        });
        const dates = {
          closingDate: calendar.closingDate(importedBill.index),
          dueDate: importedBill.dueDate,
          datesLocked: true,
          totalAmount: Number(total._sum.amount ?? 0),
        };
        await tx.creditCardBill.upsert({
          where: { creditCardId_month_year: { creditCardId: statementCard.id, month, year } },
          create: { creditCardId: statementCard.id, userId, month, year, status: "CLOSED", ...dates },
          update: dates,
        });
      }

      // Learned categories: "lembrar" on the review screen
      let rulesSaved = 0;
      for (const row of params.rows.filter((r) => r.remember && r.type === "EXPENSE")) {
        const pattern = normalizeMerchant(row.description);
        if (pattern.length < 3) continue;
        await tx.categoryRule.upsert({
          where: { userId_pattern: { userId, pattern } },
          create: {
            userId,
            pattern,
            category: row.customCategoryId ? "OTHER" : row.category,
            customCategoryId: row.customCategoryId,
          },
          update: {
            category: row.customCategoryId ? "OTHER" : row.category,
            customCategoryId: row.customCategoryId,
          },
        });
        rulesSaved++;
      }

      await tx.importBatch.update({
        where: { id: batch.id },
        data: { transactionCount: created.count },
      });

      revalidatePath("/");
      revalidatePath("/transactions");
      revalidatePath("/credit-cards");
      revalidatePath("/import");

      return {
        deleted: deleted.count,
        created: created.count - futureInstallments,
        futureInstallments,
        billsPaid,
        rulesSaved,
        skippedDuplicates: transactionRows.length - toCreate.length,
      };
    },
    { timeout: 30_000 },
  );
};

/** Undo a whole import: deletes the transactions it created (bills marked as paid stay paid) */
export const undoImport = async (batchId: string) => {
  const result = await getEffectiveUserId();
  if (!result) throw new Error("Unauthorized");
  const userId = result.effectiveUserId;
  const batch = await db.importBatch.findFirst({ where: { id: batchId, userId } });
  if (!batch) throw new Error("Importação não encontrada");
  await db.$transaction([
    db.transaction.deleteMany({ where: { importBatchId: batch.id, userId } }),
    db.importBatch.delete({ where: { id: batch.id } }),
  ]);
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/credit-cards");
  revalidatePath("/import");
};
