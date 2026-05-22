import { db } from "@/app/_lib/prisma";
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

  if (unpaid.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Group by userId to send one message per user
  const byUser = new Map<string, typeof unpaid>();
  for (const expense of unpaid) {
    const list = byUser.get(expense.userId) || [];
    list.push(expense);
    byUser.set(expense.userId, list);
  }

  let sent = 0;

  for (const [userId, userExpenses] of byUser) {
    // Find user's WhatsApp link
    const link = await db.whatsAppLink.findUnique({ where: { userId } });
    if (!link) continue;

    const lines = userExpenses.map(
      (e) =>
        `- *${e.name}*: R$ ${Number(e.amount).toFixed(2).replace(".", ",")}`,
    );

    const message =
      `*Finplan.ai - Lembrete de vencimento*\n\n` +
      `Voce tem ${userExpenses.length === 1 ? "uma conta vencendo" : `${userExpenses.length} contas vencendo`} hoje:\n\n` +
      lines.join("\n") +
      `\n\nAcesse o app para marcar como pago.`;

    await sendWhatsApp(link.phone, message);
    sent++;
  }

  return NextResponse.json({ sent });
};
