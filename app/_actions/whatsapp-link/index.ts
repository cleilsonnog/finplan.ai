"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function linkWhatsApp(phone: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Normalize phone: remove spaces, dashes, parentheses, keep only digits
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 10 || normalized.length > 13) {
    throw new Error("Numero invalido. Use o formato: 5522999998888");
  }

  // Check if phone is already linked to another user
  const existing = await db.whatsAppLink.findUnique({
    where: { phone: normalized },
  });
  if (existing && existing.userId !== userId) {
    throw new Error("Este numero ja esta vinculado a outra conta.");
  }

  await db.whatsAppLink.upsert({
    where: { userId },
    create: { userId, phone: normalized },
    update: { phone: normalized },
  });

  revalidatePath("/settings");
}

export async function unlinkWhatsApp() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.whatsAppLink.delete({ where: { userId } }).catch(() => {});
  // Also clean up any pending session
  const link = await db.whatsAppLink.findUnique({ where: { userId } });
  if (link) {
    await db.whatsAppSession.delete({ where: { phone: link.phone } }).catch(() => {});
  }

  revalidatePath("/settings");
}

export async function getWhatsAppLink() {
  const { userId } = await auth();
  if (!userId) return null;

  return db.whatsAppLink.findUnique({ where: { userId } });
}
