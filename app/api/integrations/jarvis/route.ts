import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getDashboardForUser } from "@/app/_data/get-dashboard";
import { getCreditCardSummaryForUser } from "@/app/_data/get-credit-card-summary";
import { getCreditCardBillsForUser } from "@/app/_data/get-credit-card-bills";
import { rateLimit } from "@/app/_lib/rate-limit";

// Read-only financial summary for the owner's personal assistant (JARVIS).
// Auth: "Authorization: Bearer <JARVIS_INTEGRATION_TOKEN>", bound to JARVIS_INTEGRATION_USER_ID.
// Nothing is written: bills are computed with persist: false.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

function isAuthorized(req: NextRequest, expected: string) {
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return timingSafeEqual(sha256(given), sha256(expected));
}

export async function GET(req: NextRequest) {
  const token = process.env.JARVIS_INTEGRATION_TOKEN;
  const userId = process.env.JARVIS_INTEGRATION_USER_ID;
  // Integration disabled unless both are configured (and the token is long enough)
  if (!token || token.length < 32 || !userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`jarvis:${ip}`, { maxRequests: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!isAuthorized(req, token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const requested = Number(req.nextUrl.searchParams.get("month"));
  const monthNum = requested >= 1 && requested <= 12 ? requested : now.getMonth() + 1;
  const month = String(monthNum).padStart(2, "0");
  const nextMonth = monthNum < 12 ? String(monthNum + 1).padStart(2, "0") : null;

  const [dashboard, cardSummary, bills, nextBills] = await Promise.all([
    getDashboardForUser(userId, month),
    getCreditCardSummaryForUser(userId, month),
    getCreditCardBillsForUser(userId, month, { persist: false }),
    nextMonth ? getCreditCardBillsForUser(userId, nextMonth, { persist: false }) : Promise.resolve([]),
  ]);

  const billView = (b: (typeof bills)[number]) => ({
    month: b.month,
    year: b.year,
    total: b.totalAmount,
    status: b.status, // OPEN | CLOSED | PAID | OVERDUE
    closingDate: b.closingDate,
    dueDate: b.dueDate,
    paidAt: b.paidAt,
  });

  const cards = cardSummary.cards.map(({ card, availableLimit, usagePercent }) => ({
    name: card.name,
    bank: card.bank,
    brand: card.brand,
    lastFourDigits: card.lastFourDigits,
    limit: card.limit,
    availableLimit,
    usagePercent,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    bills: [...bills, ...nextBills]
      .filter((b) => b.creditCardId === card.id)
      .map(billView),
  }));

  return NextResponse.json(
    {
      month: monthNum,
      year: now.getFullYear(),
      generatedAt: now.toISOString(),
      // Month totals (FinPlan's "saldo" is the month balance: deposits - expenses - investments)
      monthSummary: {
        balance: dashboard.balance,
        deposits: dashboard.depositsTotal,
        expenses: dashboard.expensesTotal,
        investments: dashboard.investmentsTotal,
        creditCardExpenses: dashboard.creditCardTotal,
      },
      cards,
      lastTransactions: dashboard.lastTransactions.slice(0, 8).map((t) => ({
        name: t.name,
        type: t.type,
        amount: t.amount,
        category: t.category,
        paymentMethod: t.paymentMethod,
        date: t.date,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
