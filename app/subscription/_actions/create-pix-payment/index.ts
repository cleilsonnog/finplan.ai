"use server";

import { auth } from "@clerk/nextjs/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

export const createPixPayment = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    throw new Error("Mercado Pago access token not found");
  }

  const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });
  const payment = new Payment(client);

  const result = await payment.create({
    body: {
      transaction_amount: 14.99,
      description: "FinPlan.ai - Acesso Vitalicio Premium",
      payment_method_id: "pix",
      payer: {
        email: "pagamento@finplanai.com",
      },
      metadata: {
        clerk_user_id: userId,
        plan_type: "lifetime",
      },
    },
    requestOptions: {
      idempotencyKey: `pix-lifetime-${userId}-${Date.now()}`,
    },
  });

  const qrCode =
    result.point_of_interaction?.transaction_data?.qr_code ?? "";
  const qrCodeBase64 =
    result.point_of_interaction?.transaction_data?.qr_code_base64 ?? "";
  const paymentId = result.id;

  return { qrCode, qrCodeBase64, paymentId };
};
