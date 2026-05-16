import Navbar from "@/app/_components/navbar";
import { db } from "@/app/_lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WhatsAppLinkCard from "./_components/whatsapp-link-card";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const whatsappLink = await db.whatsAppLink.findUnique({
    where: { userId },
  });

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6 sm:px-8">
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <div className="max-w-lg">
          <WhatsAppLinkCard currentPhone={whatsappLink?.phone ?? null} />
        </div>
      </div>
    </>
  );
}
