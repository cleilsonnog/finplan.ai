import { db } from "@/app/_lib/prisma";
import { sendPushToUser } from "@/app/_lib/send-push-notification";
import { getBillReminders, type BillReminder } from "@/app/_lib/bill-reminders";
import { NextResponse } from "next/server";

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || "finplanai";
const CRON_SECRET = process.env.CRON_SECRET || "";

async function sendWhatsApp(phone: string, message: string) {
  try {
    await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: phone,
          textMessage: { text: message },
        }),
      },
    );
  } catch (err) {
    console.error("Failed to send WhatsApp reminder:", err);
  }
}

export const GET = async (request: Request) => {
  // Verify cron secret (Vercel Cron sends this header)
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Use Brazil timezone (UTC-3) since all users are Brazilian
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }),
  );
  const currentDay = today.getDate();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
  );
  const daysInMonth = monthEnd.getDate();

  // Find active recurring expenses due today
  // For dueDay > daysInMonth (e.g. 31 in a 30-day month), treat as last day
  const expenses = await db.recurringExpense.findMany({
    where: {
      active: true,
      OR: [
        { dueDay: currentDay },
        // If today is last day of month, include all dueDay > daysInMonth
        ...(currentDay === daysInMonth
          ? [{ dueDay: { gt: daysInMonth } }]
          : []),
      ],
    },
    include: {
      transactions: {
        where: {
          date: { gte: monthStart, lte: monthEnd },
        },
        select: { id: true },
      },
    },
  });

  // Filter only unpaid ones
  const unpaid = expenses.filter((e) => e.transactions.length === 0);

  // Group by userId to send one message per user
  const byUser = new Map<string, typeof unpaid>();
  for (const expense of unpaid) {
    const list = byUser.get(expense.userId) || [];
    list.push(expense);
    byUser.set(expense.userId, list);
  }

  let whatsappSent = 0;
  let pushSent = 0;

  for (const [userId, userExpenses] of byUser) {
    const lines = userExpenses.map(
      (e) =>
        `- *${e.name}*: R$ ${Number(e.amount).toFixed(2).replace(".", ",")}`,
    );

    const message =
      `*Finplan.ai - Lembrete de vencimento*\n\n` +
      `Voce tem ${userExpenses.length === 1 ? "uma conta vencendo" : `${userExpenses.length} contas vencendo`} hoje:\n\n` +
      lines.join("\n") +
      `\n\nAcesse o app para marcar como pago.`;

    // Send WhatsApp if linked
    const link = await db.whatsAppLink.findUnique({ where: { userId } });
    if (link) {
      await sendWhatsApp(link.phone, message);
      whatsappSent++;
    }

    // Send push notification
    try {
      const pushBody =
        userExpenses.length === 1
          ? `${userExpenses[0].name}: R$ ${Number(userExpenses[0].amount).toFixed(2).replace(".", ",")}`
          : `Voce tem ${userExpenses.length} contas vencendo hoje`;

      const count = await sendPushToUser(userId, {
        title: "Lembrete de vencimento",
        body: pushBody,
        url: "/recurring",
      });
      if (count > 0) pushSent++;
    } catch {
      // Push failed, continue
    }
  }

  const bills = await sendBillReminders(today);

  return NextResponse.json({ whatsappSent, pushSent, bills });
};

const formatBRL = (value: number) =>
  `R$ ${value.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const formatDay = (date: Date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;

const whenLabel = (r: BillReminder) =>
  r.daysUntil === 0 ? "vence hoje" : `vence em ${r.daysUntil} dias (${formatDay(r.dueDate)})`;

// Credit card bills: 3 days before and on the due day, only unpaid bills with an amount
async function sendBillReminders(today: Date) {
  const reminders = await getBillReminders(today);

  const byUser = new Map<string, BillReminder[]>();
  for (const r of reminders) {
    byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  }

  let whatsappSent = 0;
  let pushSent = 0;

  for (const [userId, userBills] of byUser) {
    const lines = userBills.map(
      (r) => `- *${r.cardName}* (final ${r.lastFourDigits}): ${formatBRL(r.amount)}, ${whenLabel(r)}`,
    );
    const message =
      `*Finplan.ai - Fatura do cartao*\n\n` +
      `${userBills.length === 1 ? "Sua fatura" : "Suas faturas"}:\n\n` +
      lines.join("\n") +
      `\n\nDepois de pagar, marque a fatura como paga no app para ela entrar no saldo do mes.`;

    const link = await db.whatsAppLink.findUnique({ where: { userId } });
    if (link) {
      await sendWhatsApp(link.phone, message);
      whatsappSent++;
    }

    try {
      const first = userBills[0];
      const count = await sendPushToUser(userId, {
        title: "Fatura do cartão",
        body:
          userBills.length === 1
            ? `${first.cardName}: ${formatBRL(first.amount)}, ${whenLabel(first)}`
            : `${userBills.length} faturas vencendo: ${formatBRL(userBills.reduce((s, r) => s + r.amount, 0))}`,
        url: `/credit-cards?month=${first.closingPeriod}`,
      });
      if (count > 0) pushSent++;
    } catch {
      // Push failed, continue
    }
  }

  return { reminders: reminders.length, whatsappSent, pushSent };
}
