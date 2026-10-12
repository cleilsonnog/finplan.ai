import Navbar from "@/app/_components/navbar";
import { db } from "@/app/_lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import WhatsAppLinkCard from "./_components/whatsapp-link-card";
import DeleteAccountCard from "./_components/delete-account-card";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const [whatsappLink, sharedMembership, user] = await Promise.all([
    db.whatsAppLink.findUnique({ where: { userId } }),
    db.accountShare.findUnique({ where: { memberId: userId }, select: { id: true } }),
    currentUser(),
  ]);

  return (
    <>
      <Navbar />
      <div className="space-y-6 p-6 sm:px-8">
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <div className="max-w-lg space-y-6">
          <WhatsAppLinkCard currentPhone={whatsappLink?.phone ?? null} />
          <DeleteAccountCard
            hasStripeSubscription={!!user?.privateMetadata?.stripeSubscriptionId}
            isSharedMember={!!sharedMembership}
          />
        </div>
      </div>
    </>
  );
}
