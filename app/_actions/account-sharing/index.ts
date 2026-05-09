"use server";

import { db } from "@/app/_lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function requirePremiumUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  if (user.publicMetadata.subscriptionPlan !== "premium") {
    throw new Error("Premium plan required");
  }
  return { userId, user };
}

export const sendShareInvite = async (email: string) => {
  const { userId } = await requirePremiumUser();

  // Check if owner already has a member
  const existingShare = await db.accountShare.findFirst({
    where: { ownerId: userId },
  });
  if (existingShare) {
    throw new Error("Você já compartilha sua conta com alguém.");
  }

  // Check if owner is already a member of someone else's account
  const asMember = await db.accountShare.findUnique({
    where: { memberId: userId },
  });
  if (asMember) {
    throw new Error(
      "Você é membro de outra conta. Saia primeiro antes de convidar.",
    );
  }

  // Check for existing pending invite
  const existingInvite = await db.accountShareInvite.findFirst({
    where: { ownerId: userId, invitedEmail: email, status: "PENDING" },
  });
  if (existingInvite) {
    throw new Error("Já existe um convite pendente para este email.");
  }

  // Don't invite yourself
  const client = await clerkClient();
  const owner = await client.users.getUser(userId);
  const ownerEmail = owner.emailAddresses[0]?.emailAddress;
  if (ownerEmail === email) {
    throw new Error("Você não pode convidar a si mesmo.");
  }

  await db.accountShareInvite.create({
    data: {
      ownerId: userId,
      invitedEmail: email,
    },
  });

  revalidatePath("/");
};

export const acceptInvite = async (inviteId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const invite = await db.accountShareInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite || invite.status !== "PENDING") {
    throw new Error("Convite não encontrado ou já processado.");
  }

  // Verify email matches
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (userEmail !== invite.invitedEmail) {
    throw new Error("Este convite não é para você.");
  }

  // Check if user is already a member
  const existingShare = await db.accountShare.findUnique({
    where: { memberId: userId },
  });
  if (existingShare) {
    throw new Error("Você já é membro de outra conta.");
  }

  // Check if owner already has a member
  const ownerShare = await db.accountShare.findFirst({
    where: { ownerId: invite.ownerId },
  });
  if (ownerShare) {
    throw new Error("Esta conta já possui um membro.");
  }

  await db.$transaction([
    db.accountShare.create({
      data: {
        ownerId: invite.ownerId,
        memberId: userId,
      },
    }),
    db.accountShareInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED" },
    }),
  ]);

  revalidatePath("/");
};

export const rejectInvite = async (inviteId: string) => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const invite = await db.accountShareInvite.findUnique({
    where: { id: inviteId },
  });
  if (!invite || invite.status !== "PENDING") {
    throw new Error("Convite não encontrado ou já processado.");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const userEmail = user.emailAddresses[0]?.emailAddress;
  if (userEmail !== invite.invitedEmail) {
    throw new Error("Este convite não é para você.");
  }

  await db.accountShareInvite.update({
    where: { id: inviteId },
    data: { status: "REJECTED" },
  });

  revalidatePath("/");
};

export const revokeShare = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const share = await db.accountShare.findFirst({
    where: { ownerId: userId },
  });
  if (!share) {
    throw new Error("Nenhum compartilhamento ativo.");
  }

  await db.accountShare.delete({ where: { id: share.id } });
  revalidatePath("/");
};

export const leaveShare = async () => {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const share = await db.accountShare.findUnique({
    where: { memberId: userId },
  });
  if (!share) {
    throw new Error("Você não é membro de nenhuma conta.");
  }

  await db.accountShare.delete({ where: { id: share.id } });
  revalidatePath("/");
};
