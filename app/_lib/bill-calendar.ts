import { db } from "@/app/_lib/prisma";
import { BillCalendar, toBillIndex } from "@/app/_utils/credit-card-bill";

/** Calendars for the given cards, with the dates of every locked bill loaded */
export const loadBillCalendars = async (
  cards: { id: string; closingDay: number; dueDay: number }[],
): Promise<Map<string, BillCalendar>> => {
  if (cards.length === 0) return new Map();
  const locked = await db.creditCardBill.findMany({
    where: { creditCardId: { in: cards.map((c) => c.id) }, datesLocked: true },
    select: { creditCardId: true, month: true, year: true, closingDate: true, dueDate: true },
  });
  return new Map(
    cards.map((card) => [
      card.id,
      new BillCalendar(
        card,
        locked
          .filter((b) => b.creditCardId === card.id)
          .map((b) => ({ index: toBillIndex(b.year, b.month), closingDate: b.closingDate, dueDate: b.dueDate })),
      ),
    ]),
  );
};

export const loadBillCalendar = async (card: { id: string; closingDay: number; dueDay: number }) =>
  (await loadBillCalendars([card])).get(card.id)!;
