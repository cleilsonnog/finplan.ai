import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/app/_lib/prisma";

export type ShareRole = "owner" | "member" | "none";

export interface ShareStatus {
  role: ShareRole;
  partnerName: string | null;
  partnerEmail: string | null;
  shareId: string | null;
}

export const getShareStatus = async (): Promise<ShareStatus> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check if user is an owner with a member
  const asOwner = await db.accountShare.findFirst({
    where: { ownerId: userId },
  });

  if (asOwner) {
    const client = await clerkClient();
    try {
      const member = await client.users.getUser(asOwner.memberId);
      return {
        role: "owner",
        partnerName:
          member.firstName && member.lastName
            ? `${member.firstName} ${member.lastName}`
            : member.emailAddresses[0]?.emailAddress ?? null,
        partnerEmail: member.emailAddresses[0]?.emailAddress ?? null,
        shareId: asOwner.id,
      };
    } catch {
      return {
        role: "owner",
        partnerName: null,
        partnerEmail: null,
        shareId: asOwner.id,
      };
    }
  }

  // Check if user is a member
  const asMember = await db.accountShare.findUnique({
    where: { memberId: userId },
  });

  if (asMember) {
    const client = await clerkClient();
    try {
      const owner = await client.users.getUser(asMember.ownerId);
      return {
        role: "member",
        partnerName:
          owner.firstName && owner.lastName
            ? `${owner.firstName} ${owner.lastName}`
            : owner.emailAddresses[0]?.emailAddress ?? null,
        partnerEmail: owner.emailAddresses[0]?.emailAddress ?? null,
        shareId: asMember.id,
      };
    } catch {
      return {
        role: "member",
        partnerName: null,
        partnerEmail: null,
        shareId: asMember.id,
      };
    }
  }

  return { role: "none", partnerName: null, partnerEmail: null, shareId: null };
};

export const getPendingInvitesForUser = async () => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return [];

  const invites = await db.accountShareInvite.findMany({
    where: { invitedEmail: email, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  // Enrich with owner info
  const enriched = await Promise.all(
    invites.map(async (invite) => {
      try {
        const owner = await client.users.getUser(invite.ownerId);
        return {
          ...invite,
          ownerName:
            owner.firstName && owner.lastName
              ? `${owner.firstName} ${owner.lastName}`
              : owner.emailAddresses[0]?.emailAddress ?? "Usuário",
        };
      } catch {
        return { ...invite, ownerName: "Usuário" };
      }
    }),
  );

  return enriched;
};
