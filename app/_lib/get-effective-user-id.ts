import { auth } from "@clerk/nextjs/server";
import { cache } from "react";
import { db } from "./prisma";

interface EffectiveUserResult {
  effectiveUserId: string;
  realUserId: string;
  isSharedMember: boolean;
}

export const getEffectiveUserId = cache(
  async (): Promise<EffectiveUserResult | null> => {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const share = await db.accountShare.findUnique({
      where: { memberId: userId },
    });

    if (share) {
      return {
        effectiveUserId: share.ownerId,
        realUserId: userId,
        isSharedMember: true,
      };
    }

    return {
      effectiveUserId: userId,
      realUserId: userId,
      isSharedMember: false,
    };
  },
);
