/**
 * One-off migration: credit card purchases used to be stored with their date pushed
 * forward (+1 month, or +2 when bought after the closing day). Purchases now keep their
 * real date and the bill is derived from the closing day (app/_utils/credit-card-bill.ts).
 * This script reverts the push for transactions created while it was in place, then
 * recomputes the stored bill totals.
 *
 * Usage (dry-run by default — prints what would change):
 *   npx tsx scripts/migrate-cc-real-dates.ts --until 2026-10-10T03:00:00Z
 *   npx tsx scripts/migrate-cc-real-dates.ts --until 2026-10-10T03:00:00Z --apply
 *
 * --until: deploy time of the real-date code. Transactions created after it already have
 *          real dates and are left alone. Required.
 */
import { PrismaClient } from "@prisma/client";
import { billMonth1, billYear, closingDateOf, toBillIndex } from "../app/_utils/credit-card-bill";

const db = new PrismaClient();

// When each creation path started pushing dates (commit times, BRT)
const CUTOFFS = {
  appInstallments: new Date("2026-05-19T19:36:30-03:00"), // 6629fb1
  appSingle: new Date("2026-05-21T20:46:47-03:00"), // 3391aa7
  whatsappInstallments: new Date("2026-05-19T19:36:30-03:00"), // 6629fb1
  whatsappSingle: new Date("2026-06-10T17:34:03-03:00"), // 991c9fd
};
// Created this close after a cutoff → the code may not have been deployed yet; review manually
const DEPLOY_GRACE_MS = 2 * 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const untilArg = args[args.indexOf("--until") + 1];
if (!args.includes("--until") || !untilArg || Number.isNaN(Date.parse(untilArg))) {
  console.error("Missing/invalid --until <ISO date> (deploy time of the real-date code)");
  process.exit(1);
}
const until = new Date(untilArg);

const fmt = (d: Date) => d.toLocaleDateString("pt-BR");

const subtractMonths = (date: Date, months: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
};

async function main() {
  const host = (process.env.DATABASE_URL ?? "").replace(/\/\/[^@]*@/, "//***@").split("?")[0];
  console.log(`Database: ${host}`);
  console.log(`Mode: ${apply ? "APPLY" : "dry-run"} · until ${until.toISOString()}\n`);

  const cards = await db.creditCard.findMany({
    select: { id: true, name: true, closingDay: true, userId: true, updatedAt: true, createdAt: true },
  });
  const cardById = new Map(cards.map((c) => [c.id, c]));

  const transactions = await db.transaction.findMany({
    where: { creditCardId: { not: null }, createdAt: { lt: until } },
    orderBy: [{ creditCardId: "asc" }, { date: "asc" }],
    select: {
      id: true, name: true, date: true, amount: true, createdAt: true, updatedAt: true,
      creditCardId: true, installments: true, installmentNumber: true,
    },
  });

  const updates: { id: string; date: Date }[] = [];
  let skipped = 0;

  for (const tx of transactions) {
    const card = cardById.get(tx.creditCardId!)!;
    const viaWhatsapp = tx.name.endsWith("(WhatsApp)");
    const isInstallment = tx.installments > 1;
    const cutoff = viaWhatsapp
      ? isInstallment ? CUTOFFS.whatsappInstallments : CUTOFFS.whatsappSingle
      : isInstallment ? CUTOFFS.appInstallments : CUTOFFS.appSingle;

    if (tx.createdAt < cutoff) {
      skipped++;
      continue;
    }

    // A pushed date always lands after the creation day. A single purchase dated before it
    // was never pushed (e.g. created before the code was deployed, or fixed by hand)
    const createdDay = new Date(tx.createdAt);
    createdDay.setHours(0, 0, 0, 0);
    if (!isInstallment && tx.date < createdDay) {
      console.log(`  pula: ${tx.name} (${fmt(tx.date)}, criada ${fmt(tx.createdAt)}) — data anterior à criação, já é real`);
      skipped++;
      continue;
    }

    // The push kept the day of month: +2 months when the day was after closing, else +1
    const offset = tx.date.getDate() > card.closingDay ? 2 : 1;
    const newDate = subtractMonths(tx.date, offset);

    const flags: string[] = [];
    if (tx.createdAt.getTime() - cutoff.getTime() < DEPLOY_GRACE_MS) flags.push("logo após o corte");
    if (tx.date.getDate() >= 29) flags.push("fim de mês");
    if (tx.updatedAt.getTime() - tx.createdAt.getTime() > 60_000) flags.push("editada");
    if (card.updatedAt > tx.createdAt) flags.push("cartão alterado depois");

    console.log(
      [
        card.name.padEnd(14).slice(0, 14),
        tx.name.padEnd(32).slice(0, 32),
        isInstallment ? `${tx.installmentNumber}/${tx.installments}`.padEnd(6) : "à vista",
        `R$ ${Number(tx.amount).toFixed(2)}`.padStart(12),
        `${fmt(tx.date)} → ${fmt(newDate)}`,
        `criada ${fmt(tx.createdAt)}`,
        flags.length ? `⚠ ${flags.join(", ")}` : "",
      ].join("  "),
    );
    updates.push({ id: tx.id, date: newDate });
  }

  console.log(`\n${updates.length} transações a ajustar · ${skipped} já com data real (anteriores ao corte)`);

  if (!apply) {
    console.log("\nDry-run: nada foi alterado. Rode com --apply para gravar.");
    return;
  }

  await db.$transaction(updates.map((u) => db.transaction.update({ where: { id: u.id }, data: { date: u.date } })));
  console.log(`✔ ${updates.length} transações atualizadas`);

  // Stored bill totals were computed from the pushed dates — recompute from real dates
  const bills = await db.creditCardBill.findMany();
  let changedBills = 0;
  for (const bill of bills) {
    const card = cardById.get(bill.creditCardId);
    if (!card) continue;
    const index = toBillIndex(bill.year, bill.month);
    const start = new Date(closingDateOf(index - 1, card.closingDay).getTime() + 1);
    const end = closingDateOf(index, card.closingDay);
    const agg = await db.transaction.aggregate({
      where: { creditCardId: card.id, date: { gte: start, lte: end } },
      _sum: { amount: true },
    });
    const total = Number(agg._sum.amount ?? 0);
    if (total !== Number(bill.totalAmount)) {
      console.log(
        `Fatura ${card.name} ${billMonth1(index)}/${billYear(index)} (${bill.status}): ` +
          `R$ ${Number(bill.totalAmount).toFixed(2)} → R$ ${total.toFixed(2)}`,
      );
      await db.creditCardBill.update({ where: { id: bill.id }, data: { totalAmount: total } });
      changedBills++;
    }
  }
  console.log(`✔ ${changedBills} faturas recalculadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
