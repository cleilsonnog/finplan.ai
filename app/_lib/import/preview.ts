import { db } from "@/app/_lib/prisma";
import type { BillCalendar } from "@/app/_utils/credit-card-bill";
import { loadBillCalendar } from "@/app/_lib/bill-calendar";
import { categorizeExpenses, classifyLine, depositCategory } from "./categorize";
import { displayName, stripAccents } from "./normalize";
import type { OrphanTransaction, PreviewRow, StatementKind, StatementLine } from "./types";

interface BuildPreviewParams {
  userId: string;
  kind: StatementKind;
  lines: StatementLine[];
  /** Required for card statements: the card the bill belongs to */
  creditCard?: { id: string; closingDay: number; dueDay: number; lastFourDigits: string } | null;
  /** Due date printed on the card bill, used to know which bill the lines belong to */
  billDueDate?: Date | null;
  /** Last day of the purchase period printed on the bill */
  billPeriodEnd?: Date | null;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Value as it will be stored: card purchases positive, card credits negative (they lower the
 * bill); account lines are stored as positive amounts of their type.
 */
const storedValue = (line: StatementLine, kind: StatementKind) =>
  kind === "CREDIT_CARD" ? -line.amount : Math.abs(line.amount);

/**
 * Card bills list installments with the ORIGINAL purchase date and sometimes post a purchase
 * days late. Each line is re-dated so it lands in the bill being imported:
 * installments follow the calendar's installment dates; stray dates are pinned to the window.
 */
const dateForCardLine = (line: StatementLine, calendar: BillCalendar, targetBill: number) => {
  let date = line.date;
  if (line.installment && line.installment.number > 1) {
    date = calendar.installmentDates(line.date, line.installment.number)[line.installment.number - 1];
  }
  const bill = calendar.billIndexOf(date);
  if (bill === targetBill) return date;
  if (bill > targetBill) {
    const closing = new Date(calendar.closingDate(targetBill));
    closing.setHours(12, 0, 0, 0);
    return closing;
  }
  const start = new Date(calendar.windowStart(targetBill).getTime() + DAY);
  start.setHours(12, 0, 0, 0);
  return start;
};

export const buildPreview = async ({
  userId,
  kind,
  lines,
  creditCard,
  billDueDate,
  billPeriodEnd,
}: BuildPreviewParams): Promise<{ rows: PreviewRow[]; orphans: OrphanTransaction[] }> => {
  if (kind === "CREDIT_CARD" && !creditCard) throw new Error("Selecione o cartão da fatura");

  // Which bill is being imported: the one due on the printed due date (due day is stable even
  // when the bank moves the closing day). The printed period end becomes its real closing date.
  let targetBill: number | null = null;
  let calendar: BillCalendar | null = null;
  if (kind === "CREDIT_CARD" && creditCard) {
    calendar = await loadBillCalendar(creditCard);
    if (billDueDate) {
      targetBill = calendar.billIndexDueIn(billDueDate.getFullYear(), billDueDate.getMonth() + 1);
      if (billPeriodEnd) {
        calendar = calendar.with({ index: targetBill, closingDate: billPeriodEnd, dueDate: billDueDate });
      }
    } else {
      const counts = new Map<number, number>();
      for (const l of lines.filter((l) => !l.installment || l.installment.number === 1)) {
        const b = calendar.billIndexOf(l.date);
        counts.set(b, (counts.get(b) ?? 0) + 1);
      }
      targetBill = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }
  }

  const prepared = lines.map((line) => {
    const classification = classifyLine(line, kind);
    const date =
      calendar && targetBill !== null ? dateForCardLine(line, calendar, targetBill) : line.date;
    return { line, classification, date };
  });

  const [customCategories, userCards] = await Promise.all([
    db.customCategory.findMany({ where: { userId }, select: { id: true, name: true } }),
    db.creditCard.findMany({ where: { userId }, select: { id: true, name: true, bank: true } }),
  ]);

  // "PAGAMENTO FATURA SANTANDER" → the user's Santander card; a single card needs no matching
  const matchBillCard = (description: string) => {
    if (userCards.length === 1) return userCards[0].id;
    const text = stripAccents(description.toLowerCase());
    const found = userCards.find((c) =>
      [c.bank, c.name].some((s) => {
        const word = stripAccents(s.toLowerCase()).split(" ")[0];
        return word.length >= 3 && text.includes(word);
      }),
    );
    return found?.id ?? null;
  };

  // Categorize expenses in one batch (rules → history → keywords → AI)
  const expenseIdx = prepared
    .map((p, i) => (p.classification.action === "TRANSACTION" && p.classification.type === "EXPENSE" ? i : -1))
    .filter((i) => i >= 0);
  const guesses = await categorizeExpenses(
    userId,
    expenseIdx.map((i) => prepared[i].line.description),
    customCategories,
  );
  const guessByIndex = new Map(expenseIdx.map((i, k) => [i, guesses[k]]));

  // Duplicate detection: same file line imported before, or launched by hand / WhatsApp
  const dates = prepared.map((p) => p.date.getTime());
  // Card matching compares whole bills, so look a full cycle around the lines
  const margin = (kind === "CREDIT_CARD" ? 35 : 4) * DAY;
  const minDate = new Date(Math.min(...dates) - margin);
  const maxDate = new Date(Math.max(...dates) + margin);
  const [byExternalId, nearby, installments] = await Promise.all([
    db.transaction.findMany({
      where: { userId, externalId: { in: lines.map((l) => l.externalId) } },
      select: { id: true, name: true, externalId: true },
    }),
    db.transaction.findMany({
      where: {
        userId,
        date: { gte: minDate, lte: maxDate },
        ...(kind === "CREDIT_CARD" ? { creditCardId: creditCard!.id } : { creditCardId: null }),
      },
      select: { id: true, name: true, amount: true, date: true, type: true, installments: true },
    }),
    kind === "CREDIT_CARD"
      ? db.transaction.findMany({
          where: { userId, creditCardId: creditCard!.id, installments: { gt: 1 } },
          select: { id: true, name: true, amount: true, installments: true, installmentNumber: true },
        })
      : Promise.resolve([]),
  ]);
  const usedMatches = new Set<string>();

  // Hand-typed installments rarely have the bank's exact cents (R$ 778 in 10x is rounded
  // differently by the app and by the bank). Pair them up front, globally, closest first, so
  // one existing installment can't be claimed by a worse match that comes earlier in the file.
  const nearMatch = new Map<number, { id: string; name: string }>();
  if (kind === "CREDIT_CARD" && creditCard) {
    const exactAmounts = new Set(prepared.map((p) => storedValue(p.line, kind).toFixed(2)));
    const pairs: { index: number; tx: (typeof nearby)[number]; diff: number }[] = [];
    prepared.forEach(({ line, classification, date }, index) => {
      if (!line.installment || classification.action !== "TRANSACTION") return;
      if (byExternalId.some((t) => t.externalId === line.externalId)) return;
      const amount = storedValue(line, kind);
      const bill = calendar!.billIndexOf(date);
      for (const tx of nearby) {
        if (tx.installments < 2 || calendar!.billIndexOf(tx.date) !== bill) continue;
        // An exact twin elsewhere in the file is the better owner of this existing row
        if (exactAmounts.has(Number(tx.amount).toFixed(2)) && Math.abs(Number(tx.amount) - amount) >= 0.01) continue;
        const diff = Math.abs(Number(tx.amount) - amount);
        // 2% (at least R$ 0,15 for small installments, at most R$ 2)
        if (diff < 0.01 || diff > Math.min(2, Math.max(0.15, Math.abs(amount) * 0.02))) continue;
        pairs.push({ index, tx, diff });
      }
    });
    pairs.sort((x, y) => x.diff - y.diff);
    for (const { index, tx } of pairs) {
      if (nearMatch.has(index) || usedMatches.has(tx.id)) continue;
      nearMatch.set(index, { id: tx.id, name: tx.name });
      usedMatches.add(tx.id);
    }
  }

  const rows = prepared.map(({ line, classification, date }, i): PreviewRow => {
    const amount = Math.abs(line.amount);
    const value = storedValue(line, kind);
    const guess = guessByIndex.get(i);

    let duplicateOf: PreviewRow["duplicateOf"] = nearMatch.get(i) ?? null;
    const sameLine = byExternalId.find((t) => t.externalId === line.externalId);
    if (duplicateOf) {
      // already paired above (installment with cents difference)
    } else if (sameLine) {
      duplicateOf = { id: sameLine.id, name: sameLine.name };
    } else if (line.installment) {
      const match = installments.find(
        (t) =>
          !usedMatches.has(t.id) &&
          t.installments === line.installment!.total &&
          t.installmentNumber === line.installment!.number &&
          Math.abs(Number(t.amount) - value) < 0.05,
      );
      if (match) duplicateOf = { id: match.id, name: match.name };
    }
    if (!duplicateOf && classification.action === "TRANSACTION") {
      // Card: same bill + same amount (hand-typed installments often have another name, date
      // and count). Account: same amount within 3 days.
      const sameMoment = (t: { date: Date }) =>
        kind === "CREDIT_CARD" && creditCard
          ? calendar!.billIndexOf(t.date) === calendar!.billIndexOf(date)
          : Math.abs(t.date.getTime() - date.getTime()) <= 3 * DAY;
      const match = nearby.find(
        (t) =>
          !usedMatches.has(t.id) &&
          t.type === classification.type &&
          Math.abs(Number(t.amount) - value) < 0.01 &&
          sameMoment(t) &&
          // On a card, a one-off purchase never pairs with an installment (and vice versa)
          (kind !== "CREDIT_CARD" || !!line.installment === t.installments > 1),
      );
      if (match) duplicateOf = { id: match.id, name: match.name };
    }
    if (duplicateOf) usedMatches.add(duplicateOf.id);

    const category =
      classification.type === "EXPENSE"
        ? (guess?.category ?? "OTHER")
        : classification.type === "DEPOSIT"
          ? depositCategory(line.description)
          : "OTHER";

    return {
      externalId: line.externalId,
      date: date.toISOString(),
      description: line.description,
      name: displayName(line.description),
      amount,
      isCredit: kind === "CREDIT_CARD" && line.amount > 0,
      type: classification.type,
      category,
      customCategoryId: guess?.customCategoryId ?? null,
      categorySource: classification.type === "EXPENSE" ? (guess?.source ?? "default") : "keyword",
      paymentMethod: classification.paymentMethod,
      action: classification.action,
      installment: line.installment ?? null,
      billCardId: classification.action === "BILL_PAYMENT" ? matchBillCard(line.description) : null,
      note: line.ownTransfer
        ? "Transferência entre suas contas"
        : classification.action === "IGNORE"
          ? kind === "CREDIT_CARD"
            ? "Pagamento da fatura anterior"
            : "Ignorado"
          : null,
      cardSuffix: line.cardSuffix ?? null,
      // Lines from additional cards (spouse, online card) get a note so they're easy to tell apart
      notes:
        line.cardSuffix && creditCard && line.cardSuffix !== creditCard.lastFourDigits
          ? `Cartão final ${line.cardSuffix}`
          : null,
      duplicateOf,
      include: classification.action !== "IGNORE" && !duplicateOf,
    };
  });

  // Transactions already in the app for this bill that no line of the PDF claimed — usually old
  // hand-typed entries with wrong values. Listed so the user can delete them and the bill
  // in the app matches the bank's.
  let orphans: OrphanTransaction[] = [];
  if (kind === "CREDIT_CARD" && creditCard && targetBill !== null) {
    const claimed = new Set(rows.map((r) => r.duplicateOf?.id).filter(Boolean));
    orphans = nearby
      .filter((t) => !claimed.has(t.id) && calendar!.billIndexOf(t.date) === targetBill)
      .map((t) => ({ id: t.id, name: t.name, amount: Number(t.amount), date: t.date.toISOString() }));
  }

  return { rows, orphans };
};
