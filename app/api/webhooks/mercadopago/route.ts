import { clerkClient } from "@clerk/nextjs/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createHmac } from "crypto";
import { NextResponse } from "next/server";

async function notifyTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Telegram notification failed:", err);
  }
}

function verifyWebhookSignature(
  request: Request,
  body: string,
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return false;

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId) return false;

  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [key, ...rest] = p.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === v1;
}

export const POST = async (request: Request) => {
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const body = await request.text();

  if (!verifyWebhookSignature(request, body)) {
    console.error("Mercado Pago webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { action: string; data: { id: string }; type: string };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.type !== "payment") {
    return NextResponse.json({ received: true });
  }

  try {
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    });
    const paymentClient = new Payment(client);
    const paymentData = await paymentClient.get({ id: event.data.id });

    if (
      paymentData.status !== "approved" ||
      paymentData.metadata?.plan_type !== "lifetime"
    ) {
      return NextResponse.json({ received: true });
    }

    const clerkUserId = paymentData.metadata?.clerk_user_id;
    if (!clerkUserId) {
      console.error("Mercado Pago webhook: no clerk_user_id in metadata");
      return NextResponse.json(
        { error: "Missing clerk_user_id" },
        { status: 400 },
      );
    }

    const clerk = await clerkClient();
    await clerk.users.updateUser(clerkUserId, {
      privateMetadata: {
        lifetimePurchase: true,
        mercadopagoPaymentId: String(paymentData.id),
      },
      publicMetadata: {
        subscriptionPlan: "premium",
      },
    });

    const amount = paymentData.transaction_amount ?? 14.99;
    await notifyTelegram(
      `<b>PIX Recebido!</b>\n\n` +
        `Valor: <b>R$ ${amount.toFixed(2)}</b>\n` +
        `Plano: Vitalicio Premium\n` +
        `Payment ID: ${paymentData.id}\n` +
        `Usuario: ${clerkUserId}`,
    );

    console.log(
      `Mercado Pago: lifetime activated for user ${clerkUserId}, payment ${paymentData.id}`,
    );
  } catch (err) {
    console.error("Mercado Pago webhook handler error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
};
